type Specialization = 'Cardiologist' | 'Dermatologist' | 'Neurologist' | 'General Physician' | 'Orthopedist' | 'Pediatrician';

const SYMPTOM_MAP: Record<string, Specialization> = {
    // Cardiac
    'chest pain': 'Cardiologist',
    'heart': 'Cardiologist',
    'palpitations': 'Cardiologist',

    // Derma
    'skin': 'Dermatologist',
    'rash': 'Dermatologist',
    'itch': 'Dermatologist',
    'acne': 'Dermatologist',

    // Neuro
    'headache': 'Neurologist',
    'dizzy': 'Neurologist',
    'migraine': 'Neurologist',
    'seizure': 'Neurologist',

    // Ortho
    'bone': 'Orthopedist',
    'fracture': 'Orthopedist',
    'joint': 'Orthopedist',
    'back pain': 'Orthopedist',

    // Pedia (Simple keyword check, usually requires age too)
    'baby': 'Pediatrician',
    'child': 'Pediatrician',

    // General - Fallback for fever, flu, etc.
    'fever': 'General Physician',
    'flu': 'General Physician',
    'cough': 'General Physician',
    'cold': 'General Physician',
    'fatigue': 'General Physician'
};

export const recommendSpecialization = (symptoms: string): Specialization => {
    const lowerSymptoms = symptoms.toLowerCase();

    for (const [keyword, spec] of Object.entries(SYMPTOM_MAP)) {
        if (lowerSymptoms.includes(keyword)) {
            return spec;
        }
    }

    return 'General Physician';
};
