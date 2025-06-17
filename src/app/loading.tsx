
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function Loading() {
  // This loading UI will be shown while the root page (e.g., login page) is loading its content.
  return (
    <>
      <GlobalPreloaderScreen message="Loading application..." />
      <footer className="text-center py-4 px-6 border-t bg-background text-sm text-muted-foreground shrink-0">Design, Development & Hosting by Limidora</footer>
    </>
  );
}
