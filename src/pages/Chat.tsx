import { ChatInterface } from "@/components/ui/ChatInterface";
import { motion } from "framer-motion";

export default function Chat() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-[calc(100vh-8rem)] flex flex-col"
        >
            <div className="mb-6">
                <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    AI Assistant
                </h1>
                <p className="text-muted-foreground mt-2">
                    Ask questions about your medication, side effects, or schedule.
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <ChatInterface
                    userId="current-user"
                    height="100%"
                    className="h-full shadow-2xl shadow-primary/5 border-primary/10"
                    showApiKeyInput={true}
                />
            </div>
        </motion.div>
    );
}
