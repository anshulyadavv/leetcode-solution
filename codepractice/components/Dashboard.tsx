"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useDataStore, Question } from "@/lib/data-store";
import { Search, Plus, ExternalLink, ChevronDown, Check, Zap, AlertCircle, Hash, ArrowUpDown, CheckCircle2, Trophy, Target, Activity, CalendarDays, CalendarRange } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Scribble-through effect ───────────────────────────────────────────────
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
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-scribble"
      />
    </svg>
  );
}

type SortKey = "id" | "title" | "difficulty" | "acceptance" | "frequency";
type SortOrder = "asc" | "desc" | null;

const DIFFICULTY_ORDER = { "Easy": 1, "Medium": 2, "Hard": 3 };

export default function Dashboard({ initialCompany }: { initialCompany?: string }) {
  const { questions, initData, addToList, addPlannerTask, todoLists, completedQuestions, toggleQuestionCompletion } = useDataStore();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    initData();
  }, [initData]);

  const stats = useMemo(() => {
    if (questions.length === 0) return { total: 0, done: 0, easy: { total: 0, done: 0 }, medium: { total: 0, done: 0 }, hard: { total: 0, done: 0 } };

    const compMatch = initialCompany?.toLowerCase().trim();
    const scopeQuestions = compMatch 
      ? questions.filter(q => q.companies.some(c => c.toLowerCase() === compMatch))
      : questions;

    const total = scopeQuestions.length;
    const done = scopeQuestions.filter(q => completedQuestions.includes(q.slug)).length;
    
    const easy = scopeQuestions.filter(q => q.difficulty === "Easy");
    const medium = scopeQuestions.filter(q => q.difficulty === "Medium");
    const hard = scopeQuestions.filter(q => q.difficulty === "Hard");

    return {
      total,
      done,
      easy: { total: easy.length, done: easy.filter(q => completedQuestions.includes(q.slug)).length },
      medium: { total: medium.length, done: medium.filter(q => completedQuestions.includes(q.slug)).length },
      hard: { total: hard.length, done: hard.filter(q => completedQuestions.includes(q.slug)).length },
    };
  }, [questions, completedQuestions, initialCompany]);

  const topics = useMemo(() => {
    const allTopics = new Set(questions.flatMap(q => q.topics));
    return Array.from(allTopics).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const compMatch = initialCompany?.toLowerCase().trim();
    return questions.filter((q) => {
      const matchesSearch = q.title.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                            q.slug.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                            q.companies.some(c => c.toLowerCase().includes(deferredSearch.toLowerCase()));
      const matchesDifficulty = selectedDifficulty.length === 0 || selectedDifficulty.includes(q.difficulty);
      const matchesTopics = selectedTopics.length === 0 || selectedTopics.every(t => q.topics.includes(t));
      const matchesCompany = !compMatch || q.companies.some(c => c.toLowerCase() === compMatch);
      return matchesSearch && matchesDifficulty && matchesTopics && matchesCompany;
    });
  }, [questions, deferredSearch, selectedDifficulty, selectedTopics, initialCompany]);

  const sortedQuestions = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredQuestions;

    return [...filteredQuestions].sort((a, b) => {
      let valA: any = a[sortKey as keyof Question];
      let valB: any = b[sortKey as keyof Question];

      if (sortKey === "difficulty") {
        valA = DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER];
        valB = DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER];
      } else if (sortKey === "acceptance" || sortKey === "frequency") {
        valA = parseFloat((a as any)[sortKey]) || 0;
        valB = parseFloat((b as any)[sortKey]) || 0;
      } else if (sortKey === "id") {
        valA = parseInt(a.id) || 0;
        valB = parseInt(b.id) || 0;
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredQuestions, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedQuestions.length / itemsPerPage);
  const paginatedQuestions = sortedQuestions.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") setSortOrder(null);
      else setSortOrder("asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Overall Progress" 
          done={stats.done} 
          total={stats.total} 
          icon={<Trophy className="h-4 w-4 text-indigo-500" />}
          color="indigo"
        />
        <StatCard 
          label="Easy" 
          done={stats.easy.done} 
          total={stats.easy.total} 
          icon={<Zap className="h-4 w-4 text-emerald-500" />}
          color="emerald"
        />
        <StatCard 
          label="Medium" 
          done={stats.medium.done} 
          total={stats.medium.total} 
          icon={<Activity className="h-4 w-4 text-amber-500" />}
          color="amber"
        />
        <StatCard 
          label="Hard" 
          done={stats.hard.done} 
          total={stats.hard.total} 
          icon={<Target className="h-4 w-4 text-rose-500" />}
          color="rose"
        />
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-white/60 dark:bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-premium">
        {/* Search */}
        <div className="relative group w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search problems..."
            className="w-full h-10 pl-10 pr-4 text-sm font-medium bg-white/70 dark:bg-black/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-border/60 hidden xl:block mx-1" />

        <FilterDropdown 
          label="Difficulty" 
          options={["Easy", "Medium", "Hard"]} 
          selected={selectedDifficulty}
          onSelect={setSelectedDifficulty}
        />

        <SearchableTopicPicker 
          topics={topics}
          selected={selectedTopics}
          onSelect={setSelectedTopics}
        />

        {/* Sort tabs */}
        <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl border border-border/40 ml-auto">
          <SortTab active={sortKey === 'id'} order={sortOrder} onClick={() => toggleSort('id')} label="ID" />
          <SortTab active={sortKey === 'title'} order={sortOrder} onClick={() => toggleSort('title')} label="Name" />
          <SortTab active={sortKey === 'difficulty'} order={sortOrder} onClick={() => toggleSort('difficulty')} label="Level" />
          <SortTab active={sortKey === 'frequency'} order={sortOrder} onClick={() => toggleSort('frequency')} label="Freq" />
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span>
          Showing <span className="text-foreground font-bold">{paginatedQuestions.length}</span> of <span className="text-foreground font-bold">{sortedQuestions.length}</span> problems
          {(selectedDifficulty.length > 0 || selectedTopics.length > 0 || search) && (
            <button 
              onClick={() => { setSelectedDifficulty([]); setSelectedTopics([]); setSearch(""); setPage(1); }}
              className="ml-2 text-primary hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </span>
      </div>

      {/* Question List */}
      <div className="space-y-2">
        {/* Column Headers */}
        <div className="hidden md:grid grid-cols-12 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 bg-secondary/30 rounded-xl">
          <div className="col-span-1 pl-10">ID</div>
          <div className="col-span-5">Problem</div>
          <div className="col-span-2">Difficulty</div>
          <div className="col-span-2">Acceptance</div>
          <div className="col-span-2 text-right pr-10">Frequency</div>
        </div>

        {paginatedQuestions.map((q, idx) => (
          <QuestionRow 
            key={q.slug} 
            index={(page - 1) * itemsPerPage + idx + 1}
            question={q} 
            onAddToTodo={(listId) => {
              addToList(listId, { title: q.title, slug: q.slug, type: 'question' });
              // Bridge to Planner: daily → today, weekly → this Monday
              if (listId === 'daily' || listId === 'weekly') {
                const today = new Date();
                const date = listId === 'daily'
                  ? `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
                  : (() => {
                      const d = new Date(today);
                      const day = d.getDay();
                      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    })();
                addPlannerTask(date, q.title);
              }
            }} 
            todoLists={todoLists}
            isCompleted={completedQuestions.includes(q.slug)}
            onToggleComplete={() => toggleQuestionCompletion(q.slug)}
          />
        ))}

        {paginatedQuestions.length === 0 && (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-black rounded-2xl border border-border border-dashed">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/20" />
            <div className="space-y-1">
              <p className="font-semibold text-base">No problems found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border/50">
        <div className="flex items-center gap-1 bg-white dark:bg-black p-1 rounded-xl border border-border shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2">Show</span>
          {[10, 25, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => { setItemsPerPage(size); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                itemsPerPage === size ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground font-medium hidden sm:block">
            Page <span className="text-foreground font-bold">{page}</span> of {totalPages || 1}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              disabled={page === 1}
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn-premium p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              disabled={page >= totalPages}
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SortTab({ active, order, onClick, label }: { 
  active: boolean, 
  order: SortOrder, 
  onClick: () => void,
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
        active ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-secondary"
      )}
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", active ? "opacity-100" : "opacity-25")} />
    </button>
  );
}

function QuestionRow({ question, index, onAddToTodo, todoLists, isCompleted, onToggleComplete }: { 
  question: Question, 
  index: number,
  onAddToTodo: (listId: string) => void, 
  todoLists: any[],
  isCompleted: boolean,
  onToggleComplete: () => void
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className={cn(
      "group bg-white dark:bg-black border rounded-xl transition-all duration-200 hover:shadow-md hover:border-border",
      isCompleted 
        ? "bg-emerald-50/40 border-emerald-100/80" 
        : "border-border/60 hover:border-primary/20"
    )}>
      <div className="grid grid-cols-1 md:grid-cols-12 items-center px-4 py-4 gap-3 min-w-0">
        {/* Checkbox + Index */}
        <div className="col-span-1 flex items-center gap-3">
          <button 
            onClick={onToggleComplete}
            className={cn(
              "p-1 rounded-md border-2 transition-all hover:scale-105 active:scale-95 flex-shrink-0",
              isCompleted 
                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200 animate-checkbox" 
                : "border-slate-200 bg-white dark:bg-black hover:border-emerald-400"
            )}
            title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
          >
            <Check className={cn("h-3.5 w-3.5 transition-all duration-200", isCompleted ? "opacity-100 scale-100" : "opacity-0 scale-75")} strokeWidth={3} />
          </button>
          <span className="text-[10px] font-black tracking-tight text-muted-foreground/30 hidden md:block">
            #{index}
          </span>
        </div>
        
        {/* Title + Companies */}
        <div className="col-span-5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <a 
              href={question.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "relative text-sm font-bold transition-colors flex items-center gap-1.5 group/link min-w-0",
                isCompleted ? "text-muted-foreground" : "text-foreground hover:text-primary"
              )}
            >
              <span className="truncate relative">
                {question.title}
                <ScribbleLine active={isCompleted} />
              </span>
              <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover/link:opacity-50 transition-opacity" />
            </a>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {question.companies.slice(0, 4).map(c => (
              <Link
                key={c}
                href={`/company/${c}`}
                className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary/80 text-secondary-foreground rounded-md border border-border/20 hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all"
              >
                {c}
              </Link>
            ))}
            {question.companies.length > 4 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary/40 text-muted-foreground rounded-md border border-border/20">
                +{question.companies.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Difficulty */}
        <div className="col-span-2">
          <DifficultyBadge difficulty={question.difficulty} />
        </div>

        {/* Acceptance */}
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex-grow bg-secondary rounded-full h-1.5 max-w-[70px] overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  parseFloat(question.acceptance) > 50 ? "bg-emerald-400" : "bg-slate-300"
                )}
                style={{ width: question.acceptance }}
              />
            </div>
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">{question.acceptance}</span>
          </div>
        </div>

        {/* Frequency + Add Button */}
        <div className="col-span-2 flex items-center justify-end gap-4">
          <span className={cn(
            "text-sm font-black tabular-nums",
            question.frequency > 75 ? "text-primary" : "text-foreground/70"
          )}>
            {question.frequency.toFixed(1)}%
          </span>
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary hover:text-white transition-all"
              title="Add to planner"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-black rounded-xl shadow-2xl border border-border z-50 p-2 overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                    Add to Planner
                  </p>
                  {todoLists.map((list) => {
                    const isDaily  = list.id === 'daily';
                    const isWeekly = list.id === 'weekly';
                    return (
                      <button
                        key={list.id}
                        onClick={() => { onAddToTodo(list.id); setShowAddMenu(false); }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-2 rounded-lg"
                      >
                        {isDaily  ? <CalendarDays  className="h-3.5 w-3.5 text-blue-500 shrink-0" /> :
                         isWeekly ? <CalendarRange className="h-3.5 w-3.5 text-violet-500 shrink-0" /> :
                                    <CheckCircle2  className="h-3.5 w-3.5 opacity-40 shrink-0" />}
                        <span className="flex-1">{list.name}</span>
                        {(isDaily || isWeekly) && (
                          <span className="text-[8px] font-bold uppercase tracking-wider text-primary/60 bg-primary/8 px-1.5 py-0.5 rounded">Planner</span>
                        )}
                      </button>
                    );
                  })}
                  {todoLists.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      Go to the <Link href="/planner" className="text-primary hover:underline font-semibold">Planner</Link> to create queues.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles = {
    Easy: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Medium: "bg-amber-50 text-amber-700 border-amber-100",
    Hard: "bg-rose-50 text-rose-700 border-rose-100"
  };
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border",
      styles[difficulty as keyof typeof styles]
    )}>
      {difficulty}
    </span>
  );
}

function SearchableTopicPicker({ topics, selected, onSelect }: { 
  topics: string[], 
  selected: string[], 
  onSelect: (val: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTopics = useMemo(() => {
    return topics.filter(t => t.toLowerCase().includes(search.toLowerCase()));
  }, [topics, search]);

  return (
    <div className="relative w-full sm:w-52 shrink-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center justify-between px-3.5 text-sm font-medium bg-white/70 dark:bg-black/50 border border-border/50 rounded-xl hover:bg-white dark:hover:bg-secondary transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          <span className="text-sm font-medium">
            {selected.length > 0 ? `Topics (${selected.length})` : "Topics"}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-black rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
            <div className="p-2 border-b border-border/50">
              <input 
                type="text"
                placeholder="Search topics..."
                className="w-full bg-secondary/50 border-none rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
              {filteredTopics.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
                    onSelect(next);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs font-medium transition-all rounded-lg flex items-center justify-between",
                    selected.includes(opt) ? "bg-emerald-50 text-emerald-700" : "hover:bg-secondary text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      selected.includes(opt) ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                    {opt}
                  </span>
                  {selected.includes(opt) && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                </button>
              ))}
              {filteredTopics.length === 0 && (
                <p className="p-3 text-center text-xs text-muted-foreground">No topics match</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterDropdown({ label, options, selected, onSelect }: { 
  label: string, 
  options: string[], 
  selected: string[], 
  onSelect: (val: string[]) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full sm:w-44 shrink-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 flex items-center justify-between px-3.5 text-sm font-medium bg-white/70 dark:bg-black/50 border border-border/50 rounded-xl hover:bg-white dark:hover:bg-secondary transition-all active:scale-[0.98]"
      >
        <span>{selected.length > 0 ? `${label} (${selected.length})` : label}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-black rounded-xl shadow-2xl border border-border z-50 p-1.5 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
                  onSelect(next);
                }}
                className={cn(
                  "w-full text-left px-3.5 py-2.5 text-xs font-semibold transition-all rounded-lg flex items-center justify-between",
                  selected.includes(opt) ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"
                )}
              >
                {opt}
                {selected.includes(opt) && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, done, total, icon, color }: { label: string, done: number, total: number, icon: React.ReactNode, color: string }) {
  const percentage = total > 0 ? (done / total) * 100 : 0;
  
  return (
    <div className="premium-card p-5 bg-white dark:bg-black group hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-secondary/60 group-hover:scale-105 transition-transform">
          {icon}
        </div>
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
          color === "indigo" && "bg-indigo-50 text-indigo-600",
          color === "emerald" && "bg-emerald-50 text-emerald-600",
          color === "amber" && "bg-amber-50 text-amber-600",
          color === "rose" && "bg-rose-50 text-rose-600",
        )}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-black text-foreground">{done}</h3>
          <span className="text-sm font-bold text-muted-foreground/50">/ {total}</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            color === "indigo" && "bg-indigo-500",
            color === "emerald" && "bg-emerald-500",
            color === "amber" && "bg-amber-500",
            color === "rose" && "bg-rose-500",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
