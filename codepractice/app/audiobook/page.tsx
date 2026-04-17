import { Headphones, Terminal, Sparkles } from "lucide-react";

export default function AudiobookPlaceholder() {
  return (
    <div className="pt-40 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-20 px-4">
      <div className="bg-black dark:bg-white p-20 rounded-none shadow-[20px_20px_0px_#f1f1f1] dark:shadow-[20px_20px_0px_#111]">
        <Headphones className="h-28 w-28 text-white dark:text-black" />
      </div>
      
      <div className="space-y-8">
        <div className="flex items-center justify-center gap-4">
           <Terminal className="h-4 w-4 text-black dark:text-white" />
           <span className="font-mono text-[10px] font-black text-black dark:text-white tracking-[0.5em] uppercase">STATUS // RESEARCH_LABS</span>
        </div>
        <h1 className="text-8xl md:text-[10rem] font-sans font-black tracking-tighter text-black dark:text-white uppercase italic leading-none">
          AUDIO<span className="opacity-20 text-black dark:text-white">LOGS</span>
        </h1>
        <p className="text-black/60 dark:text-white/60 font-mono text-[10px] leading-relaxed uppercase tracking-widest max-w-sm mx-auto">
          // Synthesizing algorithmic narration for archived firm interrogates. <br />
          // Progress: [|||||||||| 100%]
        </p>
      </div>

      <div className="btn-primary group !bg-white dark:!bg-black !text-black dark:!text-white border border-black dark:border-white hover:!bg-black dark:hover:!bg-white hover:!text-white dark:hover:!text-black transition-all">
        <Sparkles className="h-4 w-4" /> Target_Deployment: Q4_2026
      </div>
    </div>
  );
}
