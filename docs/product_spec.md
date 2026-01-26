# Product Specification: CareConnect Live

## 1. MVP Scope

### Must-Have (MVP)
- **Authentication**: Email/Password Registration & Login for Doctors and Patients.
- **Profiles**: Basic profile management (Patient: Demographics; Doctor: Specialty, Bio).
- **Doctor Discovery**: List doctors with specialty filters.
- **Appointments**: View availability slots, Book appointment, Cancel appointment.
- **Consultation Room**: Real-time Chat interface (text).
- **Consultation Context**:
    - Patient Pre-consultation Form (Symptoms, Severity).
    - Doctor View: Patient details + Pre-form + History.
- **Outcomes**: Doctor Notes, Diagnosis, Auto-summary (Stub/Simple).

### Nice-to-Have (Post-MVP)
- Video/Audio calling (Start with Chat for MVP).
- File attachments (Lab reports).
- Payment Gateway integration.
- Advanced AI summary generation.
- Real-time notification system (Push/Email).

## 2. Key User Flows

### Patient Flows
1.  **Registration**: Sign up as Patient -> Profile Completion.
2.  **Booking**: Search Doctor -> View Profile -> Select Date/Time -> Confirm.
3.  **Pre-Consultation**: Upcoming Appointment -> Fill Intake Form (Symptoms/History).
4.  **Consultation**: Join Active Appointment -> Chat with Doctor -> End.
5.  **Review**: View Past Consultations -> See Doctor Notes & Summary.

### Doctor Flows
1.  **Onboarding**: Sign up as Doctor -> Set Specialty & Availability.
2.  **Dashboard**: View "Today's Schedule".
3.  **Consultation**: Open Patient Card -> Review Intake Form -> Chat -> Write Diagnosis -> Complete.
4.  **History**: Search Patient -> View previous consults.

## 3. Data Entities

- **User**: Base entity for auth (ID, Email, Role).
- **PatientProfile**: Application-specific patient data.
- **DoctorProfile**: Specialty, availability rules.
- **Appointment**: Link between Patient & Doctor at a specific time (Status: Scheduled, Completed, Cancelled).
- **Consultation**: The actual medical encounter record (Notes, Transcript, Summary).
- **IntakeForm**: Patient-submitted pre-visit data.
