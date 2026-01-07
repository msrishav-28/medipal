import { useState } from "react";
import { Plus } from "lucide-react";
import { useActiveMedications } from "@/hooks/useMedications";
import { Button } from "@/components/ui/Button";
import MedicationCard from "@/components/medication/MedicationCard";
import { AddMedicationModal } from "@/components/medication/AddMedicationModal";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Mock user ID for now
const USER_ID = "user-1";

export default function Medications() {
    const { data: medications, isLoading } = useActiveMedications(USER_ID);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        My Medications
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your prescriptions, schedule, and inventory.
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg shadow-primary/25">
                    <Plus className="w-5 h-5" />
                    Add Medication
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {medications?.map((med, index) => (
                        <motion.div
                            key={med.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <MedicationCard
                                medication={med}
                                size="standard"
                                showActions={true}
                                onTaken={() => console.log("Taken", med.id)}
                                onEdit={() => navigate(`/medications/${med.id}`)}
                            />
                        </motion.div>
                    ))}

                    {medications?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                <Plus className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">No medications yet</h3>
                            <p className="text-muted-foreground max-w-md mb-8">
                                Add your first medication to start tracking your schedule, inventory, and adherence history.
                            </p>
                            <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
                                Add First Medication
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <AddMedicationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                userId={USER_ID}
            />
        </div>
    );
}
