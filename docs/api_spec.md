# API Contract (REST)

## Standards
- Base URL: `/api/v1`
- Content-Type: `application/json`
- Errors: `{"detail": "Error message"}`

## Endpoints

### Authentication
- `POST /auth/register`
    - Body: `{email, password, role, name}`
    - Response: `{id, email, role}`
- `POST /auth/login`
    - Body: `{username (email), password}`
    - Response: `{access_token, token_type}`

### Doctors
- `GET /doctors`
    - Query: `specialty` (optional)
    - Response: `[{id, name, specialty, availability}]`
- `GET /doctors/{id}`
    - Response: `{id, name, specialty, bio, availability_slots}`

### Appointments
- `POST /appointments`
    - Body: `{doctor_id, start_time, pre_consultation_form: {...}}`
    - Response: `{id, status, start_time}`
- `GET /appointments`
    - Query: `role` (implied by token), `status`
    - Response: `[{id, doctor_name, patient_name, time, status}]`
- `PATCH /appointments/{id}/cancel`
    - Response: `{status: "cancelled"}`

### Consultations
- `GET /consultations/{id}`
    - Response: `appointment_details + chat_history + notes`
- `POST /consultations/{id}/notes` (Doctor only)
    - Body: `{diagnosis, advice, medical_notes}`
    - Response: `{id, updated_at}`
- `POST /consultations/{id}/complete`
    - Triggers auto-summary generation.
    - Response: `{status: "completed", summary: "..."}`

### Chat (WebSocket)
- `WS /ws/chat/{appointment_id}`
    - Messages: `{sender: "doctor"|"patient", content: "..."}`
