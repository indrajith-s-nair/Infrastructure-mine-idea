import os
from complaints.gemini_service import analyze_and_assign_complaint_with_gemini

res = analyze_and_assign_complaint_with_gemini("There is a power cut near my house, no electricity since 2 hours.", "Delhi", [])
print(res)
