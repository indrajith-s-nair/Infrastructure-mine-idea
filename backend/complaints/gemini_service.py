import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded from project root or parent directories
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

logger = logging.getLogger(__name__)

OFFICIAL_DEPARTMENTS = [
    "Sanitation & Solid Waste Management",
    "Public Works Department (PWD)",
    "Water Supply & Sewerage Board",
    "Electricity & Power Distribution",
    "Town & Country Planning",
    "Public Health & Medical Services",
    "Revenue & Land Administration",
    "Law & Order (Police)",
    "School Education Department",
]

# Domain specifications for authentic frontline officer designations
OFFICER_HANDLING_DOMAINS = {
    "Junior Engineer (JE) - Public Works Department (PWD)": "Roads, potholes, craters, broken pavement, concrete slab subsidence, road repair, public works infrastructure, civil works.",
    "Junior Engineer (JE) - Electricity & Power Distribution": "Power cuts, transformer explosions, live wire hazards, electricity outages, street light failures, power line snapping.",
    "Assistant Engineer (AE)": "Major road infrastructure, structural asphalt engineering, bridge repairs, PWD engineering sub-divisions.",
    "Sanitary Inspector": "Solid waste, overflowing community garbage bins, choked street sewers, unhygienic waste dumping, street sweeping debris, public hygiene.",
    "Station House Officer (SHO)": "Law & order, traffic jams due to accidents, emergency ambulance blockage, illegal vehicle parking on transit corridors, public nuisance, transit security.",
    "Ward Officer": "Footpath commercial encroachments, illegal advertising hoardings, civic zoning infractions, municipal ward administration.",
    "Assistant Town Planner": "Unauthorized construction, commercial encroachments, building stability hazards, master plan non-compliance.",
    "Patwari": "Village revenue land, pasture (Gauchar) land encroachments, debris dumping on government parcels, land record demarcation.",
    "Revenue Inspector": "Land boundary demarcations, government land occupation disputes, revenue circle disputes.",
    "Village Administrative Officer (VAO)": "Rural village land parcels, water body encroachments, village administrative verification.",
    "Medical Officer In-Charge (MO)": "Public health hazards, dengue and mosquito vector breeding in stagnant water, epidemic risks, municipal clinic hygiene.",
    "Block Education Officer (BEO)": "Government school building safety, hazardous exposed wiring or electrical boards in schools, perimeter wall collapse, school sanitation.",
    "Headmaster": "School compound upkeep, student safety infrastructure, classroom hazards, mid-day meal cleanliness.",
    "Village Development Officer (VDO)": "Village approach roads, rural culverts, panchayat infrastructure, village drainage.",
    "Panchayat Secretary": "Gram Panchayat amenities, rural public facilities, rural community sanitation.",
}


def _get_officer_scope(designation, dept):
    # Handle overlapping designations like JE across different departments
    combined = f"{designation} - {dept}"
    if combined in OFFICER_HANDLING_DOMAINS:
        return OFFICER_HANDLING_DOMAINS[combined]
    return OFFICER_HANDLING_DOMAINS.get(designation, dept)


def _extract_officer_meta(off):
    if isinstance(off, dict):
        designation = off.get('designation', '') or off.get('officer_designation', '')
        dept = off.get('department_name', '')
        return {
            'id': off.get('id'),
            'email': off.get('email', ''),
            'designation': designation,
            'department_name': dept,
            'jurisdiction_area': off.get('jurisdiction_area', ''),
            'scope': off.get('scope') or _get_officer_scope(designation, dept)
        }
    else:
        user_email = getattr(off.user, 'email', '') if hasattr(off, 'user') and off.user else ''
        designation = getattr(off, 'officer_designation', '') or getattr(off, 'designation', '')
        dept = getattr(off, 'department_name', '')
        area = getattr(off, 'jurisdiction_area', '')
        return {
            'id': getattr(off, 'id', None),
            'email': user_email,
            'designation': designation,
            'department_name': dept,
            'jurisdiction_area': area,
            'scope': _get_officer_scope(designation, dept)
        }


def analyze_and_assign_complaint_with_gemini(description: str, address: str = "", candidate_officers: list = None) -> dict:
    """
    Analyzes citizen complaint text using Google Gemini API to simultaneously:
    1. Determine ai_severity_score (1.0 to 100.0) and urgency_level (CRITICAL, HIGH, MEDIUM, LOW).
    2. Classify department_category.
    3. Evaluate candidate officers and their specific handling areas to decide which officer deserves this complaint.
    4. Provide ai_analysis_summary detailing why the score was assigned and why this officer was selected.
    """
    api_key = os.environ.get('GEMINI_API_KEY', '').strip()

    if candidate_officers is None:
        candidate_officers = []

    normalized_officers = [_extract_officer_meta(o) for o in candidate_officers]

    # Format officer roster for Gemini
    officer_options_text = ""
    for idx, off in enumerate(normalized_officers, start=1):
        off_id = off['id']
        off_email = off['email']
        designation = off['designation']
        dept = off['department_name']
        area = off['jurisdiction_area']
        scope = off['scope']
        officer_options_text += f"{idx}. [ID: {off_id}] {designation} ({dept})\n   Email: {off_email} | Area: {area}\n   Handling Scope: {scope}\n\n"

    if not api_key or not description:
        return {
            "ai_severity_score": 50.0,
            "department_category": _match_closest_department(description),
            "urgency_level": "MEDIUM",
            "assigned_officer_id": None,
            "assigned_officer_email": "",
            "ai_analysis_summary": "GEMINI API is not working properly (No API Key).",
        }

    prompt = f"""You are the official AI Triage & Dispatch Engine for a Government Digital Public Infrastructure (DPIP) Grievance Portal.

A citizen has registered the following civic grievance:
Citizen Complaint:
\"\"\"{description}\"\"\"

Location / Address:
\"\"\"{address}\"\"\"

Available Frontline Officers & Their Handling Scope (DUTIES):
{officer_options_text if officer_options_text else "No specific candidate list provided."}

YOUR TASK:
1. Examine the complaint type and determine the exact urgency and severity score (0 to 100).
   The severity risk MUST be calculated carefully by considering the potential harm, public disruption, and scale of the issue:
   - 85-100: CRITICAL (Immediate risk to life, collapse, live electricity hazard, major ambulance blockage, severe accidents)
   - 65-84: HIGH (Major public hazard, massive road crater, toxic sewage/waste overflow, significant traffic jam, complete power outage)
   - 40-64: MEDIUM (Broken paver, street garbage, illegal commercial board, routine maintenance, minor or localized power cut)
   - 0-39: LOW (Minor cosmetic repair, routine inspection)
Ensure you carefully evaluate the true impact of the grievance before calculating the severity score. The severity risk must be calculated properly based on these criteria.

CRITICAL INSTRUCTION FOR OFFICER ASSIGNMENT:
2. Decide which Frontline Officer strictly deserves this complaint based on what problems the officer handles (their DUTIES / Handling Scope). Do NOT guess. You MUST strictly align the complaint type with the officer's department.
- A "power cut", "electricity issue", or "live wire" MUST go to an electricity officer (like Junior Engineer - Electricity & Power Distribution). NEVER assign these to a Police Station House Officer.
- A "traffic jam", "crime", or "law & order" issue MUST go to a Station House Officer (SHO) or Police. NEVER assign these to an engineer or sanitary inspector.
- A "garbage", "waste", or "drainage" issue MUST go to a Sanitary Inspector.
- A "road repair" or "pothole" MUST go to a Junior Engineer or Assistant Engineer in Public Works Department (PWD).
Choose from the available officers list above. Return their exact ID and Email. YOU MUST ENSURE THE CHOSEN OFFICER'S DEPARTMENT MATCHES THE ISSUE TYPE.

3. Determine the matching Department Category from the official list. This MUST correspond directly to the officer's department you selected.

Output ONLY a valid JSON object matching this schema strictly:
{{
  "ai_severity_score": <number between 0 and 100>,
  "urgency_level": "<CRITICAL | HIGH | MEDIUM | LOW>",
  "department_category": "<matching department name>",
  "assigned_officer_id": <officer ID integer or null>,
  "assigned_officer_email": "<officer email or empty string>",
  "ai_analysis_summary": "<concise 1-2 sentence officer triage brief explaining why this score was assigned and why this officer was selected to handle this issue>"
}}
"""
    models_to_try = [
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash'
    ]

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        last_error = None

        for model_name in models_to_try:
            parsed = None
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        'response_mime_type': 'application/json',
                        'temperature': 0.1,
                    }
                )
                raw_text = (response.text or "").strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                elif raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                parsed = json.loads(raw_text.strip())
            except Exception as model_err:
                logger.warning(f"Gemini API {model_name} failed: {model_err}")
                last_error = model_err
                continue
            
            if not parsed:
                continue
            
            # If we reached here, the parsing succeeded
            try:
                score = float(parsed.get('ai_severity_score', 50.0))
                score = max(0.0, min(100.0, score))

                if score >= 85:
                    urgency = 'CRITICAL'
                elif score >= 65:
                    urgency = 'HIGH'
                elif score >= 40:
                    urgency = 'MEDIUM'
                else:
                    urgency = 'LOW'

                dept = parsed.get('department_category', '').strip()
                if dept not in OFFICIAL_DEPARTMENTS:
                    dept = _match_closest_department(dept or description)

                assigned_id = parsed.get('assigned_officer_id')
                assigned_email = parsed.get('assigned_officer_email', '').strip()

                # Verify officer exists in candidate list
                officer_match = None
                if assigned_id:
                    officer_match = next((o for o in normalized_officers if str(o.get('id')) == str(assigned_id)), None)
                if not officer_match and assigned_email:
                    officer_match = next((o for o in normalized_officers if o.get('email', '').lower() == assigned_email.lower()), None)

                chosen_id = officer_match['id'] if officer_match else None

                return {
                    "ai_severity_score": round(score, 1),
                    "department_category": dept,
                    "urgency_level": urgency,
                    "assigned_officer_id": chosen_id,
                    "assigned_officer_email": officer_match.get('email') if officer_match else assigned_email,
                    "ai_analysis_summary": parsed.get('ai_analysis_summary', 'AI triaged based on citizen description.').strip(),
                }
            except Exception as model_err:
                logger.warning(f"Gemini API {model_name} processing error: {model_err}")
                last_error = model_err
                continue

        if last_error:
            logger.warning(f"Gemini API model calls fallback: {last_error}")
            return _fallback_heuristic_analysis_and_assignment(
                description=description,
                address=address,
                candidate_officers=candidate_officers
            )

    except Exception as exc:
        logger.warning(f"Gemini client setup error: {exc}. Falling back to internal heuristics.")
        return _fallback_heuristic_analysis_and_assignment(
            description=description,
            address=address,
            candidate_officers=candidate_officers
        )


def analyze_complaint_with_gemini(description: str, address: str = "") -> dict:
    """Backward compatibility wrapper."""
    return analyze_and_assign_complaint_with_gemini(description, address, [])

def transcribe_audio_with_gemini(audio_path: str) -> str:
    """Uses Gemini to transcribe an audio file and translate to English."""
    from google import genai
    from google.genai import types
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logger.warning("No GEMINI_API_KEY found, cannot transcribe audio.")
        return ""
        
    try:
        client = genai.Client(api_key=api_key)
        
        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()

        suffix = os.path.splitext(audio_path)[1].lower()
        mime_map = {
            '.mp3': 'audio/mp3',
            '.wav': 'audio/wav',
            '.m4a': 'audio/m4a',
            '.ogg': 'audio/ogg',
            '.webm': 'audio/webm',
        }
        audio_mime = mime_map.get(suffix, 'audio/webm')
        
        prompt = (
            "You are a speech-to-text and translation engine for citizen complaints. "
            "Accurately transcribe the spoken audio. If the speaker uses a regional Indian language "
            "(Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, etc.), translate it to clear, fluent English. "
            "Return ONLY the plain text transcript/translation without any markdown formatting or meta-comments."
        )
        
        models_to_try = [
            'gemini-3.1-flash-lite',
            'gemini-3.8-flash'
        ]

        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime),
                        prompt
                    ]
                )
                if response.text and response.text.strip():
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"Gemini transcription model {model_name} failed: {e}")
                continue

    except Exception as e:
        logger.error(f"Audio transcription failed: {e}")
        
    return ""



def _match_closest_department(text: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ['garbage', 'waste', 'trash', 'clean', 'drain', 'drainage', 'gutter', 'sanitary', 'sewer', 'sewage', 'smell', 'stench', 'carcass', 'sweeping']):
        return "Sanitation & Solid Waste Management"
    if any(w in text_lower for w in ['wire', 'electric', 'power', 'spark', 'transformer', 'pole', 'current', 'shock', 'light']):
        return "Electricity & Power Distribution"
    if any(w in text_lower for w in ['drinking water', 'pipeline', 'tank', 'borewell', 'water contamination', 'valves']):
        return "Water Supply & Sewerage Board"
    if any(w in text_lower for w in ['road', 'pothole', 'bridge', 'pavement', 'tar', 'asphalt', 'divider', 'crater', 'footpath', 'culvert', 'slab']):
        return "Public Works Department (PWD)"
    if any(w in text_lower for w in ['encroach', 'building', 'illegal construct', 'plaza', 'zoning', 'hoarding', 'banner', 'vendor']):
        return "Town & Country Planning"
    if any(w in text_lower for w in ['dengue', 'mosquito', 'hospital', 'clinic', 'fever', 'medical', 'epidemic', 'stagnant water']):
        return "Public Health & Medical Services"
    if any(w in text_lower for w in ['police', 'crime', 'nuisance', 'theft', 'traffic', 'fight', 'patrol', 'ambulance', 'parked', 'blocking']):
        return "Law & Order (Police)"
    if any(w in text_lower for w in ['school', 'teacher', 'student', 'classroom', 'meal', 'schoolhouse']):
        return "School Education Department"
    if any(w in text_lower for w in ['land', 'revenue', 'patwari', 'khata', 'mutation', 'gauchar']):
        return "Revenue & Land Administration"
    return "Sanitation & Solid Waste Management" if 'pipe' in text_lower else "Public Works Department (PWD)"


def _fallback_heuristic_analysis_and_assignment(description: str, address: str, candidate_officers: list) -> dict:
    """Deterministic fallback triage and officer assignment with intelligent scope ranking."""
    text = description.lower()

    score = 50.0
    summary = "Civic grievance registered for jurisdictional verification."

    # Critical keywords
    if any(w in text for w in ['hanging wire', 'electric shock', 'live wire', 'sparking', 'explosion', 'fire hazard', 'bridge collapse', 'open manhole', 'casualty', 'death']):
        score = 95.0
        summary = "CRITICAL HAZARD: Immediate public safety risk detected by triage heuristics."
    elif any(w in text for w in ['crater', 'ambulance', 'hospital', 'epidemic', 'dengue', 'flood', 'burst', 'massive pothole', 'sewage', 'overflow', 'complete power outage']):
        score = 80.0
        summary = "HIGH PRIORITY: Severe civic disruption affecting traffic, transit, or public health."
    elif any(w in text for w in ['garbage', 'dirty', 'broken light', 'water leak', 'stench', 'pothole', 'overflow', 'hoarding', 'encroachment', 'drainage', 'gutter', 'traffic jam', 'power cut', 'electricity', 'accident']):
        score = 60.0
        summary = "MEDIUM PRIORITY: Standard municipal repair and maintenance required."
    else:
        score = 35.0
        summary = "LOW PRIORITY: Routine public grievance slated for regular inspection."

    dept = _match_closest_department(description)

    urgency = "LOW"
    if score >= 85:
        urgency = "CRITICAL"
    elif score >= 65:
        urgency = "HIGH"
    elif score >= 40:
        urgency = "MEDIUM"

    # Match officer heuristic based on handling scope and keywords
    assigned_officer_id = None
    assigned_officer_email = ""

    if candidate_officers:
        # Score each officer based on token overlap in designation, scope, and department
        def score_officer(off):
            off_score = 0
            off_dept = off.get('department_name', '').lower()
            off_desig = off.get('designation', '').lower()
            off_scope = off.get('scope', '').lower()

            if off_dept == dept.lower():
                off_score += 10
            elif dept.split()[0].lower() in off_dept:
                off_score += 5

            for token in text.split():
                clean_tok = token.strip(',.!?;"\'')
                if len(clean_tok) > 3:
                    if clean_tok in off_scope:
                        off_score += 3
                    if clean_tok in off_desig:
                        off_score += 4
            return off_score

        ranked_officers = sorted(candidate_officers, key=score_officer, reverse=True)
        chosen = ranked_officers[0]
        assigned_officer_id = chosen.get('id')
        assigned_officer_email = chosen.get('email', '')

    return {
        "ai_severity_score": score,
        "department_category": dept,
        "urgency_level": urgency,
        "assigned_officer_id": assigned_officer_id,
        "assigned_officer_email": assigned_officer_email,
        "ai_analysis_summary": summary,
    }
