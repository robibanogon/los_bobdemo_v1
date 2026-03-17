Build an MVP Loan Origination System (LOS) web app based on:
- /Users/robi/Documents/GitHub/los_bobdemo/Plan/Plan_phase_guide.md

Step 1 (MANDATORY): Do NOT code yet. First produce a complete plan + architecture diagrams.

Your output must include:

1) Plan (comprehensive but simple)
- What you will build (scope summary)
- MVP phases (MVP / Nice-to-have / Optional)
- Module-by-module build steps (frontend, backend, database)
- Deliverables checklist (app, DB schema, seed data, memo export, audit log, README)

2) Architecture (MUST include graphics)
- Provide 2 Mermaid diagrams:
  A) End-to-end flow: User → UI → API → DB/Files → Outputs
  B) Technology view: Frontend, Backend, DB, File Storage, Agent Review, PDF/HTML export

3) Design Specs
- Data model: User, Application, Document, Analysis, Decision, AuditLog (key fields + relationships)
- API list: endpoints for login, applications CRUD, status changes, document upload, run agent review, analysis, decision, generate memo, audit log
- UI pages: login, list, intake, docs, agent review, analysis, decision, memo export, audit log
- RBAC + status flow: who can do what and allowed status transitions

Rules:
- Follow requirements.md exactly (don’t add new scope unless marked “Optional”).
- If something is missing, make reasonable assumptions and list them.
- Use bullet points. Keep it readable.

Start by reading /Users/robi/Documents/GitHub/los_bobdemo/Plan/Requirements.md and output the plan + diagrams + specs.