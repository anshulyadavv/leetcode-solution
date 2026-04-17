"use client";

import { useEffect, useState, useRef } from "react";
import { useDataStore } from "@/lib/data-store";
import { usePathname } from "next/navigation";
import { Play, Pause, Square, RotateCcw, Minimize2, Maximize2, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Pomodoro Widget ─────────────────────────────────────────────────────────
export function PomodoroWidget({ isFloating = false }: { isFloating?: boolean }) {
  const { pomodoro, setPomodoro } = useDataStore();
  const [editingCustom, setEditingCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const totalSeconds =
    pomodoro.mode === "focus" ? 25 * 60 :
    pomodoro.mode === "shortBreak" ? 5 * 60 : 15 * 60;

  const overrideMap: Record<string, number> = {
    focus: pomodoro.customFocusMin ? pomodoro.customFocusMin * 60 : 25 * 60,
    shortBreak: pomodoro.customShortMin ? pomodoro.customShortMin * 60 : 5 * 60,
    longBreak: pomodoro.customLongMin ? pomodoro.customLongMin * 60 : 15 * 60,
  };
  const effectiveTotal = overrideMap[pomodoro.mode];
  const progress = pomodoro.timeLeft / effectiveTotal;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  function setMode(mode: "focus" | "shortBreak" | "longBreak") {
    const t = overrideMap[mode];
    setPomodoro({ mode, timeLeft: t, isRunning: false });
  }

  function applyCustom() {
    const mins = parseInt(customInput);
    if (!isNaN(mins) && mins > 0 && mins <= 120) {
      const key = pomodoro.mode === "focus" ? "customFocusMin" :
                  pomodoro.mode === "shortBreak" ? "customShortMin" : "customLongMin";
      setPomodoro({ [key]: mins, timeLeft: mins * 60, isRunning: false } as any);
    }
    setEditingCustom(false);
    setCustomInput("");
  }

  const modeLabel = pomodoro.mode === "focus" ? "Focus" : pomodoro.mode === "shortBreak" ? "Short Break" : "Long Break";

  return (
    <div className={cn(
      "bg-white dark:bg-[#1c1c1e] border border-border shadow-xl rounded-2xl flex flex-col",
      isFloating ? "w-60 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 p-4" : "p-4 w-full"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pomodoro</span>
        <div className="flex items-center gap-1">
          {/* Custom time edit */}
          <button
            onClick={() => { setEditingCustom(v => !v); setCustomInput(""); }}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            title="Set custom time"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          {/* Dock/undock */}
          {isFloating ? (
            <button
              onClick={() => setPomodoro({ isDocked: true })}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              title="Dock to planner"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={() => setPomodoro({ isDocked: false })}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
              title="Pop out"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Custom time input */}
      {editingCustom && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/60 rounded-xl border border-border/50">
          <span className="text-xs text-muted-foreground flex-1">Min for <span className="text-foreground font-semibold">{modeLabel}</span>:</span>
          <input
            type="number"
            min={1} max={120}
            className="w-14 bg-background border border-border rounded-lg px-2 py-1 text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="25"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") applyCustom(); if (e.key === "Escape") setEditingCustom(false); }}
            autoFocus
          />
          <button onClick={applyCustom} className="p-1 rounded-md bg-primary text-white hover:bg-primary/80 transition-colors">
            <Check className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4 bg-secondary/50 p-1 rounded-xl">
        {([
          { id: "focus", label: "Focus" },
          { id: "shortBreak", label: "5m" },
          { id: "longBreak", label: "15m" },
        ] as const).map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex-1 py-1 text-[10px] font-bold rounded-lg transition-all",
              pomodoro.mode === m.id
                ? "bg-white dark:bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Donut timer */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <svg width="136" height="136" className="-rotate-90">
            {/* Track */}
            <circle cx="68" cy="68" r={radius} fill="none" stroke="currentColor"
              className="text-secondary" strokeWidth="8" />
            {/* Progress */}
            <circle cx="68" cy="68" r={radius} fill="none"
              stroke="var(--color-primary)" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Center content — sits inside the donut, not overlapping stroke */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">
              {modeLabel}
            </span>
            <span className="text-2xl font-black tabular-nums tracking-tighter text-foreground leading-none">
              {formatTime(pomodoro.timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Reset */}
        <button
          onClick={() => setPomodoro({ timeLeft: effectiveTotal, isRunning: false })}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => setPomodoro({ isRunning: !pomodoro.isRunning })}
          className="p-3 rounded-full bg-primary text-white hover:bg-primary/80 shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
          title={pomodoro.isRunning ? "Pause" : "Start"}
        >
          {pomodoro.isRunning
            ? <Pause className="h-5 w-5" fill="currentColor" />
            : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          }
        </button>

        {/* Stop */}
        <button
          onClick={() => setPomodoro({ isRunning: false, timeLeft: effectiveTotal })}
          className="p-2 rounded-full text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
          title="Stop & reset"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Global engine + tab title sync + floating container ─────────────────────
export default function GlobalPomodoro() {
  const { pomodoro, setPomodoro } = useDataStore();
  const pathname = usePathname();

  // Countdown engine
  useEffect(() => {
    if (!pomodoro.isRunning) return;
    const interval = setInterval(() => {
      setPomodoro({
        timeLeft: Math.max(0, pomodoro.timeLeft - 1),
        isRunning: pomodoro.timeLeft - 1 > 0,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoro.isRunning, pomodoro.timeLeft, setPomodoro]);

  // Tab title sync
  useEffect(() => {
    if (pomodoro.isRunning) {
      const m = Math.floor(pomodoro.timeLeft / 60);
      const s = pomodoro.timeLeft % 60;
      const label = pomodoro.mode === "focus" ? "🍅" : "☕";
      document.title = `${label} ${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")} – CodePractice`;
    } else {
      document.title = "CodePractice | Prep smarter, not harder";
    }
  }, [pomodoro.isRunning, pomodoro.timeLeft, pomodoro.mode]);

  // Only float when user DELIBERATELY undocked (isDocked === false)
  // When docked, it only appears inline on the planner page itself
  if (pomodoro.isDocked) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-fade-up">
      <PomodoroWidget isFloating={true} />
    </div>
  );
}
