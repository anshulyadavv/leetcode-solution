"use client";

import { useMemo, useState, useEffect } from "react";
import { useDataStore, TodoItem } from "@/lib/data-store";
import { Zap, CheckCircle2, BarChart3, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Tracker() {
  const { todoLists, questions, completedQuestions, completionDates } = useDataStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    const solvedCount = completedQuestions.length;

    const difficultyDist = completedQuestions.reduce((acc, slug) => {
      const q = questions.find(q => q.slug === slug);
      if (q) acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, { Easy: 0, Medium: 0, Hard: 0 } as Record<string, number>);

    return { solvedCount, difficultyDist };
  }, [completedQuestions, questions]);

  // Build heatmap items from both planner items and specifically solved questions
  const heatmapDates = useMemo(() => {
    const dates: Date[] = [];
    
    // Add planner items using standard `.completedAt`
    const allItems = todoLists.flatMap(l => l.items);
    allItems.forEach(i => {
      if (i.completed && i.completedAt) dates.push(new Date(i.completedAt));
    });

    // Add completed code practice problems using `completionDates`
    Object.values(completionDates || {}).forEach(iso => {
      if (iso) dates.push(new Date(iso));
    });

    return dates;
  }, [todoLists, completionDates]);

  const maxDiff = Math.max(stats.difficultyDist.Easy, stats.difficultyDist.Medium, stats.difficultyDist.Hard, 1);

  if (!mounted) {
    return <div className="h-[400px] w-full animate-pulse bg-secondary/20 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatShard label="Total Solved" value={stats.solvedCount.toString()} icon={CheckCircle2} color="indigo" />
        <StatShard label="Easy Solved" value={stats.difficultyDist.Easy.toString()} icon={Zap} color="emerald" />
        <StatShard label="Medium Solved" value={stats.difficultyDist.Medium.toString()} icon={Activity} color="amber" />
        <StatShard label="Hard Solved" value={stats.difficultyDist.Hard.toString()} icon={Target} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Heatmap */}
        <div className="lg:col-span-2 premium-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="section-icon-wrap">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight">Acquisition Timeline</h3>
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-[10px] font-bold text-muted-foreground mr-1">Intensity</span>
              {[0.08, 0.25, 0.5, 0.8, 1].map(o => (
                <div key={o} className="h-2.5 w-2.5 rounded-[3px] bg-primary" style={{ opacity: o }} />
              ))}
            </div>
          </div>
          <div className="overflow-hidden">
            <ContributionHeatmap dates={heatmapDates} />
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="premium-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="section-icon-wrap">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold tracking-tight">Difficulty Breakdown</h3>
          </div>
          <div className="space-y-5">
            <DifficultyBar label="Easy" count={stats.difficultyDist.Easy} max={maxDiff} color="#10b981" />
            <DifficultyBar label="Medium" count={stats.difficultyDist.Medium} max={maxDiff} color="#f59e0b" />
            <DifficultyBar label="Hard" count={stats.difficultyDist.Hard} max={maxDiff} color="#f43f5e" />
          </div>

          {stats.solvedCount === 0 && (
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start solving problems in the{" "}
                <a href="/explore" className="text-primary hover:underline font-semibold">Explore</a>
                {" "}page to track your difficulty distribution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatShard({ label, value, icon: Icon, color }: { label: string, value: string, icon: React.ComponentType<{className?: string}>, color: string }) {
  return (
    <div className="premium-card p-5 flex flex-col justify-between group hover:shadow-lg transition-all">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={cn(
          "p-1.5 rounded-lg",
          color === "indigo" && "bg-indigo-50",
          color === "emerald" && "bg-emerald-50",
          color === "amber" && "bg-amber-50",
          color === "rose" && "bg-rose-50",
        )}>
          <Icon className={cn(
            "h-4 w-4",
            color === "indigo" && "text-indigo-500",
            color === "emerald" && "text-emerald-500",
            color === "amber" && "text-amber-500",
            color === "rose" && "text-rose-500",
          )} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-black text-foreground tracking-tight">{value}</div>
    </div>
  );
}

function DifficultyBar({ label, count, max, color }: { label: string, count: number, max: number, color: string }) {
  const percentage = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-[11px] font-black text-muted-foreground">{count} solved</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-700 ease-out rounded-full" 
          style={{ width: `${percentage}%`, backgroundColor: color }} 
        />
      </div>
    </div>
  );
}

function ContributionHeatmap({ dates }: { dates: Date[] }) {
  const weeks = useMemo(() => {
    const dateCounts = new Map<string, number>();
    dates.forEach(d => {
      const ds = d.toDateString();
      dateCounts.set(ds, (dateCounts.get(ds) || 0) + 1);
    });

    const result = [];
    const today = new Date();
    // Normalize today to end of the week (Saturday) or just build 52 weeks backwards
    // For a true Github graph, we build exactly 52 weeks + the current week
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    
    // We want 52 full columns
    for (let c = 51; c >= 0; c--) {
      const weekCol = [];
      for (let r = 0; r < 7; r++) {
        // Find the date for this specific cell
        // cell(c, r): 51 is current week. 
        // If today is Wednesday (3), then for the current week (51), days 4,5,6 are in the future.
        const daysAgo = (51 - c) * 7 + (currentDayOfWeek - r);
        
        if (daysAgo < 0) {
          // Future day in the current week
          weekCol.push({ count: -1, dateLabel: "", date: null });
        } else {
          const d = new Date(today);
          d.setDate(today.getDate() - daysAgo);
          const count = dateCounts.get(d.toDateString()) || 0;
          const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          weekCol.push({ count, dateLabel, date: d });
        }
      }
      result.push(weekCol);
    }
    return result;
  }, [dates]);

  // Extract month labels. We place a month label above the column where the month changes or starts
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((weekCols, c) => {
      // Look at the first valid day of the week to determine the month
      const validDay = weekCols.find(d => d.date);
      if (validDay && validDay.date) {
        const m = validDay.date.getMonth();
        if (m !== lastMonth) {
          labels.push({ label: validDay.date.toLocaleDateString(undefined, { month: 'short' }), colIndex: c });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="flex flex-col w-full overflow-x-auto no-scrollbar pb-2">
      {/* Months axis */}
      <div className="flex relative h-5 mb-1 text-[10px] text-muted-foreground font-semibold">
        {/* Offset for the days axis */}
        <div className="w-8 shrink-0" />
        <div className="flex-1 relative">
          {monthLabels.map((m, i) => (
            <span 
              key={i} 
              className="absolute"
              style={{ left: `${(m.colIndex / 52) * 100}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Days axis (Mon, Wed, Fri) */}
        <div className="flex flex-col gap-[3px] text-[9px] text-muted-foreground font-medium pr-2 shrink-0 pt-0.5">
          <div className="h-3 leading-3 opacity-0">Sun</div>
          <div className="h-[14px] leading-[14px]">Mon</div>
          <div className="h-[14px] leading-[14px] opacity-0">Tue</div>
          <div className="h-[14px] leading-[14px]">Wed</div>
          <div className="h-[14px] leading-[14px] opacity-0">Thu</div>
          <div className="h-[14px] leading-[14px]">Fri</div>
          <div className="h-3 leading-3 opacity-0">Sat</div>
        </div>

        {/* The Grid */}
        <div className="flex gap-[3px] flex-1">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-[3px] shrink-0 flex-1">
              {week.map((day, j) => (
                <div 
                  key={j}
                  className={cn(
                    "flex-1 aspect-square min-w-[10px] rounded-[2px] transition-all cursor-default",
                    day.count === -1 ? "bg-transparent" :
                    day.count === 0 ? "bg-secondary/60 dark:bg-secondary border border-border/40" :
                    day.count === 1 ? "bg-primary/30 dark:bg-primary/30" :
                    day.count === 2 ? "bg-primary/60 dark:bg-primary/60" :
                    day.count === 3 ? "bg-primary/80 dark:bg-primary/80" : "bg-primary"
                  )}
                  title={day.count >= 0 ? `${day.dateLabel}: ${day.count > 0 ? `${day.count} solved` : 'No activity'}` : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
