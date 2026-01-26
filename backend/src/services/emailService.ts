
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async (to: string, subject: string, html: string) => {
    if (!process.env.EMAIL_USER) {
        console.warn('[EMAIL] EMAIL_USER not set. Skipping:', subject);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"CareConnect System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } catch (error) {
        console.error('[EMAIL] Failed to send:', error);
    }
};

// --- Patient Emails ---

export const sendPatientSlotConfirmationEmail = async (
    patientEmail: string,
    patientName: string,
    doctorName: string,
    time: string,
    urgency: string,
    link: string = 'http://localhost:5173/dashboard'
) => {
    const badgeColor = urgency === 'EMERGENCY' ? '#dc3545' : urgency === 'HIGH' ? '#ffc107' : '#28a745';
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">Appointment Confirmed</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your consultation has been successfully scheduled.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${new Date(time).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Urgency:</strong> <span style="background-color: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${urgency}</span></p>
        </div>

        <p>Please login to your dashboard to join the video consultation at the scheduled time.</p>
        
        <div style="text-align: center; margin-top: 20px;">
            <a href="${link}" style="background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
        
        <p style="font-size: 12px; color: #777; margin-top: 30px;">CareConnect Automated System</p>
    </div>`;

    await sendEmail(patientEmail, 'Your Appointment Slot is Confirmed – CareConnect', html);
};

export const sendPatientSlotUpdateEmail = async (
    patientEmail: string,
    patientName: string,
    oldTime: string,
    newTime: string
) => {
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">Important: Appointment Rescheduled</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>We strictly prioritize critical care. Due to an incoming <strong>Emergency Case</strong> requiring immediate attention, your appointment slot has been automatically shifted.</p>
        
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; border: 1px solid #ffeeba;">
            <p style="margin: 5px 0; text-decoration: line-through;"><strong>Old Slot:</strong> ${new Date(oldTime).toLocaleString()}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>New Slot:</strong> <strong>${new Date(newTime).toLocaleString()}</strong></p>
        </div>

        <p>We sincerely apologize for this inconvenience and appreciate your cooperation in helping us save lives.</p>
        
        <p style="font-size: 12px; color: #777; margin-top: 30px;">CareConnect Automated System</p>
    </div>`;

    await sendEmail(patientEmail, 'Important: Your Appointment Slot Has Been Updated', html);
};


// --- Doctor Emails ---

export const sendDoctorNewAppointmentEmail = async (
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    time: string,
    urgency: string,
    symptoms: string
) => {
    const isEmergency = urgency === 'EMERGENCY' || urgency === 'HIGH';
    const headerColor = isEmergency ? '#dc3545' : '#0d6efd';

    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: ${headerColor}; border-bottom: 2px solid ${headerColor}; padding-bottom: 10px;">New Appointment Assigned</h2>
        <p>Hello Dr. ${doctorName},</p>
        <p>A new patient has been assigned to your schedule.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date(time).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Urgency:</strong> <span style="background-color: ${isEmergency ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 4px;">${urgency}</span></p>
        </div>

        <div style="margin-top: 15px;">
             <strong>Patient Report / Symptoms:</strong>
             <p style="background-color: #eee; padding: 10px; border-radius: 4px; font-style: italic;">"${symptoms}"</p>
        </div>
        
        <p style="font-size: 12px; color: #777; margin-top: 30px;">CareConnect Automated System</p>
    </div>`;

    await sendEmail(doctorEmail, 'New Appointment Assigned – CareConnect', html);
};

export const sendDoctorSlotUpdateEmail = async (
    doctorEmail: string,
    doctorName: string,
    time: string,
    newEmergencyPatientName: string
) => {
    const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
        <h2 style="color: #ffc107; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">Schedule Updated: Emergency Injection</h2>
        <p>Hello Dr. ${doctorName},</p>
        <p>Your schedule has been modified to accommodate an <strong>Emergency</strong> case.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Time Slot:</strong> ${new Date(time).toLocaleString()}</p>
            <p><strong>Note:</strong> Previous appointment moved. Please attend to <strong>${newEmergencyPatientName}</strong> immediately at this time.</p>
        </div>

        <p style="font-size: 12px; color: #777; margin-top: 30px;">CareConnect Automated System</p>
    </div>`;

    await sendEmail(doctorEmail, 'Schedule Update – CareConnect', html);
};
