// Urgency Levels Enum
export enum UrgencyLevel {
    NORMAL = 'NORMAL',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    EMERGENCY = 'EMERGENCY'
}

// Auto detection rules
export const detectAutoSeverity = (symptoms: string): number => {
    const s = symptoms.toLowerCase();

    // 1. Critical / Emergency (5)
    const emergencyKeywords = [
        'chest pain', 'breathing', 'shortness of breath', 'bleeding', 'unconscious',
        'stroke', 'heart attack', 'severe pain', 'head injury', 'cannot breathe', 'choking'
    ];
    if (emergencyKeywords.some(k => s.includes(k))) return 5;

    // 2. Urgent (4)
    const urgentKeywords = [
        'vomiting', 'high fever', 'fainting', 'severe', 'broken', 'fracture', 'migraine'
    ];
    if (urgentKeywords.some(k => s.includes(k))) return 4;

    // 3. Medium (3)
    const mediumKeywords = [
        'fever', 'cough', 'cold', 'headache', 'flu', 'sore throat'
    ];
    if (mediumKeywords.some(k => s.includes(k))) return 3;

    // Default Low (1)
    return 1;
};

// Map numeric 1-5 to Enum
export const getUrgencyEnum = (level: number): UrgencyLevel => {
    if (level >= 5) return UrgencyLevel.EMERGENCY;
    if (level === 4) return UrgencyLevel.HIGH;
    if (level === 3) return UrgencyLevel.MEDIUM;
    return UrgencyLevel.NORMAL;
};

// Legacy support wrapper
export const calculateUrgency = (symptoms: string, reportedSeverity: number): UrgencyLevel => {
    const autoSeverity = detectAutoSeverity(symptoms);
    const effectiveSeverity = Math.max(reportedSeverity, autoSeverity);
    return getUrgencyEnum(effectiveSeverity);
};
