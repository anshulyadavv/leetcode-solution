"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useDataStore } from "@/lib/data-store";
import { 
  Building2, Search, ArrowRight, TrendingUp,
  Command, Sparkles, ChevronDown, Check,
  Zap, ArrowUpDown, Globe, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";


type CompanySortMode = "volume_desc" | "volume_asc" | "alpha_asc" | "alpha_desc";
type FilterType = "all" | "trending" | "enterprise";

export default function CompaniesPage() {
  const { companies, initData, questions } = useDataStore();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortMode, setSortMode] = useState<CompanySortMode>("volume_desc");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    initData();
  }, [initData]);

  // Live Stats Calculation
  const companyStats = useMemo(() => {
    const stats: Record<string, { total: number, Easy: number, Medium: number, Hard: number }> = {};
    questions.forEach(q => {
      q.companies.forEach(c => {
        if (!stats[c]) stats[c] = { total: 0, Easy: 0, Medium: 0, Hard: 0 };
        stats[c].total++;
        stats[c][q.difficulty]++;
      });
    });
    return stats;
  }, [questions]);

  const filteredAndSorted = useMemo(() => {
    let result = companies.map(c => ({
      ...c,
      liveCount: companyStats[c.slug]?.total || 0,
      difficulty: companyStats[c.slug] || { Easy: 0, Medium: 0, Hard: 0 }
    }));

    if (deferredSearch) {
      result = result.filter(c => 
        c.displayName.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        c.slug.toLowerCase().includes(deferredSearch.toLowerCase())
      );
    }

    if (filter === "trending") result = result.filter(c => c.liveCount > 40);
    else if (filter === "enterprise") result = result.filter(c => c.liveCount > 100);

    return result.sort((a, b) => {
      switch (sortMode) {
        case "volume_desc": return b.liveCount - a.liveCount;
        case "volume_asc": return a.liveCount - b.liveCount;
        case "alpha_asc": return a.displayName.localeCompare(b.displayName);
        case "alpha_desc": return b.displayName.localeCompare(a.displayName);
        default: return 0;
      }
    });
  }, [companies, companyStats, deferredSearch, sortMode, filter]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [deferredSearch, filter, sortMode]);

  const totalQuestions = questions.length;
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginated = filteredAndSorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const startItem = filteredAndSorted.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, filteredAndSorted.length);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pt-10 pb-20">
      {/* Header */}
      <header className="space-y-6 pb-10 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/15">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary/70">
                Registry System v4.0
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-sans font-extrabold tracking-tighter text-foreground leading-[0.95]">
                Global <span className="text-primary">Index</span>
              </h1>
              <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
                Live distribution analysis of {companies.length} indexed firms with difficulty-weighted logic module counts.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-wrap gap-2 items-center bg-white/60 dark:bg-muted/40 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-premium">
        {/* Search */}
        <div className="relative group w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search firm registry..."
            className="w-full h-10 pl-10 pr-4 text-sm font-medium bg-white/70 dark:bg-black/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="h-6 w-px bg-border/60 hidden lg:block mx-1" />

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" icon={Globe} />
          <FilterChip active={filter === "trending"} onClick={() => setFilter("trending")} label="Trending" icon={Zap} />
          <FilterChip active={filter === "enterprise"} onClick={() => setFilter("enterprise")} label="Enterprise" icon={Sparkles} />
        </div>

        {/* Sort — pushed to the right */}
        <div className="relative ml-auto">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-10 px-4 flex items-center gap-2 bg-secondary/60 border border-border/40 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white dark:hover:bg-secondary/40 hover:border-primary/30 transition-all shadow-sm"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
            <span className="truncate max-w-[80px]">
              {sortMode === "volume_desc" ? "Volume ↓" : sortMode === "volume_asc" ? "Volume ↑" : sortMode === "alpha_asc" ? "A → Z" : "Z → A"}
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform shrink-0", showSortMenu && "rotate-180")} />
          </button>
          
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-44 bg-white/95 dark:bg-black backdrop-blur-xl rounded-xl shadow-2xl border border-border z-50 p-1.5 ring-1 ring-black/5 dark:ring-white/5">
                {[
                  { id: "volume_desc", label: "Volume (High → Low)" },
                  { id: "volume_asc", label: "Volume (Low → High)" },
                  { id: "alpha_asc", label: "Alphabetical A–Z" },
                  { id: "alpha_desc", label: "Alphabetical Z–A" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => { setSortMode(opt.id as CompanySortMode); setShowSortMenu(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs font-semibold transition-all rounded-lg flex items-center justify-between",
                      sortMode === opt.id ? "bg-primary text-white shadow-md shadow-primary/20" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt.label}
                    {sortMode === opt.id && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground -mt-4">
        <span>
          {filteredAndSorted.length === 0
            ? "No firms found"
            : <>Showing <span className="text-foreground font-semibold">{startItem}–{endItem}</span> of <span className="text-foreground font-semibold">{filteredAndSorted.length}</span> firms</>}
        </span>
        {(deferredSearch || filter !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="text-primary hover:underline text-xs font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Company Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {paginated.map((company) => {
          const stats = company.difficulty;
          const percentage = ((company.liveCount / (totalQuestions || 1)) * 100).toPrecision(2);
          
          return (
            <Link 
              key={company.slug}
              href={`/company/${company.slug}`} 
              className="premium-card group relative p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-1 overflow-hidden bg-white dark:bg-black"
            >
              {/* Hover Glow */}
              <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full -mr-14 -mt-14 blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-xl bg-secondary/60 border border-border/60 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 text-muted-foreground">
                    <Building2 className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/80 text-[10px] font-black tracking-wide">
                    <TrendingUp className="h-3 w-3" />
                    {percentage}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                    {company.displayName}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    <DifficultyDot count={stats.Easy} color="bg-emerald-500" label="E" />
                    <DifficultyDot count={stats.Medium} color="bg-amber-500" label="M" />
                    <DifficultyDot count={stats.Hard} color="bg-rose-500" label="H" />
                  </div>
                </div>
              </div>

              <div className="pt-5 space-y-3 relative z-10">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-700 group-hover:brightness-110"
                    style={{ width: `${Math.min(100, (company.liveCount / 300) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="flex items-center gap-1">
                    Module Count 
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </span>
                  <span className="font-black text-foreground text-xs group-hover:text-primary transition-colors">{company.liveCount}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="py-28 text-center rounded-2xl bg-white/60 dark:bg-black/60 border border-border border-dashed flex flex-col items-center gap-4">
          <Command className="h-10 w-10 text-muted-foreground/30" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No firms found</h2>
            <p className="text-muted-foreground text-sm">
              Try a different search term or clear the active filters.
            </p>
          </div>
          <button 
            onClick={() => { setSearch(""); setFilter("all"); }}
            className="btn-secondary text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
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

        {totalPages > 1 && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-white dark:bg-black hover:bg-secondary dark:hover:bg-secondary transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === "number" && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-sm text-muted-foreground select-none">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-semibold transition-all",
                        page === p
                          ? "bg-primary text-white shadow-sm shadow-primary/20"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-white dark:bg-black hover:bg-secondary dark:hover:bg-secondary transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DifficultyDot({ count, color, label }: { count: number, color: string, label: string }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/60 rounded-md border border-border/40 group-hover:bg-white dark:group-hover:bg-secondary transition-colors">
      <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", color)} />
      <span className="text-[9px] font-black text-muted-foreground">{count}{label}</span>
    </div>
  );
}

function FilterChip({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon: React.ComponentType<{className?: string}> }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border active:scale-95 whitespace-nowrap",
        active 
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
          : "bg-white/60 dark:bg-black/60 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground hover:bg-white dark:hover:bg-secondary"
      )}
    >
      <Icon className={cn("h-3 w-3", active ? "text-white" : "text-primary/60")} />
      {label}
    </button>
  );
}
