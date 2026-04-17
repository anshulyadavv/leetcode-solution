import { MessageSquare, Clock } from "lucide-react";

export default function BlogPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="bg-primary/10 p-6 rounded-full">
        <MessageSquare className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-4xl font-outfit font-black">Coming Soon</h1>
      <p className="text-muted-foreground max-w-sm">
        We're working on deep dives into interview strategies, algorithm patterns, and more. 
        Stay tuned!
      </p>
    </div>
  );
}
