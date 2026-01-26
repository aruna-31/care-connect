# Role-Based System Fixes - Summary

## Overview
This document summarizes all the changes made to implement strict role-based behavior in the doctor-patient consultation application.

## A. Authentication & JWT Changes

### Backend (`backend/src/controllers/authController.ts`)
- **JWT Payload Updated**: Changed from `{ id, email, role }` to `{ id, role }` as per requirements
- **Login Endpoint**: Now generates JWT with only `id` and `role`
- **Register Endpoint**: Now returns JWT token and user data (auto-login after registration)
- **Added Debugging**: Console logs for JWT payload and user data

### Frontend (`frontend/src/pages/Auth/Login.tsx`)
- **Real API Integration**: Replaced mock login with actual API call to `/api/v1/auth/login`
- **Error Handling**: Proper error messages displayed to user
- **Debugging**: Console logs for login flow

### Frontend (`frontend/src/pages/Auth/Register.tsx`)
- **Real API Integration**: Replaced mock registration with actual API call
- **Auto-Login**: Automatically logs in user after successful registration
- **Error Handling**: Proper error messages displayed

## B. Database Schema

The existing schema already meets requirements:
- ✅ `users.role` has CHECK constraint: `CHECK (role IN ('doctor', 'patient'))`
- ✅ `appointments.patient_id` references `users.id`
- ✅ `appointments.doctor_id` references `users.id`

**No schema changes needed** - the existing schema is correct.

## C. Backend APIs

### 1. Booking API (`POST /api/appointments`)
**File**: `backend/src/controllers/appointmentController.ts`

**Changes**:
- ✅ Already reads `patient_id` from JWT (`req.user.id`)
- ✅ Inserts appointment with `patient_id`, `doctor_id`, `start_time`, `status`
- ✅ Added debugging logs for appointment creation

**Flow**:
1. Extract `patient_id` from JWT token
2. Validate request body
3. Auto-assign doctor if not provided (based on symptoms)
4. Create appointment record
5. Create intake form
6. Create consultation record stub
7. Return appointment details

### 2. Fetch Appointments API (`GET /api/appointments`)
**File**: `backend/src/controllers/appointmentController.ts`

**Changes**:
- ✅ **Fixed SQL Injection Vulnerability**: Replaced string interpolation with parameterized queries
- ✅ **Role-Aware Filtering**: 
  - If `user.role === "patient"`: `WHERE patient_id = $1`
  - If `user.role === "doctor"`: `WHERE doctor_id = $1`
- ✅ **Added Debugging**: Console logs for user role, SQL query, and results

**SQL Queries**:
```sql
-- For Patients
SELECT a.id, a.start_time, a.status, a.urgency_level,
       u.full_name as other_party_name,
       u.role as other_party_role
FROM appointments a
JOIN users u ON u.id = a.doctor_id
WHERE a.patient_id = $1
ORDER BY a.start_time ASC

-- For Doctors
SELECT a.id, a.start_time, a.status, a.urgency_level,
       u.full_name as other_party_name,
       u.role as other_party_role
FROM appointments a
JOIN users u ON u.id = a.patient_id
WHERE a.doctor_id = $1
ORDER BY a.start_time ASC
```

## D. Frontend Auth State

### AuthContext (`frontend/src/context/AuthContext.tsx`)
**User Object Structure**:
```typescript
{
  id: string;        // UUID from backend (converted to string)
  email: string;
  name: string;
  role: "doctor" | "patient";
}
```

**Storage**:
- Token stored in `localStorage.getItem('token')`
- User data stored in `localStorage.getItem('user')`
- Available globally via `useAuth()` hook

## E. Role-Based Dashboard UI

### Dashboard Component (`frontend/src/pages/Dashboard/Dashboard.tsx`)

**Patient View**:
- ✅ Shows "Book Appointment" button
- ✅ Shows "Your Appointments" heading
- ✅ Lists appointments where `patient_id = user.id`
- ✅ Displays doctor name for each appointment

**Doctor View**:
- ✅ **Hides** "Book Appointment" button (never shown)
- ✅ Shows "Upcoming Patient Appointments" heading
- ✅ Lists appointments where `doctor_id = user.id`
- ✅ Displays patient name for each appointment

**Additional Improvements**:
- ✅ Fixed infinite loading state
- ✅ Proper error handling with retry button
- ✅ "No appointments" message when empty
- ✅ Refresh button to manually refetch
- ✅ Auto-refetch after booking (via query invalidation)
- ✅ Added debugging console logs

## F. Appointment Display Fix

### Changes Made:
1. **Fixed Loading State**: Replaced infinite "Loading..." with proper loading indicator
2. **Error Handling**: Shows error message with retry button if fetch fails
3. **Empty State**: Shows appropriate message when no appointments found
4. **Auto-Refresh**: After booking, appointments list automatically refreshes
5. **Query Key**: Includes `user.id` in query key for proper caching

### Data Flow:
```
1. User logs in → JWT stored → User data stored
2. Dashboard loads → useQuery fetches appointments
3. Backend receives request → Extracts user.id and user.role from JWT
4. Backend queries database based on role:
   - Patient: WHERE patient_id = user.id
   - Doctor: WHERE doctor_id = user.id
5. Results returned → Frontend displays appointments
6. User books appointment → POST /api/appointments
7. Appointment created → Query invalidated → Dashboard refetches
8. Updated list displayed immediately
```

## G. Validation & Debugging

### Backend Console Logs:
- `[LOGIN]` - User login attempts and JWT payload
- `[REGISTER]` - User registration and JWT payload
- `[AUTH MIDDLEWARE]` - Token verification
- `[GET ME]` - User profile fetch
- `[CREATE APPOINTMENT]` - Appointment creation
- `[GET APPOINTMENTS]` - Appointment fetching with role and SQL query

### Frontend Console Logs:
- `[LOGIN]` - Login attempts and responses
- `[REGISTER]` - Registration attempts and responses
- `[DASHBOARD]` - User info, appointment fetching, and results
- `[APPOINTMENT DETAIL]` - Booking attempts and responses

## Key Files Modified

### Backend:
1. `backend/src/controllers/authController.ts` - JWT payload, register response
2. `backend/src/controllers/appointmentController.ts` - Role-aware queries, SQL injection fix
3. `backend/src/middleware/auth.ts` - Added debugging logs

### Frontend:
1. `frontend/src/pages/Auth/Login.tsx` - Real API integration
2. `frontend/src/pages/Auth/Register.tsx` - Real API integration, auto-login
3. `frontend/src/pages/Dashboard/Dashboard.tsx` - Role-based UI, loading fixes
4. `frontend/src/pages/Appointments/AppointmentDetail.tsx` - Query invalidation after booking

## Testing Checklist

✅ **JWT Payload**: Contains only `id` and `role`
✅ **Patient Login**: Can see "Book Appointment" button
✅ **Doctor Login**: Cannot see "Book Appointment" button
✅ **Patient Appointments**: Only sees their own appointments
✅ **Doctor Appointments**: Only sees appointments assigned to them
✅ **Booking Flow**: Appointment appears immediately after booking
✅ **SQL Injection**: Fixed with parameterized queries
✅ **Error Handling**: Proper error messages displayed
✅ **Loading States**: No infinite loading

## Data Flow: Booking → DB → Dashboard

### Step-by-Step Flow:

1. **Patient Books Appointment**:
   ```
   Frontend: POST /api/v1/appointments
   Body: { startTime, patientName, email, symptoms, ... }
   Headers: Authorization: Bearer <JWT>
   ```

2. **Backend Receives Request**:
   ```
   Middleware extracts JWT → Decodes to { id: patient_id, role: "patient" }
   Controller reads req.user.id → Uses as patient_id
   ```

3. **Database Insert**:
   ```sql
   INSERT INTO appointments (patient_id, doctor_id, start_time, status, urgency_level)
   VALUES ($1, $2, $3, 'scheduled', $4)
   -- $1 = patient_id from JWT
   -- $2 = doctor_id (from request or auto-assigned)
   ```

4. **Response Sent**:
   ```
   { status: 'success', data: { id, status, assignedDoctor, ... } }
   ```

5. **Frontend Updates**:
   ```
   Query invalidated → useQuery refetches → GET /api/v1/appointments
   ```

6. **Backend Fetches**:
   ```
   JWT decoded → { id: patient_id, role: "patient" }
   SQL: SELECT * FROM appointments WHERE patient_id = $1
   ```

7. **Dashboard Displays**:
   ```
   Appointments list updated → Patient sees new appointment
   ```

## Security Improvements

1. **SQL Injection Prevention**: All queries now use parameterized queries
2. **Role-Based Access**: Backend enforces role-based filtering
3. **JWT Security**: Minimal payload (only id and role)
4. **Input Validation**: Zod schemas validate all inputs

## Next Steps (Optional Enhancements)

- Add unit tests for role-based logic
- Add integration tests for appointment flow
- Add rate limiting for appointment booking
- Add appointment cancellation functionality
- Add appointment rescheduling functionality
