import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCurrentUser, useUpdateUser } from "@/hooks/useUser";
import { User as UserIcon, Bell, Shield, Moon, Volume2, LogOut, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
    const { data: user, isLoading } = useCurrentUser();
    const updateUserMutation = useUpdateUser();

    const [formData, setFormData] = useState({
        name: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
            });
        }
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (user) {
            updateUserMutation.mutate({
                id: user.id,
                updates: {
                    name: formData.name,
                }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;



    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 max-w-4xl mx-auto"
        >
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Settings
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Sidebar Nav (Visual Only) */}
                <div className="col-span-1 space-y-2">
                    {[
                        { icon: UserIcon, label: "Profile", active: true },
                        { icon: Bell, label: "Notifications", active: false },
                        { icon: Shield, label: "Security", active: false },
                        { icon: Moon, label: "Appearance", active: false },
                        { icon: Volume2, label: "Sound & Voice", active: false },
                    ].map((item, i) => (
                        <Button
                            key={i}
                            variant={item.active ? "default" : "ghost"}
                            className={`w-full justify-start gap-3 ${!item.active && "text-muted-foreground hover:text-foreground"}`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Button>
                    ))}

                    <div className="pt-8">
                        <Button variant="destructive" className="w-full justify-start gap-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <GlassCard className="p-6 space-y-6">
                        <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{user.name}</h2>
                                <p className="text-muted-foreground">Patient • Member since {new Date(user.createdAt).getFullYear()}</p>
                                <Button variant="link" className="p-0 h-auto text-primary">Change Avatar</Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Full Name</span>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={updateUserMutation.isPending}
                            >
                                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <h3 className="font-bold text-lg mb-4">Preferences</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-5 h-5 text-blue-400" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Dark Mode</span>
                                        <span className="text-xs text-muted-foreground">Adjust display theme</span>
                                    </div>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-primary relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-orange-400" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Push Notifications</span>
                                        <span className="text-xs text-muted-foreground">Receive reminders on this device</span>
                                    </div>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-primary relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </motion.div>
    );
}
