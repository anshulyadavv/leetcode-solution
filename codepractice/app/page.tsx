"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Terminal, Compass, Building2, Layers, Trophy, Sparkles, Code2, BookOpen, Timer } from "lucide-react";
import FeatureCarousel from "@/components/FeatureCarousel";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative pt-16 pb-20 mesh-gradient">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 animate-fade-up">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built by engineers, for engineers</span>
          </div>

          <div className="space-y-4 max-w-3xl animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tight text-foreground leading-[1.05]">
              Stop grinding blindly.{" "}
              <span className="text-primary">Practice smart.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Know exactly which problems matter at each company. Track your progress, plan your week, and actually feel ready — not just busy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <Link href="/explore" className="btn-premium px-8 py-3 text-sm">
              Start Exploring <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/companies" className="btn-secondary px-8 py-3 text-sm">
              Browse Companies
            </Link>
          </div>
        </div>
      </header>

      {/* Quick stats */}
      <div className="bg-white dark:bg-[#111113] border-y border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {[
              { label: "Companies tracked", value: "684+", icon: Building2 },
              { label: "Practice problems", value: "3,300+", icon: Layers },
              { label: "Avg load time", value: "< 100ms", icon: Compass },
              { label: "Free forever", value: "100%", icon: Trophy },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/8 rounded-xl text-primary shrink-0">
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">{stat.value}</div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature highlights */}
      <section className="py-20 bg-white dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-4 text-center mb-14">
          <h2 className="text-4xl font-bold tracking-tight">Everything in one place</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No more juggling spreadsheets, LeetCode tabs, and Notion docs. We figured it out so you don't have to.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                title: "Company-specific lists",
                desc: "See exactly which problems appear at Google, Meta, Amazon — sorted by how often they actually show up in interviews.",
                color: "text-blue-500",
                bg: "bg-blue-500/8",
              },
              {
                icon: Code2,
                title: "Track what you've done",
                desc: "Check off problems as you go. Filter by difficulty, topic, or company. Never lose track of where you left off.",
                color: "text-emerald-500",
                bg: "bg-emerald-500/8",
              },
              {
                icon: Timer,
                title: "Plan your sessions",
                desc: "Use the built-in planner + Pomodoro timer to structure your prep. Set daily goals and actually stick to them.",
                color: "text-primary",
                bg: "bg-primary/8",
              },
            ].map((f, i) => (
              <div key={i} className="premium-card p-6 space-y-4">
                <div className={`inline-flex p-2.5 rounded-xl ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive carousel */}
      <section className="py-20 bg-[#fafafa] dark:bg-background border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-bold tracking-tight">See it in action</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Here's what your prep looks like once you're set up.
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 mesh-gradient border-t border-border/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to actually get offers?
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            No account needed. Just open it, pick a company, and start practicing. That's it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/explore" className="btn-premium px-8 py-3">
              Start Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/companies" className="btn-secondary px-8 py-3">
              Browse Companies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
