import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { ArrowRight, Lock, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-[calc(100vh-2rem)] flex items-center justify-center p-4">
            {/* Background Mesh (Local to this page if not global, but using global class) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <GlassCard className="p-8 md:p-12 border-white/20 shadow-2xl shadow-primary/10">
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-primary/25"
                        >
                            <Lock className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-4xl font-bold font-heading mb-2">Welcome Back</h1>
                        <p className="text-muted-foreground text-lg">Enter your secure access code to continue.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Access Code</label>
                            <Input
                                type="password"
                                placeholder="•••• ••••"
                                className="bg-black/20 border-white/10 text-center text-2xl tracking-[0.5em] h-14"
                            />
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-lg font-bold shadow-lg shadow-primary/25 group"
                            onClick={() => navigate("/")}
                        >
                            Sign In <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-transparent px-2 text-muted-foreground backdrop-blur-md rounded-lg">Or continue as</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-white/10 hover:bg-white/5"
                            onClick={() => navigate("/")}
                        >
                            <UserCircle2 className="w-5 h-5 mr-2" />
                            Guest User
                        </Button>
                    </div>
                </GlassCard>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Protected by end-to-end encryption. Your health data stays on your device.
                </p>
            </motion.div>
        </div>
    );
}
