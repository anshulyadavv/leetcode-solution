"use client";

import { usePathname } from "next/navigation";
import { Terminal } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname.startsWith("/planner")) return null;

  return (
    <footer className="border-t border-border/40 bg-background/60 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">CodePractice</span>
          <span className="text-xs text-muted-foreground/40">—</span>
          <span className="text-xs text-muted-foreground/60">Interview prep, built for engineers</span>
        </div>
        <a
          href="https://github.com/Anshul"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="GitHub"
        >
          <span className="text-xs font-semibold">Made with ❤ By Anshul</span>
        </a>
      </div>
    </footer>
  );
}
