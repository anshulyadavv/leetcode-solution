"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutTemplate, Compass, Building2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "explore",
    title: "Global Explore Dashboard",
    description: "Browse 3,300+ logic modules, sort by difficulty, frequency, and filter by companies. Track your completion with beautiful progress indicators.",
    icon: Compass,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    ui: (
      <div className="w-full h-full bg-white dark:bg-background border border-border/40 rounded-xl overflow-hidden shadow-inner flex flex-col">
        {/* Fake Search Bar */}
        <div className="h-12 border-b border-border/50 bg-secondary/30 flex items-center px-4 gap-3">
          <div className="h-6 w-48 bg-primary/10 rounded-md"></div>
          <div className="ml-auto flex gap-2">
            <div className="h-6 w-16 bg-secondary rounded-md"></div>
            <div className="h-6 w-16 bg-secondary rounded-md"></div>
          </div>
        </div>
        {/* Fake Stats */}
        <div className="p-4 grid grid-cols-4 gap-4 bg-background">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-secondary rounded-lg border border-border/50"></div>
          ))}
        </div>
        {/* Fake List */}
        <div className="flex-1 p-4 space-y-2 bg-background overflow-hidden relative">
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10"></div>
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-10 bg-secondary/50 rounded-lg flex items-center px-3 border border-border/40">
               <div className="h-4 w-4 rounded bg-emerald-500/80 mr-3"></div>
               <div className="h-2 w-32 bg-foreground/20 rounded-full"></div>
               <div className="ml-auto h-4 w-12 bg-primary/20 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "companies",
    title: "Company Analytics Registry",
    description: "See exactly what firms like Google, Meta, and Amazon are asking right now. Sorted by live query volume.",
    icon: Building2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    ui: (
      <div className="w-full h-full bg-white dark:bg-background border border-border/40 rounded-xl overflow-hidden shadow-inner flex flex-col p-6 gap-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-primary/20 rounded-lg"></div>
            <div className="h-3 w-80 bg-foreground/10 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 bg-secondary/30 rounded-xl border border-border/50 flex flex-col p-4 justify-between transition-colors">
               <div className="flex justify-between">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl"></div>
                 <div className="h-4 w-12 bg-emerald-500/20 rounded-full"></div>
               </div>
               <div className="h-3 w-24 bg-foreground/30 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: "planner",
    title: "Tactical Priority Planner",
    description: "Your daily focus hub. Set custom queues, track daily completion, and manage your focus sessions with integrated Pomodoro logic.",
    icon: Calendar,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    ui: (
      <div className="w-full h-full bg-white dark:bg-background border border-border/40 rounded-xl overflow-hidden shadow-inner flex flex-col p-4 gap-4">
        <div className="h-10 border-b border-border/50 flex items-center justify-between">
          <div className="h-4 w-32 bg-foreground/20 rounded-full"></div>
          <div className="flex gap-1">
            <div className="h-6 w-12 bg-secondary rounded-md"></div>
            <div className="h-6 w-12 bg-secondary rounded-md"></div>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
             <div className="h-48 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl border border-blue-500/10 p-4">
                <div className="h-3 w-16 bg-blue-500/40 rounded-full mb-4"></div>
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-6 w-full bg-secondary rounded-md"></div>)}
                </div>
             </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-secondary/30 rounded-xl border border-border/50"></div>
            <div className="h-32 bg-secondary/30 rounded-xl border border-border/50"></div>
          </div>
        </div>
      </div>
    )
  }
];

export default function FeatureCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % features.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full relative bg-secondary/20 dark:bg-black border border-border/60 rounded-3xl overflow-hidden shadow-2xl p-2 lg:p-6 backdrop-blur-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px] lg:h-[480px]">
        
        {/* Navigation / Info Pane */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
          {features.map((f, i) => {
            const isActive = i === activeIdx;
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  "text-left p-4 rounded-2xl transition-all duration-300 group border",
                  isActive 
                    ? "bg-white dark:bg-background border-border/50 shadow-lg shadow-black/5" 
                    : "border-transparent hover:bg-white/50 dark:hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg transition-colors", isActive ? f.bg : "bg-black/5 dark:bg-white/5")}>
                    <Icon className={cn("h-4 w-4", isActive ? f.color : "text-muted-foreground")} />
                  </div>
                  <h3 className={cn("font-bold text-sm", isActive ? "text-foreground" : "text-muted-foreground")}>{f.title}</h3>
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-xs leading-relaxed text-muted-foreground mt-2 overflow-hidden"
                    >
                      {f.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            )
          })}
        </div>

        {/* Visual Mock Pane */}
        <div className="lg:col-span-8 bg-black/5 dark:bg-white/5 rounded-2xl border border-border/50 relative overflow-hidden flex items-center justify-center p-4 lg:p-8">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIdx}
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full"
            >
              {features[activeIdx].ui}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
