import { useParams, useNavigate } from "react-router-dom";
import { useActiveMedications } from "@/hooks/useMedications"; // Re-using this for now, though singular fetch would be better
import MedicationDetail from "@/components/medication/MedicationDetail";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import { useCurrentUser } from "@/hooks/useUser";

export default function MedicationDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: user } = useCurrentUser();

    // Fetch all for now - in production we should have a useMedication(id) hook
    const { data: medications, isLoading } = useActiveMedications(user?.id || "");

    // Find the specific medication
    const medication = medications?.find(m => m.id === id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!medication) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-2xl font-bold">Medication not found</h2>
                <Button onClick={() => navigate("/medications")}>Back to List</Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <Button variant="ghost" onClick={() => navigate("/medications")} className="gap-2 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="w-5 h-5" /> Back to Medications
            </Button>

            <MedicationDetail
                medication={medication}
                onEdit={() => console.log("Edit clicked - toggle edit mode in Page if needed")}
                onCancel={() => console.log("Cancel edit")}
                // In a real app, these would call mutations
                onSave={(updates) => console.log("Saving", updates)}
            />
        </motion.div>
    );
}
