import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button"; // Corrected casing
import { Scan, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PrescriptionScanner from "@/components/medication/PrescriptionScanner";

export default function ScannerPage() { // Renamed to ScannerPage to avoid collision if any
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
                        <Scan className="w-8 h-8 text-primary" /> Prescription Scanner
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Digitize your prescriptions instantly with AI.
                    </p>
                </div>
            </div>

            <GlassCard className="min-h-[600px] flex flex-col items-center justify-center p-8 border-dashed border-2 border-white/10 bg-black/20">
                <PrescriptionScanner
                    onScanComplete={(parsed, image) => {
                        console.log("Scanned:", parsed, image);
                        // Pass data to medications page via state or context if needed. 
                        // For now just navigate back.
                        navigate("/medications");
                    }}
                    onCancel={() => navigate(-1)}
                />
            </GlassCard>
        </motion.div>
    );
}
