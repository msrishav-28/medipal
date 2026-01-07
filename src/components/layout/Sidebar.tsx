import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Pill,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    Activity,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Pill, label: "Medications", href: "/medications" },
    { icon: Calendar, label: "Schedule", href: "/schedule" },
    { icon: Activity, label: "Reports", href: "/reports" },
    { icon: MessageSquare, label: "AI Assistant", href: "/chat" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="glass-card"
                >
                    {isMobileOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    width: isCollapsed ? "80px" : "280px",
                    x: isMobileOpen ? 0 : "-100%", // Mobile toggle
                }}
                // Reset transform on desktop
                style={{ x: 0 }}
                className={cn(
                    "fixed left-0 top-0 h-screen z-40 flex flex-col glass-panel border-r border-white/10 transition-all duration-300",
                    // Mobile styles override
                    "md:translate-x-0",
                    !isMobileOpen && "max-md:-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Activity className="text-white w-5 h-5" />
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="font-heading font-bold text-xl tracking-tight whitespace-nowrap overflow-hidden"
                                >
                                    MediPal
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex w-8 h-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute inset-0 bg-primary/10 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <item.icon className={cn("w-5 h-5 z-10", isActive && "text-primary")} />
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="font-medium whitespace-nowrap overflow-hidden z-10"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile / Footer */}
                <div className="p-4 border-t border-white/5">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 hover:bg-red-500/10 hover:text-red-500",
                            isCollapsed && "justify-center px-0"
                        )}
                    >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </Button>
                </div>
            </motion.aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
