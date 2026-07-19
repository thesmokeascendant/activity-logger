"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Download, Tag as TagIcon } from "lucide-react";
import { getTags, createTag, deleteTag, getExportUrl } from "@/lib/api";
import { Tag } from "@/types";
import { Skeleton } from "@/components/shared/Skeleton";

const TAG_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899",
  "#14b8a6", "#8b5cf6", "#f97316", "#3b82f6",
  "#ef4444", "#22c55e", "#94a3b8", "#06b6d4",
];

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagError, setTagError] = useState("");

  useEffect(() => {
    getTags().then(r => setTags(r.items)).finally(() => setLoadingTags(false));
  }, []);

  async function handleCreateTag() {
    if (!newTagName.trim()) { setTagError("Tag name is required"); return; }
    setCreatingTag(true);
    setTagError("");
    try {
      const tag = await createTag({ name: newTagName.trim(), color: newTagColor });
      setTags(prev => [...prev, tag]);
      setNewTagName("");
    } catch {
      setTagError("Failed to create tag. Name may already exist.");
    } finally {
      setCreatingTag(false);
    }
  }

  function handleDeleteTag(id: string) {
    deleteTag(id).then(() => setTags(prev => prev.filter(t => t.id !== id)));
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-5">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage tags, export data, and preferences.</p>
      </div>

      {/* Export */}
      <Section title="Export Data" description="Download your complete activity history.">
        <div className="flex flex-wrap gap-3">
          <a
            href={getExportUrl("json")}
            download
            className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Export as JSON
          </a>
          <a
            href={getExportUrl("markdown")}
            download
            className="flex items-center gap-2 px-4 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Export as Markdown
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          All data is stored locally on your machine. No data is sent to external servers.
        </p>
      </Section>

      {/* Tags */}
      <Section title="Tags" description="Create and manage labels for your activities and projects.">
        {/* Create tag */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateTag()}
            placeholder="Tag name"
            className="flex-1 min-w-32 bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-1.5 flex-wrap items-center">
            {TAG_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewTagColor(c)}
                className={`w-5 h-5 rounded-full transition-transform ${newTagColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-card scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            onClick={handleCreateTag}
            disabled={creatingTag}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {tagError && <p className="text-xs text-destructive mb-3">{tagError}</p>}

        {/* Tag list */}
        {loadingTags ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-6">
            <TagIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tags yet. Create one above.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${tag.color}18`, color: tag.color }}
              >
                {tag.name}
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* About */}
      <Section title="About">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-foreground font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Storage</span>
            <span className="text-foreground">Local SQLite</span>
          </div>
          <div className="flex justify-between">
            <span>Privacy</span>
            <span className="text-foreground">100% local — no telemetry</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
