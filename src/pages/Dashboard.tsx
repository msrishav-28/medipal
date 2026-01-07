import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pill, Activity, Calendar, Plus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Good Morning, John</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Here's your health overview for today.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full px-6">
                    <Plus className="w-5 h-5" />
                    Add Medication
                </Button>
            </div>

            <BentoGrid>
                <BentoGridItem
                    title="Daily Adherence"
                    description="You've taken 80% of your meds today."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 items-center justify-center relative overflow-hidden group-hover:border-primary/30 transition-all">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="relative z-10"
                            >
                                <span className="text-5xl font-bold text-primary font-heading">80%</span>
                            </motion.div>
                            <div className="absolute inset-0 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all" />
                        </div>
                    }
                    icon={<Activity className="h-5 w-5 text-neutral-500" />}
                    className="md:col-span-1"
                />
                <BentoGridItem
                    title="Next Dose"
                    description="Aspirin 100mg at 2:00 PM"
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/10 items-center justify-center relative overflow-hidden">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 5, repeatDelay: 2 }}
                            >
                                <Pill className="w-12 h-12 text-blue-500" />
                            </motion.div>
                        </div>
                    }
                    icon={<Pill className="h-5 w-5 text-neutral-500" />}
                    className="md:col-span-1"
                />
                <BentoGridItem
                    title="Upcoming Appointment"
                    description="Dr. Smith - Cardiology Checkup"
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/10 items-center justify-center">
                            <Calendar className="w-12 h-12 text-orange-500" />
                        </div>
                    }
                    icon={<Calendar className="h-5 w-5 text-neutral-500" />}
                    className="md:col-span-1"
                />
            </BentoGrid>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="glass-card-premium border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Pill className="w-5 h-5 text-primary" />
                            Today's Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                                            {8 + i}:00
                                        </div>
                                        <div>
                                            <p className="font-medium">Amoxicillin</p>
                                            <p className="text-sm text-muted-foreground">500mg • Take with food</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="gap-2 hover:bg-primary hover:text-white transition-all">
                                        Take
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card-premium border-0">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Health Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-white/5 rounded-xl border border-white/5 border-dashed relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <span>Adherence Chart Placeholder</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
