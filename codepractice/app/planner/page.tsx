"use client";

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useDataStore } from "@/lib/data-store";
import { ChevronLeft, ChevronRight, Calendar, X, Circle, CheckCircle2, Timer, AlignJustify, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { PomodoroWidget } from "@/components/GlobalPomodoro";

// ── Scribble-through SVG (animated draw from L to R) ──────────────────────
function ScribbleLine({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <svg
      className="absolute inset-0 w-full pointer-events-none overflow-visible"
      style={{ top: '50%', transform: 'translateY(-50%)', height: '3px' }}
      preserveAspectRatio="none"
    >
      <line
        x1="0" y1="50%" x2="100%" y2="50%"
        pathLength="1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="animate-scribble"
      />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type View = "day" | "week" | "month" | "quarter" | "year";

// ── Date helpers ───────────────────────────────────────────────────────────
const ML = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DL = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function weekStart(d: Date) {
  const c = new Date(d); const day = c.getDay();
  c.setDate(c.getDate() - (day === 0 ? 6 : day - 1)); c.setHours(0,0,0,0); return c;
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate()+n); return c; }
function addMonths(d: Date, n: number) { const c = new Date(d); c.setDate(1); c.setMonth(c.getMonth()+n); return c; }
function getQ(d: Date) { return Math.floor(d.getMonth()/3)+1; }
function qStart(d: Date) { return new Date(d.getFullYear(), Math.floor(d.getMonth()/3)*3, 1); }
function mmKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function isToday(d: Date) { return fmtDate(d)===fmtDate(new Date()); }
function sameWeek(a: Date, b: Date) { return fmtDate(weekStart(a))===fmtDate(weekStart(b)); }
function isoWeek(d: Date) {
  const ms = weekStart(d);
  const jan1 = new Date(ms.getFullYear(),0,1);
  const wn = Math.ceil(((ms.getTime()-jan1.getTime())/86400000+jan1.getDay()+1)/7);
  return `${ms.getFullYear()}-W${String(wn).padStart(2,"0")}`;
}

// ── Smart list detection (runs on Enter in NotesTile textareas) ─────────────
function handleSmartList(
  e: KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  setValue: (v: string) => void,
) {
  if (e.key !== "Enter") return;
  const el = e.currentTarget;
  const pos = el.selectionStart ?? value.length;
  const before = value.slice(0, pos);
  const after  = value.slice(pos);
  const lineStart = before.lastIndexOf("\n") + 1;
  const line = before.slice(lineStart);

  // Numbered list: "  1. text" or "1. text"
  const numM = line.match(/^(\s*)(\d+)\.\s+/);
  if (numM) {
    const rest = line.slice(numM[0].length);
    e.preventDefault();
    if (!rest.trim()) {
      // empty item — exit list
      const nv = before.slice(0, lineStart) + "\n" + after;
      setValue(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = lineStart + 1; });
    } else {
      const ins = `\n${numM[1]}${+numM[2] + 1}. `;
      setValue(before + ins + after);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = pos + ins.length; });
    }
    return;
  }

  // Bullet list: "- ", "• ", "* "
  const bulM = line.match(/^(\s*)([-•*])\s+/);
  if (bulM) {
    const rest = line.slice(bulM[0].length);
    e.preventDefault();
    if (!rest.trim()) {
      const nv = before.slice(0, lineStart) + "\n" + after;
      setValue(nv);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = lineStart + 1; });
    } else {
      const ins = `\n${bulM[1]}${bulM[2]} `;
      setValue(before + ins + after);
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = pos + ins.length; });
    }
    return;
  }
}

// ── Calendar pickers ───────────────────────────────────────────────────────

/** Mini month calendar — use mode="day" to select a day, mode="week" to select a whole week row */
function MiniCalendar({
  cursor, mode, onSelectDay, onSelectWeek,
}: {
  cursor: Date; mode: "day" | "week";
  onSelectDay?: (d: Date) => void;
  onSelectWeek?: (ws: Date) => void;
}) {
  const [calM, setCalM] = useState(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const firstDay = calM;
  const lastDay  = new Date(calM.getFullYear(), calM.getMonth()+1, 0);
  const gs       = weekStart(firstDay);

  const weeks: Date[][] = [];
  let ptr = new Date(gs);
  while (ptr <= lastDay || weeks.length < 4) {
    const w: Date[] = [];
    for (let i = 0; i < 7; i++) { w.push(new Date(ptr)); ptr = addDays(ptr,1); }
    weeks.push(w);
    if (ptr > lastDay && weeks.length >= 4) break;
  }

  return (
    <div className="w-[248px] select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold">{ML[calM.getMonth()]} {calM.getFullYear()}</span>
        <div className="flex gap-0.5">
          <button onClick={() => setCalM(m => addMonths(m,-1))} className="p-1 rounded hover:bg-secondary">
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => setCalM(m => addMonths(m,1))} className="p-1 rounded hover:bg-secondary">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {/* Header row */}
      <div className="grid grid-cols-8 gap-0 mb-0.5">
        <div className="text-[10px] text-muted-foreground/60 text-center py-1">#</div>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} className="text-[10px] text-muted-foreground font-medium text-center py-1">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => {
        const wn = (() => {
          const jan1 = new Date(week[0].getFullYear(),0,1);
          return Math.ceil(((week[0].getTime()-jan1.getTime())/86400000+jan1.getDay()+1)/7);
        })();
        const isSelWeek = mode==="week" && sameWeek(week[0], cursor);
        return (
          <div
            key={wi}
            onClick={() => mode==="week" && onSelectWeek?.(week[0])}
            className={cn(
              "grid grid-cols-8 gap-0 rounded",
              mode==="week" && "cursor-pointer hover:bg-primary/8",
              isSelWeek && "bg-primary/10 ring-1 ring-primary/25"
            )}
          >
            <div className="text-[10px] text-muted-foreground/50 text-center self-center py-1">{wn}</div>
            {week.map((day, di) => {
              const inMonth = day.getMonth()===calM.getMonth();
              const isCur   = mode==="day" && fmtDate(day)===fmtDate(cursor);
              const tod     = isToday(day);
              return (
                <button
                  key={di}
                  onClick={e => { e.stopPropagation(); mode==="day" && onSelectDay?.(day); }}
                  className={cn(
                    "text-[11px] text-center py-1 rounded transition-colors",
                    !inMonth && "text-muted-foreground/30",
                    inMonth && !isCur && !tod && "text-foreground hover:bg-secondary",
                    tod && !isCur && "text-primary font-bold",
                    isCur && "bg-primary text-white font-bold",
                    mode==="week" && !isCur && "pointer-events-none"
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Month grid picker (for Month view) */
function MonthPicker({ cursor, onSelect }: { cursor: Date; onSelect: (d: Date) => void }) {
  const [year, setYear] = useState(cursor.getFullYear());
  return (
    <div className="w-[200px] select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold">{year}</span>
        <div className="flex gap-0.5">
          <button onClick={() => setYear(y=>y-1)} className="p-1 rounded hover:bg-secondary"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground"/></button>
          <button onClick={() => setYear(y=>y+1)} className="p-1 rounded hover:bg-secondary"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/></button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MS.map((m,i) => {
          const sel = year===cursor.getFullYear() && i===cursor.getMonth();
          return (
            <button key={m} onClick={() => onSelect(new Date(year,i,1))}
              className={cn("py-2 text-xs font-medium rounded-lg transition-all",
                sel ? "bg-primary text-white ring-2 ring-primary/30" : "hover:bg-secondary text-foreground")}>
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Quarter picker */
function QuarterPicker({ cursor, onSelect }: { cursor: Date; onSelect: (d: Date) => void }) {
  const [year, setYear] = useState(cursor.getFullYear());
  const curQ = getQ(cursor); const curY = cursor.getFullYear();
  return (
    <div className="w-[190px] select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold">{year}</span>
        <div className="flex gap-0.5">
          <button onClick={() => setYear(y=>y-1)} className="p-1 rounded hover:bg-secondary"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground"/></button>
          <button onClick={() => setYear(y=>y+1)} className="p-1 rounded hover:bg-secondary"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/></button>
        </div>
      </div>
      <div className="space-y-1.5">
        {[1,2,3,4].map(q => {
          const sel = year===curY && q===curQ;
          return (
            <button key={q} onClick={() => onSelect(new Date(year,(q-1)*3,1))}
              className={cn("w-full text-left px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                sel ? "bg-primary text-white ring-2 ring-primary/30" : "hover:bg-secondary text-foreground")}>
              Quarter {q}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 8-year range picker */
function YearPicker({ cursor, onSelect }: { cursor: Date; onSelect: (y: number) => void }) {
  const curYear = cursor.getFullYear();
  const [rs, setRs] = useState(Math.floor(curYear/8)*8);
  const years = Array.from({length:8},(_,i)=>rs+i);
  return (
    <div className="w-[190px] select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold">{rs} – {rs+7}</span>
        <div className="flex gap-0.5">
          <button onClick={() => setRs(r=>r-8)} className="p-1 rounded hover:bg-secondary"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground"/></button>
          <button onClick={() => setRs(r=>r+8)} className="p-1 rounded hover:bg-secondary"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground"/></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {years.map(y => (
          <button key={y} onClick={() => onSelect(y)}
            className={cn("py-2.5 text-sm font-medium rounded-lg transition-all",
              y===curYear ? "bg-primary text-white ring-2 ring-primary/30" : "hover:bg-secondary text-foreground")}>
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Dropdown wrapper — sits below the label button */
function PickerDropdown({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Prevent immediate close if clicking a button that toggles it
        setTimeout(onClose, 10);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-2 z-[200] bg-white dark:bg-[#1c1c1e] border border-border rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100"
    >
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [view,        setView]        = useState<View>("week");
  const [cursor,      setCursor]      = useState(new Date());
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [cardSize,    setCardSize]    = useState<"compact" | "normal" | "spacious">("normal");
  const [showPomodoro, setShowPomodoro] = useState(false);
  const { pomodoro, setPomodoro } = useDataStore();

  function navigate(delta: number) {
    setCursor(prev => {
      const d = new Date(prev);
      if (view==="day")     return addDays(d, delta);
      if (view==="week")    return addDays(d, delta*7);
      if (view==="month")   return addMonths(d, delta);
      if (view==="quarter") return addMonths(d, delta*3);
      d.setFullYear(d.getFullYear()+delta); return d;
    });
  }

  function headerLabel() {
    if (view==="day") {
      const dow = DL[cursor.getDay()];
      return isToday(cursor) ? `${dow}, Today` : `${dow}, ${MS[cursor.getMonth()]} ${cursor.getDate()}`;
    }
    if (view==="week") {
      const ms = weekStart(cursor); const me = addDays(ms,6);
      return `This week: ${MS[ms.getMonth()]} ${ms.getDate()} – ${MS[me.getMonth()]} ${me.getDate()}`;
    }
    if (view==="month")   return `${ML[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view==="quarter") return `Q${getQ(cursor)} ${cursor.getFullYear()}`;
    return `${cursor.getFullYear()}`;
  }

  const views: {id: View; label: string}[] = [
    {id:"day",label:"Day"},{id:"week",label:"Week"},{id:"month",label:"Month"},
    {id:"quarter",label:"Quarter"},{id:"year",label:"Year"},
  ];

  // When view changes, close picker + hide pomodoro panel if shown
  function switchView(v: View) { setView(v); setPickerOpen(false); }

  // When user docks pomodoro back, hide the inline panel
  useEffect(() => {
    if (pomodoro.isDocked === false) setShowPomodoro(false);
  }, [pomodoro.isDocked]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#f7f7f8] dark:bg-background">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-[#111113] border-b border-border/60 shrink-0 gap-2">
        {/* Date Navigator */}
        <div className="flex items-center gap-1.5 relative min-w-0">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          {/* Clickable label — opens picker */}
          <button
            onClick={() => setPickerOpen(o => !o)}
            className="flex items-center gap-1 font-semibold text-sm text-foreground hover:text-primary transition-colors truncate"
          >
            {headerLabel()}
            <svg className={cn("h-3 w-3 text-muted-foreground transition-transform mt-px shrink-0", pickerOpen && "rotate-180")} viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Prev / Next arrows */}
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-secondary transition-colors ml-1">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Picker dropdown */}
          {pickerOpen && (
            <PickerDropdown onClose={() => setPickerOpen(false)}>
              {view==="day"  && <MiniCalendar cursor={cursor} mode="day"
                  onSelectDay={d => { setCursor(d); setPickerOpen(false); }} />}
              {view==="week" && <MiniCalendar cursor={cursor} mode="week"
                  onSelectWeek={ws => { setCursor(ws); setPickerOpen(false); }} />}
              {view==="month"   && <MonthPicker cursor={cursor}
                  onSelect={d => { setCursor(d); setPickerOpen(false); }} />}
              {view==="quarter" && <QuarterPicker cursor={cursor}
                  onSelect={d => { setCursor(d); setPickerOpen(false); }} />}
              {view==="year"    && <YearPicker cursor={cursor}
                  onSelect={y => { const d = new Date(cursor); d.setFullYear(y); setCursor(d); setPickerOpen(false); }} />}
            </PickerDropdown>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Card size toggle — only relevant for week view */}
          {view === "week" && (
            <div className="flex items-center gap-0.5 bg-[#f0f0f2] dark:bg-[#1c1c1e] rounded-lg p-0.5 border border-border/40">
              <button
                onClick={() => setCardSize("compact")}
                title="Compact cards"
                className={cn("p-1.5 rounded-md transition-all", cardSize === "compact" ? "bg-white dark:bg-muted shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCardSize("normal")}
                title="Normal cards"
                className={cn("p-1.5 rounded-md transition-all", cardSize === "normal" ? "bg-white dark:bg-muted shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <AlignJustify className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Timer button */}
          <div className="relative">
            <button
              onClick={() => setShowPomodoro(v => !v)}
              title="Pomodoro timer"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                showPomodoro
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground border-border/50 hover:text-foreground hover:bg-secondary"
              )}
            >
              <Timer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timer</span>
              {pomodoro.isRunning && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
            {/* Pop up Pomodoro under the button */}
            {showPomodoro && (
              <PickerDropdown onClose={() => setShowPomodoro(false)}>
                <div className="w-[260px]">
                  <PomodoroWidget isFloating={false} />
                </div>
              </PickerDropdown>
            )}
          </div>

          {/* View Tabs */}
          <div className="flex items-center bg-[#f0f0f2] dark:bg-[#1c1c1e] rounded-lg p-0.5 border border-border/40">
            {views.map(v => (
              <button key={v.id} onClick={() => switchView(v.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  view===v.id ? "bg-white dark:bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* View content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        {view==="day"     && <DayView     cursor={cursor} />}
        {view==="week"    && <WeekView    cursor={cursor} cardSize={cardSize} />}
        {view==="month"   && <MonthView   cursor={cursor} />}
        {view==="quarter" && <QuarterView cursor={cursor} />}
        {view==="year"    && <YearView    cursor={cursor} />}
      </div>
    </div>
  );
}

// ── Shared: Task List ──────────────────────────────────────────────────────
function TaskList({ date }: { date: string }) {
  const { plannerTasks, addPlannerTask, togglePlannerTask, deletePlannerTask } = useDataStore();
  const tasks = plannerTasks.filter(t => t.date===date);
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const d = new Date(date+"T00:00:00");
  const label = `${MS[d.getMonth()]} ${d.getDate()}`;

  function submit() { const v=input.trim(); if(v){addPlannerTask(date,v); setInput("");} }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if(e.key==="Enter") submit();
    if(e.key==="Escape"){setInput(""); inputRef.current?.blur();}
  }
  return (
    <div className="space-y-0.5">
      {tasks.map(t => (
        <div key={t.id} className="group flex items-start gap-2 px-1 py-1.5 rounded-lg hover:bg-black/[0.04] transition-colors">
          <button onClick={() => togglePlannerTask(t.id)} className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-primary transition-colors">
            {t.completed ? <CheckCircle2 className="h-4 w-4 text-primary"/> : <Circle className="h-4 w-4"/>}
          </button>
          <span className={cn(
            "relative flex-1 text-sm leading-snug min-w-0 break-words",
            t.completed && "text-muted-foreground/60"
          )}>
            {t.title}
            <ScribbleLine active={t.completed} />
          </span>
          <button onClick={() => deletePlannerTask(t.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-rose-500 transition-all shrink-0 mt-0.5">
            <X className="h-3.5 w-3.5"/>
          </button>
        </div>
      ))}

      <div
        className={cn("flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-text transition-colors",
          focused ? "bg-black/[0.04]" : "hover:bg-black/[0.04]")}
        onClick={() => inputRef.current?.focus()}
      >
        <Circle className="h-4 w-4 text-muted-foreground/25 shrink-0"/>
        <input ref={inputRef} type="text"
          placeholder={`Add a task for ${label}`}
          className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground/35 min-w-0"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); submit(); }}
          onKeyDown={onKey}
        />
      </div>
    </div>
  );
}

// ── Shared: NotesTile with smart list detection ─────────────────────────────
function NotesTile({
  noteKey, placeholder, className, minH="min-h-[120px]",
}: {
  noteKey: string; placeholder: string; className?: string; minH?: string;
}) {
  const { plannerNotes, setPlannerNote } = useDataStore();
  const value = plannerNotes[noteKey] ?? "";
  return (
    <textarea
      className={cn(
        "w-full resize-none bg-transparent text-sm text-foreground focus:outline-none",
        "placeholder:text-muted-foreground/40 leading-relaxed font-[inherit]",
        minH, className
      )}
      placeholder={placeholder}
      value={value}
      onChange={e => setPlannerNote(noteKey, e.target.value)}
      onKeyDown={e => handleSmartList(e, value, v => setPlannerNote(noteKey, v))}
    />
  );
}

// ── Shared: Panel card ─────────────────────────────────────────────────────
function Panel({ title, icon, children, className, headerBg }: { title?: string, icon?: React.ReactNode, children: React.ReactNode, className?: string, headerBg?: string }) {
  return (
    <div className={cn("flex flex-col rounded-xl border border-border/60 bg-white dark:bg-[#1c1c1e] shadow-sm overflow-hidden min-w-0", className)}>
      {title && (
        <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0", headerBg ?? "bg-white/80 dark:bg-[#242428]")}>
          {icon}
          <span className="font-semibold text-[13px] text-foreground truncate">{title}</span>
        </div>
      )}
      <div className="flex-1 p-4 min-w-0 min-h-0">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DAY VIEW  (no inline pomodoro — timer is in the header)
// ═══════════════════════════════════════════════════════════════════════════
function DayView({ cursor }: { cursor: Date }) {
  const dateKey    = fmtDate(cursor);
  const dayNoteKey = `day-notes-${dateKey}`;

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-start max-w-[1248px] mx-auto">
      <div className="md:col-span-2 space-y-4">
        <Panel title="Tasks" icon={<Calendar className="h-4 w-4 text-blue-500"/>} headerBg="bg-blue-50/60 dark:bg-blue-500/10">
          <TaskList date={dateKey}/>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Daily Notes" className="w-full">
          <NotesTile noteKey={dayNoteKey}
            placeholder="Jot down learnings, blockers, reflections..."
            minH="min-h-[260px]"/>
        </Panel>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════════════════════════════════════════
function WeekView({ cursor, cardSize }: { cursor: Date; cardSize: "compact" | "normal" | "spacious" }) {
  const ms          = weekStart(cursor);
  const weekKey     = isoWeek(cursor);
  const priorityKey = `week-priority-${weekKey}`;
  const weekDays    = Array.from({length:7}, (_,i) => addDays(ms,i));
  const dayNames    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const gridCols = cardSize === "compact"
    ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"   // 1 row of 8
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";  // Let it wrap naturally without forced grid-rows-2

  const minCardH = cardSize === "compact" ? "min-h-[200px]" : cardSize === "spacious" ? "min-h-[380px]" : "min-h-[280px]";

  return (
    <div className="p-4">
      <div className={cn("grid gap-4 w-full min-w-0 auto-rows-min", gridCols)}>
        {/* Weekly Priority */}
        <Panel title="Priority" headerBg="bg-rose-50/50 dark:bg-rose-500/10" className={minCardH}>
          <NotesTile noteKey={priorityKey}
            placeholder={"Priority items for this week..."}
            minH="min-h-0 h-full"/>
        </Panel>

        {/* Day columns */}
        {weekDays.map((day,i) => {
          const dateKey = fmtDate(day);
          const today   = isToday(day);
          return (
            <Panel key={dateKey}
              title={`${day.getDate()} ${dayNames[i]}${today?" · Today":""}`}
              icon={<Calendar className={cn("h-3.5 w-3.5", today?"text-primary":"text-muted-foreground")} />}
              headerBg={today ? "bg-primary/5" : "bg-white dark:bg-[#111113]"}
              className={cn(today && "ring-2 ring-primary/20", minCardH)}
            >
              <TaskList date={dateKey}/>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════════════════════════════════════
function MonthView({ cursor }: { cursor: Date }) {
  const mk = mmKey(cursor);
  return (
    <div className="p-5 space-y-4 max-w-[1248px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel title="Focus" headerBg="bg-slate-50 dark:bg-secondary">
          <NotesTile noteKey={`month-focus-${mk}`}
            placeholder="What will you focus on this month?" minH="min-h-[200px]"/>
        </Panel>
        <Panel title="Projects" headerBg="bg-slate-50 dark:bg-secondary">
          <NotesTile noteKey={`month-projects-${mk}`}
            placeholder="Key projects to complete this month" minH="min-h-[200px]"/>
        </Panel>
        <Panel title="Goals" headerBg="bg-slate-100/60 dark:bg-secondary">
          <NotesTile noteKey={`month-goals-${mk}`}
            placeholder="Main goals for this month" minH="min-h-[200px]"/>
        </Panel>
      </div>
      <Panel title="Notes">
        <NotesTile noteKey={`month-notes-${mk}`}
          placeholder="Monthly notes, reflections, or anything else..." minH="min-h-[140px]"/>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUARTER VIEW
// ═══════════════════════════════════════════════════════════════════════════
function QuarterView({ cursor }: { cursor: Date }) {
  const qs = qStart(cursor);
  const months = [0,1,2].map(i => addMonths(qs,i));
  return (
    <div className="p-5 max-w-[1248px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {months.map(m => {
          const mk = mmKey(m);
          return (
            <Panel key={mk} title={`${ML[m.getMonth()]} ${m.getFullYear()}`} headerBg="bg-slate-50 dark:bg-secondary">
              <NotesTile noteKey={`quarter-notes-${mk}`}
                placeholder="Notes, goals, or tasks for this month..." minH="min-h-[380px]"/>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// YEAR VIEW
// ═══════════════════════════════════════════════════════════════════════════
function YearView({ cursor }: { cursor: Date }) {
  const year   = cursor.getFullYear();
  const months = Array.from({length:12}, (_,i) => new Date(year,i,1));
  const now    = new Date();
  return (
    <div className="p-5 max-w-[1248px] mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map(m => {
          const mk      = mmKey(m);
          const isCur   = m.getFullYear()===now.getFullYear() && m.getMonth()===now.getMonth();
          return (
            <div key={mk}
              className={cn(
                "rounded-xl border bg-blue-50/50 dark:bg-blue-500/5 p-4 flex flex-col gap-2.5 min-h-[150px] transition-all hover:shadow-sm",
                isCur ? "border-primary/40 ring-2 ring-primary/15" : "border-blue-100/80 dark:border-blue-500/10"
              )}
            >
              <span className={cn("font-semibold text-[13px]", isCur?"text-primary":"text-foreground")}>
                {ML[m.getMonth()]}
              </span>
              <NotesTile noteKey={`year-notes-${mk}`}
                placeholder="Add notes..."
                minH="min-h-0 flex-1"
                className="text-xs"/>
            </div>
          );
        })}
      </div>
    </div>
  );
}
