# Smart Emergency-Aware Digital Consultation Platform
## System Architecture & Project Report

### 1. Executive Summary
This project is a sophisticated **digital healthcare platform** designed to prioritize critical care through intelligent automation. Unlike standard booking apps, it features an **Emergency-Aware Engine** that analyzes patient symptoms in real-time to detect urgency, automatically recommends the right specialist, and dynamically reallocates appointments to ensure high-priority cases are treated immediately. It includes secure video consultations and automated prescription delivery, offering a complete end-to-end medical workflow.

---

### 2. System Architecture

The system follows a **Monolithic Service-Oriented Architecture** (modularized for scalability) backed by a robust RDBMS.

*   **Frontend**: React (Vite) + TypeScript + TailwindCSS
    *   Responsive UI for Patients and Doctors.
    *   Real-time WebRTC Video interface.
*   **Backend**: Node.js + Express + TypeScript
    *   **Core API**: RESTful endpoints for Auth, Booking, and Records.
    *   **Intelligence Layer**: Services for Urgency Calculation and Recommendation.
    *   **Real-time Layer**: Socket.io for Signaling (Video) and Notifications.
    *   **Job Systems**: Email (Nodemailer) and PDF Generation (PDFKit).
*   **Database**: PostgreSQL
    *   Relational data model (ACID compliant) for secure scheduling transactions.
*   **Infrastructure**: Docker & Docker Compose
    *   Containerized deployment for consistency.

#### Architectural Diagram Concept
`[Client (React)] <-> [Load Balancer / API Gateway] <-> [Node.js Backend] <-> [PostgreSQL]`
                                                                    `^`
                                                                    `|`
                                                          `[Socket.io Signaling]`

---

### 3. Key Components & Modules

#### A. Intelligent Booking Engine
*   **Urgency Detection**: Analyzes severity (1-5) and keywords (e.g., "chest pain", "breathing") to classify cases as `NORMAL`, `MEDIUM`, `HIGH`, or `EMERGENCY`.
*   **Specialist Recommendation**: Maps symptoms (e.g., "rash", "migraine") to specific specializations (Dermatologist, Neurologist) automatically if the patient doesn't select a doctor.
*   **Dynamic Scheduling**:
    *   Implements a priority-queue mechanisms.
    *   **Bumping Logic**: If an `EMERGENCY` case arrives and no slots are free, the system identifies a `NORMAL` priority appointment, re-schedules it to a later slot, notifies that patient, and allocates the immediate slot to the emergency case.

#### B. Telemedicine Suite
*   **Secure Authentication**: Role-based access (JWT) ensuring patients cannot access doctor panels.
*   **Video Consultation**: Peer-to-peer secure video calls using WebRTC and Socket.io for signaling. No third-party video APIs; built from scratch.
*   **Digital Prescriptions**:
    *   Doctors input diagnosis and med logic.
    *   System generates a professional PDF.
    *   System automatically emails it to the patient.

---

### 4. Database Schema Overview

The database is normalized to 3NF.

*   **`users`**: Central identity (Support for `doctor` and `patient` roles). Stores hashed passwords and contact info.
*   **`doctor_profiles`**: Extends users. Stores `specialty`, `license_number`, and `availability`.
*   **`appointments`**: The core link. Tracks `urgency_level`, `status`, `original_start_time` (for bumped audits), and `reschedule_reason`.
*   **`intake_forms`**: Stores medical snapshot per appointment (`symptoms`, `severity`, `history`).
*   **`consultation_records`**: Stores clinical outcomes (`diagnosis`, `advice`, `medicines` in JSONB).
*   **`notifications`**: Async alerts for patients (e.g., "Your appointment was moved").

---

### 5. API Design (RESTful)

#### Authentication
*   `POST /auth/register` - Smart registration (detects Doctor vs Patient payload).
*   `POST /auth/login` - Returns JWT.

#### Appointments & Urgency
*   `POST /appointments`
    *   **Input**: `symptoms`, `severity`, `time`.
    *   **Logic**: Auto-calculates urgency. If `EMERGENCY` & full, triggers **Slot Reallocation Algorithm**.
    *   **Output**: `urgencyScore`, `assignedDoctor`.
*   `GET /appointments` - List filtered by role.

#### Consultation
*   `POST /consultations/:id/prescription` - Saves medical data, generates PDF, triggers Email.

#### Real-Time (Socket)
*   **Events**: `join-room`, `offer`, `answer`, `ice-candidate` (Standard WebRTC flow).

---

### 6. End-to-End Workflow

1.  **Patient Registration**: User signs up. If Doctor, extra license/specialty fields are required.
2.  **Smart Booking**:
    *   Patient enters "Severe chest pain", Severity: 5.
    *   System detects `EMERGENCY`.
    *   System maps "chest pain" -> `Cardiologist`.
    *   System checks slots. If Dr. Smith (Cardiologist) is booked by a routine checkup, the routine checkup is bumped +1 hour.
    *   Emergency appointment confirmed instantly.
3.  **Consultation**:
    *   At appointed time, Doctor and Patient join the **Video Room** (WebRTC).
    *   They communicate in real-time.
4.  **Completion**:
    *   Doctor enters diagnosis and medicines in the dashboard.
    *   System saves record -> Generates PDF -> Emails Patient.
5.  **Feedback Loop**: The database now holds the medical history for future reference.

---
*Generated for Final Year Project / Technical Documentation*
