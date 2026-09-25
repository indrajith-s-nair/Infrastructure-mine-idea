import logging
import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger('dpi_core.emails')


def _resolve_recipient(email: str) -> tuple[str, str]:
    """
    Safely resolves recipient email.
    If the email address uses an internal/simulated domain (@dpip.gov.in, @gov.in, @example.gov.in),
    it routes the notification to NOTIFICATION_FALLBACK_EMAIL or EMAIL_HOST_USER to prevent 550 Mailer-Daemon bounces.
    """
    if not email:
        fallback = getattr(settings, 'NOTIFICATION_FALLBACK_EMAIL', '') or getattr(settings, 'EMAIL_HOST_USER', '')
        return fallback, ""

    unroutable_domains = ['@dpip.gov.in', '@gov.in', '@example.gov.in', '@example.com', '@test.com', '@localhost']
    is_unroutable = any(email.lower().endswith(d) for d in unroutable_domains)
    fallback = getattr(settings, 'NOTIFICATION_FALLBACK_EMAIL', '') or getattr(settings, 'EMAIL_HOST_USER', '')

    if is_unroutable and fallback and fallback.lower() != email.lower():
        return fallback, f"[Officer: {email}] "

    return email, ""


def _send_email_async(subject: str, text_content: str, html_content: str, recipients: list[str]):
    """Dispatches email in a background thread to prevent blocking HTTP request execution."""
    if not recipients:
        return

    def _task():
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or 'Digital Public Infrastructure Portal <notifications@dpip.gov.in>'
            resolved_recipients = []
            prefix = ""
            for r in recipients:
                target_email, pfx = _resolve_recipient(r)
                if target_email and target_email not in resolved_recipients:
                    resolved_recipients.append(target_email)
                if pfx and not prefix:
                    prefix = pfx

            if not resolved_recipients:
                return

            final_subject = f"{prefix}{subject}" if prefix else subject
            msg = EmailMultiAlternatives(
                subject=final_subject,
                body=text_content,
                from_email=from_email,
                to=resolved_recipients,
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info(f"Successfully sent email '{final_subject}' to {resolved_recipients}")
        except Exception as e:
            logger.error(f"Failed to dispatch email '{subject}' to {recipients}: {e}", exc_info=True)

    thread = threading.Thread(target=_task, daemon=True)
    thread.start()


def _get_citizen_email(complaint) -> str:
    """Retrieves citizen's verified email address, falling back to notification email."""
    if complaint.user and complaint.user.email:
        target, _ = _resolve_recipient(complaint.user.email)
        return target or complaint.user.email
    return getattr(settings, 'NOTIFICATION_FALLBACK_EMAIL', '') or getattr(settings, 'EMAIL_HOST_USER', '') or 'notifications@dpip.gov.in'


def _build_html_template(title: str, subtitle: str, badge_text: str, badge_color: str, details_rows: list[tuple[str, str]], action_button: tuple[str, str] = None) -> str:
    """Builds a responsive government-tier HTML email template."""
    rows_html = "".join([
        f"""<tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 600; width: 35%;">{label}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a; font-weight: 500;">{value}</td>
        </tr>""" for label, value in details_rows
    ])

    btn_html = ""
    if action_button:
        btn_label, btn_url = action_button
        btn_html = f"""
        <div style="text-align: center; margin-top: 28px; margin-bottom: 10px;">
            <a href="{btn_url}" style="background: linear-gradient(135deg, #1d4ed8, #4338ca); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);">
                {btn_label} &rarr;
            </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 28px; text-align: left; border-bottom: 3px solid #3b82f6;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; margin-bottom: 6px;">
                      DPIP National Portal
                    </span>
                    <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
                      Digital Public Infrastructure
                    </h1>
                    <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">Citizen Grievance Redressal & Frontline Governance System</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; background: {badge_color}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px;">
                      {badge_text}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px;">
              <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 18px; font-weight: 800;">{title}</h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 13px; line-height: 1.5;">{subtitle}</p>

              <!-- Details Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background-color: #fafaf9; margin-bottom: 16px;">
                {rows_html}
              </table>

              {btn_html}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 11px; font-weight: 600;">
                Digital Public Infrastructure Grievance Portal &bull; Government of India
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                This is an automated system notification. For security, do not share OTPs or sensitive identification numbers.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def send_complaint_registration_email(complaint):
    """
    Trigger: When a citizen registers a complaint.
    Recipient: Citizen.
    """
    citizen_email = _get_citizen_email(complaint)
    tracking_code = complaint.tracking_code
    portal_url = f"http://localhost:3000/track?code={tracking_code}"

    subject = f"🏛️ [DPIP] Grievance Registered Successfully - {tracking_code}"

    rows = [
        ("Tracking Code", f"<strong style='color: #1d4ed8;'>{tracking_code}</strong>"),
        ("Description", complaint.description[:250] + ("..." if len(complaint.description) > 250 else "")),
        ("Department", complaint.department_category or "Under AI Classification"),
        ("Location / Address", complaint.address or "Jurisdictional Area"),
        ("LGD Code", complaint.lgd_jurisdiction_code or "N/A"),
        ("AI Urgency Score", f"{complaint.ai_severity_score:.1f} / 100"),
        ("Current Status", "<span style='color: #d97706; font-weight: 700;'>PENDING TRIAGE</span>"),
    ]

    html_content = _build_html_template(
        title="Grievance Registered Successfully",
        subtitle=f"Your grievance has been safely logged in the DPIP system. You can track real-time inspection, frontline officer assignment, and final resolution using your unique tracking code.",
        badge_text="RECEIVED",
        badge_color="#2563eb",
        details_rows=rows,
        action_button=("Track Grievance Live", portal_url)
    )

    text_content = f"""DPIP Grievance Portal
Your grievance has been successfully registered.

Tracking Code: {tracking_code}
Description: {complaint.description}
Department: {complaint.department_category or 'N/A'}
Address: {complaint.address}
Status: PENDING

Track status live at: {portal_url}
"""
    _send_email_async(subject, text_content, html_content, [citizen_email])


def send_complaint_assigned_email(complaint):
    """
    Trigger: When registered complaint is assigned to an officer (via AI or Central Desk Dispatch).
    Recipients:
      1. Assigned Officer (Alert to review & act)
      2. Citizen (Status progress update)
    """
    if not complaint.assigned_officer:
        return

    officer = complaint.assigned_officer
    officer_email = officer.user.email
    officer_designation = officer.officer_designation
    department_name = officer.department_name
    tracking_code = complaint.tracking_code

    # 1. Send Alert to Assigned Frontline Officer
    officer_portal_url = "http://localhost:3000/officer"
    officer_subject = f"🚨 [DPIP Action Required] New Grievance Assigned - {tracking_code}"

    officer_rows = [
        ("Tracking Code", f"<strong style='color: #dc2626;'>{tracking_code}</strong>"),
        ("Citizen Address", complaint.address),
        ("LGD Jurisdiction", officer.lgd_jurisdiction_code or complaint.lgd_jurisdiction_code or "N/A"),
        ("AI Urgency Score", f"<strong style='color: #dc2626;'>{complaint.ai_severity_score:.1f} / 100</strong>"),
        ("Description", complaint.description),
        ("Citizen Name", complaint.user.name if complaint.user else "Citizen"),
        ("Citizen Contact", complaint.user.phone_number if complaint.user else "N/A"),
    ]

    officer_html = _build_html_template(
        title=f"New Task Assigned: {officer_designation}",
        subtitle=f"A citizen grievance has been officially routed and assigned to your jurisdiction. Please review the ticket and initiate on-site inspection.",
        badge_text="ACTION REQUIRED",
        badge_color="#dc2626",
        details_rows=officer_rows,
        action_button=("Open Officer Field Portal", officer_portal_url)
    )

    officer_text = f"""DPIP Officer Portal
New Complaint Assigned: {tracking_code}
Address: {complaint.address}
Urgency Score: {complaint.ai_severity_score}
Description: {complaint.description}

Please log in to your field portal: {officer_portal_url}
"""
    _send_email_async(officer_subject, officer_text, officer_html, [officer_email])

    # 2. Send Progress Notification to Citizen
    citizen_email = _get_citizen_email(complaint)
    citizen_subject = f"📋 [DPIP Update] Your Grievance {tracking_code} Has Been Assigned to an Officer"
    track_url = f"http://localhost:3000/track?code={tracking_code}"

    citizen_rows = [
        ("Tracking Code", f"<strong style='color: #1d4ed8;'>{tracking_code}</strong>"),
        ("Assigned Authority", f"<strong>{officer_designation}</strong>"),
        ("Department", department_name),
        ("Jurisdiction / Badge", f"{officer.jurisdiction_area or 'Local Area'} &bull; Badge: {officer.badge_number or 'GOV-IND'}"),
        ("Current Status", "<span style='color: #2563eb; font-weight: 700;'>OFFICER ASSIGNED</span>"),
    ]

    citizen_html = _build_html_template(
        title="Frontline Officer Assigned",
        subtitle=f"Your grievance has been assigned to the designated jurisdictional frontline officer for verification and field redressal.",
        badge_text="ASSIGNED",
        badge_color="#2563eb",
        details_rows=citizen_rows,
        action_button=("Track Resolution Status", track_url)
    )

    citizen_text = f"""DPIP Grievance Portal
Your grievance {tracking_code} has been assigned to {officer_designation} ({department_name}).

Track live status at: {track_url}
"""
    _send_email_async(citizen_subject, citizen_text, citizen_html, [citizen_email])


def send_complaint_status_change_email(complaint, previous_status: str, new_status: str, notes: str = None):
    """
    Trigger: When status of complaint changes (IN_PROGRESS, RESOLVED, REJECTED, REASSIGNED).
    Recipient: Citizen.
    """
    citizen_email = _get_citizen_email(complaint)
    tracking_code = complaint.tracking_code
    track_url = f"http://localhost:3000/complaints/track/{tracking_code}"

    status_labels = {
        'IN_PROGRESS': ('Under Active Field Investigation', '#2563eb', 'ACCEPTED & IN PROGRESS'),
        'RESOLVED': ('Grievance Resolved & Verified', '#16a34a', 'RESOLVED & VERIFIED'),
        'REJECTED': ('Grievance Closed / Declined', '#dc2626', 'DECLINED'),
        'REASSIGNED': ('Administrative Re-Triage in Progress', '#9333ea', 'REASSIGNING'),
        'REOPENED': ('Grievance Reopened for Priority Re-Triage', '#d97706', 'REOPENED'),
    }

    title, badge_color, badge_text = status_labels.get(new_status, (f'Status Updated: {new_status}', '#475569', new_status))
    subject = f"🔔 [DPIP Status Update] Grievance {tracking_code} is now {badge_text}"

    rows = [
        ("Tracking Code", f"<strong style='color: #1d4ed8;'>{tracking_code}</strong>"),
        ("New Status", f"<strong style='color: {badge_color};'>{badge_text}</strong>"),
    ]

    if complaint.assigned_officer:
        rows.append(("Responsible Officer", complaint.assigned_officer.officer_designation))

    if new_status == 'RESOLVED':
        rows.append(("Resolution Date", complaint.resolved_at.strftime('%d %B %Y, %I:%M %p') if complaint.resolved_at else "Today"))
        rows.append(("Action Taken Report (ATR)", complaint.action_taken_report or notes or "Verified on-site resolution complete."))
    elif notes:
        rows.append(("Official Remarks", str(notes)))

    html_content = _build_html_template(
        title=title,
        subtitle=f"The status of your grievance {tracking_code} has been updated in the National Digital Public Infrastructure Portal.",
        badge_text=badge_text,
        badge_color=badge_color,
        details_rows=rows,
        action_button=("View Verification & Proof", track_url)
    )

    text_content = f"""DPIP Grievance Portal
Status Update for Grievance: {tracking_code}
New Status: {badge_text}
Remarks: {notes or 'No additional remarks'}

View details at: {track_url}
"""
    _send_email_async(subject, text_content, html_content, [citizen_email])
