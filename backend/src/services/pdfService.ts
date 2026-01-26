import PDFDocument from 'pdfkit';

interface PrescriptionData {
    patientName: string;
    doctorName: string;
    date: string;
    diagnosis: string;
    medicines: Array<{ name: string; dosage: string; duration: string }>;
    advice: string;
}

export const generatePrescriptionPDF = (data: PrescriptionData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('CareConnect - Medical Prescription', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date(data.date).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Doctor & Patient Info
        doc.text(`Doctor: Dr. ${data.doctorName}`);
        doc.text(`Patient: ${data.patientName}`);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Diagnosis
        doc.fontSize(14).text('Diagnosis:', { underline: true });
        doc.fontSize(12).text(data.diagnosis);
        doc.moveDown();

        // Medicines
        doc.fontSize(14).text('Medicines:', { underline: true });
        doc.fontSize(12);
        data.medicines.forEach((med, index) => {
            doc.text(`${index + 1}. ${med.name} - ${med.dosage} (${med.duration})`);
        });
        doc.moveDown();

        // Advice
        if (data.advice) {
            doc.fontSize(14).text('Advice:', { underline: true });
            doc.fontSize(12).text(data.advice);
        }

        // Footer
        doc.moveDown(2);
        doc.fillColor('grey');
        doc.fontSize(10).text('This is a computer-generated document.', { align: 'center' });

        doc.end();
    });
};
