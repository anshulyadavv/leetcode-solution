"use client";

import Tracker from "@/components/Tracker";
import Dashboard from "@/components/Dashboard";
import { Compass, Activity, Search } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-14 pt-10 pb-20">
      {/* Header */}
      <header className="space-y-6 pb-10 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="page-header-badge">
              <Compass className="h-3 w-3" /> Dashboard Overview
            </div>
            <h1 className="text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-foreground leading-none">
              Explore <span className="text-primary">Intelligence</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
              Interrogate our indexed logic modules and synchronize your preparation progress across all firms and topics.
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-semibold text-muted-foreground bg-secondary/60 px-5 py-2.5 rounded-full border border-border/50 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System Stable</span>
            </div>
            <span className="h-4 w-px bg-border" />
            <span>Build v3.2.1</span>
          </div>
        </div>
      </header>

      {/* Progress Tracking */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="section-icon-wrap">
            <Activity className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Progress Tracking</h2>
        </div>
        <Tracker />
      </section>

      {/* Logic Modules */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="section-icon-wrap">
            <Search className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Logic Modules</h2>
        </div>
        <Dashboard />
      </section>
    </div>
  );
}
