import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "active" | "alert"
    hoverEffect?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
    ({ className, variant = "default", hoverEffect = true, children, ...props }, ref) => {

        const variants = {
            default: "bg-white/60 dark:bg-slate-950/60 border-white/30 dark:border-white/10",
            active: "bg-primary/10 dark:bg-primary/20 border-primary/40 dark:border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.3)]",
            alert: "bg-destructive/10 dark:bg-destructive/20 border-destructive/40 dark:border-destructive/40"
        }

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={hoverEffect ? { y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } : undefined}
                transition={{ duration: 0.3 }}
                className={cn(
                    "relative overflow-hidden rounded-2xl backdrop-blur-2xl border shadow-glass transition-all duration-300",
                    variants[variant],
                    hoverEffect && "hover:border-white/50 dark:hover:border-white/20",
                    className
                )}
                {...(props as any)}
            >
                {/* Inner Gloss Shine/Noise (Optional aesthetic detail) */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />
                {children}
            </motion.div>
        )
    }
)
GlassCard.displayName = "GlassCard"

export { GlassCard }
