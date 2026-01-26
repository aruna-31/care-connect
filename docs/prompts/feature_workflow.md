# Feature Iteration Workflow

When I ask for a new feature, follow this systematic workflow:

## 1. Requirements & Edge Cases
- Restate the user's request to confirm understanding.
- Identify at least 3 edge cases (e.g., "What if the user is offline?", "What if input is empty?", "Permission errors").

## 2. Minimal Code Changes (Proposal)
- Don't write full code yet.
- List the files to touch.
- Describe the change in pseudo-code or bullet points.
- *Wait for user confirmation if the change is complex.*

## 3. Database & API (The Foundation)
- Update `schema.sql` if data structures change.
- Create/Update Backend Models/Types.
- Create/Update Backend `routes` and `controllers`.
- **Validation**: Add Zod schemas for new inputs.

## 4. Frontend Implementation
- Update API client/hooks.
- Create/Update UI Components.
- Connect State/Context.

## 5. Verification
- **Tests**: Propose 1-2 unit tests or a manual test plan.
- **Local Run**: Explain how to verify it works (e.g., "Login as doctor, go to /dashboard, click X").
