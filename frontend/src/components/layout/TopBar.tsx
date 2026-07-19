"use client";

import { useState } from "react";
import { Search, Plus, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { QuickAddModal } from "@/components/shared/QuickAddModal";

export function TopBar() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const router = useRouter();

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 h-14 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Activity Logger</span>
        </div>

        {/* Search bar */}
        <button
          onClick={() => router.push("/search")}
          className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm transition-colors w-64 text-left"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span>Search everything…</span>
          <kbd className="ml-auto text-xs bg-background/50 px-1.5 py-0.5 rounded border border-border font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Activity</span>
          </button>
        </div>
      </header>

      {showQuickAdd && <QuickAddModal onClose={() => setShowQuickAdd(false)} />}
    </>
  );
}
