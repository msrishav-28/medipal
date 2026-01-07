import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAddMedication } from "@/hooks/useMedications";

const medicationSchema = z.object({
    name: z.string().min(2, "Name is required"),
    dosage: z.string().min(1, "Dosage is required"),
    form: z.enum(["tablet", "capsule", "liquid", "injection"]),
    totalPills: z.string().min(1, "Total pills is required"),
    remainingPills: z.string().min(1, "Remaining pills is required"),
    scheduleType: z.enum(["time-based", "interval-based"]),
    times: z.string().optional(), // Comma separated for now
    instructions: z.string().optional(),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

interface AddMedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function AddMedicationModal({ isOpen, onClose, userId }: AddMedicationModalProps) {
    const addMedication = useAddMedication();

    const form = useForm<MedicationFormValues>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            form: "tablet",
            scheduleType: "time-based",
            totalPills: "30",
            remainingPills: "30",
            times: "",
            instructions: "",
        },
    });

    const onSubmit = (data: MedicationFormValues) => {
        const payload: any = {
            name: data.name,
            dosage: data.dosage,
            form: data.form,
            totalPills: parseInt(data.totalPills),
            remainingPills: parseInt(data.remainingPills),
            scheduleType: data.scheduleType,
            userId,
            startDate: new Date(),
            isActive: true,
            refillReminder: 5,
        };

        if (data.times) {
            payload.times = data.times.split(",").map((t) => t.trim()).filter(Boolean);
        }

        if (data.instructions) {
            payload.instructions = data.instructions;
        }

        addMedication.mutate(payload, {
            onSuccess: () => {
                onClose();
                form.reset();
            },
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50"
                    >
                        <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-white/10 bg-[#1f1f1f]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-heading font-bold text-white">Add Medication</h2>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                            Medication Name
                                        </label>
                                        <Input
                                            {...form.register("name")}
                                            placeholder="e.g. Aspirin"
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                        {form.formState.errors.name && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {form.formState.errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                                Dosage
                                            </label>
                                            <Input
                                                {...form.register("dosage")}
                                                placeholder="e.g. 100mg"
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                                Form
                                            </label>
                                            <select
                                                {...form.register("form")}
                                                className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="tablet">Tablet</option>
                                                <option value="capsule">Capsule</option>
                                                <option value="liquid">Liquid</option>
                                                <option value="injection">Injection</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                                Total Pills
                                            </label>
                                            <Input
                                                type="number"
                                                {...form.register("totalPills")}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                                Remaining
                                            </label>
                                            <Input
                                                type="number"
                                                {...form.register("remainingPills")}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                            Times (comma separated)
                                        </label>
                                        <Input
                                            {...form.register("times")}
                                            placeholder="08:00, 20:00"
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <Button type="button" variant="ghost" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={addMedication.isPending}>
                                        {addMedication.isPending && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        )}
                                        Add Medication
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
