import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button"; // Corrected casing
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Schedule() {
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            day: d.toLocaleString("en-US", { weekday: "short" }),
            date: d.getDate(),
            isActive: i === 0,
        };
    });

    const timelineItems = [
        { time: "08:00 AM", med: "Metformin", dose: "500mg", status: "taken", type: "Pill" },
        { time: "09:00 AM", med: "Vitamin D", dose: "1000IU", status: "taken", type: "Supplement" },
        { time: "02:00 PM", med: "Aspirin", dose: "100mg", status: "pending", type: "Pill" },
        { time: "08:00 PM", med: "Metformin", dose: "500mg", status: "pending", type: "Pill" },
    ];

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
                        Schedule
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Your medication timeline for today.
                    </p>
                </div>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/10">
                    <Calendar className="w-5 h-5" />
                    View Calendar
                </Button>
            </div>

            {/* Date Strip */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {dates.map((date, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border transition-all cursor-pointer ${date.isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground"
                            }`}
                    >
                        <span className="text-xs font-medium uppercase tracking-wider">{date.day}</span>
                        <span className="text-2xl font-bold font-heading">{date.date}</span>
                    </motion.div>
                ))}
            </div>

            {/* Timeline */}
            <div className="relative pl-8 border-l-2 border-white/10 space-y-8">
                {timelineItems.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="relative"
                    >
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[41px] top-6 w-5 h-5 rounded-full border-4 border-background ${item.status === 'taken' ? 'bg-green-500' : 'bg-neutral-600'
                            }`} />

                        <GlassCard
                            className="p-6 flex items-center justify-between group"
                            variant={item.status === 'taken' ? 'default' : 'active'}
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-white/5 border border-white/10">
                                    <Clock className="w-6 h-6 text-primary mb-1" />
                                    <span className="text-xs font-bold text-foreground">{item.time.split(' ')[0]}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        {item.med}
                                        {item.status === 'taken' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 border border-green-500/20 font-medium">Taken</span>
                                        )}
                                    </h3>
                                    <p className="text-muted-foreground">{item.dose} • {item.type}</p>
                                </div>
                            </div>

                            {item.status === 'pending' ? (
                                <Button className="rounded-full w-12 h-12 p-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    <CheckCircle2 className="w-6 h-6" />
                                </Button>
                            ) : (
                                <Button variant="ghost" className="rounded-full w-12 h-12 p-0 text-muted-foreground" disabled>
                                    <CheckCircle2 className="w-6 h-6" />
                                </Button>
                            )}
                        </GlassCard>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
