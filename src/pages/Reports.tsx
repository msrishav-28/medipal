import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, TrendingUp, AlertCircle, CalendarRange } from "lucide-react";
import { motion } from "framer-motion";

export default function Reports() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold font-heading bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Health Reports
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Analytics and adherence trends.
                    </p>
                </div>
            </div>

            <BentoGrid>
                {/* Adherence Score */}
                <BentoGridItem
                    title="Weekly Adherence"
                    description="You are doing great! Top 5% of users."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-white/5 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col items-center">
                                <span className="text-6xl font-black text-foreground tracking-tighter">92%</span>
                                <span className="text-sm text-primary font-medium uppercase tracking-widest mt-2">Excellent</span>
                            </div>
                            <div className="absolute inset-0 bg-primary/5 blur-[50px]" />
                        </div>
                    }
                    icon={<Activity className="h-5 w-5 text-neutral-500" />}
                    className="md:col-span-2"
                />

                {/* Missed Doses */}
                <BentoGridItem
                    title="Missed Doses"
                    description="Only 1 missed dose this week."
                    header={
                        <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center rounded-xl bg-gradient-to-br from-red-500/10 to-transparent border border-white/5">
                            <span className="text-5xl font-bold text-red-500">1</span>
                        </div>
                    }
                    icon={<AlertCircle className="h-5 w-5 text-neutral-500" />}
                    className="md:col-span-1"
                />
            </BentoGrid>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">7-Day Activity</h3>
                    </div>

                    {/* Simple CSS Chart */}
                    <div className="flex items-end justify-between h-[200px] gap-2">
                        {[65, 80, 100, 90, 100, 40, 92].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full relative h-[180px] bg-white/5 rounded-t-lg overflow-hidden">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`absolute bottom-0 w-full rounded-t-lg transition-colors ${height === 100 ? 'bg-primary' : (height > 50 ? 'bg-primary/50' : 'bg-red-500/50')
                                            }`}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <CalendarRange className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-lg">History Log</h3>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex flex-col">
                                    <span className="font-medium text-foreground">Metformin - 500mg</span>
                                    <span className="text-xs text-muted-foreground">Taken at 8:0{i} PM</span>
                                </div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">On Time</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </motion.div>
    );
}
