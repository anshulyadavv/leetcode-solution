// Planner gets its own layout — no max-width or padding constraints,
// so the full-viewport panel UI can fill the screen properly.
export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
