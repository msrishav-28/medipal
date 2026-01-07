import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatePresence, motion } from "framer-motion";

export function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background text-foreground flex canvas-mesh noise-bg">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:pl-[280px] transition-all duration-300">
                <Navbar />
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="container-responsive py-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
}
