import { CaregiverDashboard } from "@/components/caregiver/CaregiverDashboard";
import { motion } from "framer-motion";

export default function CaregiverPage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <CaregiverDashboard />
        </motion.div>
    );
}
