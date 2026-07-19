"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Activity, FolderOpen, Tag } from "lucide-react";
import { search } from "@/lib/api";
import { SearchResult } from "@/types";
import { formatRelative, getTypeLabel } from "@/lib/utils";
import { ActivityIcon } from "@/components/shared/ActivityIcon";
import Link from "next/link";

function ResultItem({ result }: { result: SearchResult }) {
  const href =
    result.type === "project"
      ? `/projects/${result.id}`
      : result.type === "activity"
      ? `/timeline`
      : `/settings`;

  const Icon =
    result.type === "project"
      ? FolderOpen
      : result.type === "tag"
      ? Tag
      : null;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors rounded-lg"
    >
      {result.type === "activity" ? (
        <ActivityIcon type={result.subtitle || "manual"} size="sm" />
      ) : Icon ? (
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      ) : null}

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{result.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground capitalize">
            {result.type === "activity" ? getTypeLabel(result.subtitle || "") : result.type}
          </span>
          {result.project_name && (
            <>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">{result.project_name}</span>
            </>
          )}
        </div>
      </div>

      {(result.occurred_at || result.created_at) && (
        <span className="text-xs text-muted-foreground shrink-0">
          {formatRelative(result.occurred_at || result.created_at || "")}
        </span>
      )}
    </Link>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await search(query.trim());
        setResults(r.results);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const activities = results.filter(r => r.type === "activity");
  const projects = results.filter(r => r.type === "project");
  const tags = results.filter(r => r.type === "tag");

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-4">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activities, projects, tags…"
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {!query && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <SearchIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Search across all your activities, projects, and tags.
          </p>
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            No results for &ldquo;<span className="text-foreground">{query}</span>&rdquo;
          </p>
          <p className="text-xs text-muted-foreground mt-1">Try a different keyword.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>

          {activities.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                Activities
              </h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {activities.map((r) => <ResultItem key={r.id} result={r} />)}
              </div>
            </section>
          )}

          {projects.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                Projects
              </h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {projects.map((r) => <ResultItem key={r.id} result={r} />)}
              </div>
            </section>
          )}

          {tags.length > 0 && (
            <section>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-1">
                Tags
              </h2>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {tags.map((r) => <ResultItem key={r.id} result={r} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
