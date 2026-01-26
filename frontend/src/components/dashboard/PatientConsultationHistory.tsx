
import { Card, CardContent, CardDescription, CardHeader, CardTitle as UiCardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Clock, User, Calendar } from 'lucide-react';

interface Consultation {
    id: number | string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    doctor_name: string;
    diagnosis: string;
    prescription: string;
}

interface Props {
    history: Consultation[];
}

export const PatientConsultationHistory = ({ history }: Props) => {
    if (!history || history.length === 0) {
        return (
            <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500 border border-slate-200">
                No past consultations found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((record) => (
                <Card key={record.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <UiCardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Dr. {record.doctor_name}
                                </UiCardTitle>
                                <CardDescription className="flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(record.start_time).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {record.duration_minutes} mins
                                    </span>
                                </CardDescription>
                            </div>
                            <div className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Completed
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="text-sm">
                                <span className="font-medium text-slate-700">Diagnosis:</span>
                                <p className="text-slate-600 mt-0.5">{record.diagnosis || 'No diagnosis recorded'}</p>
                            </div>

                            {record.prescription && (
                                <div className="pt-2 border-t border-slate-100">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                        <FileText className="w-4 h-4 mr-2" />
                                        View Prescription
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
