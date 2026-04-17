import { Building2, ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import fs from "fs";
import path from "path";

export async function generateStaticParams() {
  const dataPath = path.resolve(process.cwd(), "public/data/questions.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  return data.companies.map((company: any) => ({
    slug: company.slug,
  }));
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const dataPath = path.resolve(process.cwd(), "public/data/questions.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  
  const company = data.companies.find((c: any) => c.slug === slug);

  if (!company) return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="premium-card p-12 text-center space-y-6 max-w-md w-full">
        <div className="p-4 bg-rose-50 rounded-2xl w-fit mx-auto">
          <Building2 className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Company Not Found</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Firm identifier <span className="text-foreground font-mono font-bold tracking-wider bg-secondary px-1.5 py-0.5 rounded">{slug}</span> was not found in the registry.
          </p>
        </div>
        <Link href="/companies" className="btn-premium justify-center w-full">
          Return to Directory
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10 pt-10 pb-20">
      {/* Header */}
      <header className="space-y-5 pb-10 border-b border-border">
        <Link 
          href="/companies" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Company Directory
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-sans font-extrabold tracking-tighter text-foreground leading-none">
              {company.displayName} <span className="text-primary">Problems</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
              All logic modules tagged for {company.displayName} — sorted by frequency and weighted by difficulty.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground bg-white/70 dark:bg-black/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-border/50 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-bold uppercase tracking-wider text-primary/70">{company.slug}</span>
            </div>
            <span className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-bold">Active</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <Dashboard initialCompany={slug} />
      </section>
    </div>
  );
}
