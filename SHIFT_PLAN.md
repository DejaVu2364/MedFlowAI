# Plan to Shift to Gemini 2.5 Flash

## 1. Goal
Transition all AI-powered features in the MedFlow application to use the `gemini-2.5-flash` model (standardized from existing usage) to optimize for speed and efficiency, replacing any usage of `gemini-2.5-pro` where applicable.

## 2. Implementation Steps
-   **Consolidate Model Constants:** Updated `services/geminiService.ts` to define `proModel` as `gemini-2.5-flash`. This effectively routes all complex queries (summarization, structured discharge summaries, SOAP generation) to the faster model.
-   **Verify Compatibility:** The Flash model supports the same `responseSchema` (JSON mode) capabilities as Pro, ensuring features like "Structured Discharge Summary" and "Triage" continue to output valid JSON.

## 3. Usage Review Findings
A full automated E2E workflow review was conducted covering:
1.  **Patient Registration (Reception):**
    -   AI Triage (Classify Complaint): **Working** (uses Flash).
    -   Form Validation: **Verified**.
2.  **Clinical Workflow:**
    -   Vitals Entry: **Verified**.
    -   Rounds (AI Scribe & Suggestions): **Verified** (now uses Flash for SOAP generation).
3.  **Discharge:**
    -   Navigation to Discharge Summary works.
    -   *Note:* Automated generation of discharge summary relies on session persistence which is limited in the test environment, but the code logic correctly calls the Flash model.

## 4. Next Steps
-   Monitor for rate limits, as consolidating all traffic to one model might impact quota.
-   If "hallucinations" increase in complex tasks (like Discharge Summary), consider reverting specific functions back to a Pro model or `gemini-1.5-pro`.
