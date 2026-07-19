import {
  GitCommit,
  GitBranch,
  FileEdit,
  StickyNote,
  Terminal,
  Globe,
  Users,
  BookOpen,
  Sparkles,
  Bug,
  Rocket,
  RefreshCw,
  FileText,
  FlaskConical,
  Hammer,
  Eye,
  PenLine,
  FolderPlus,
  FolderOpen,
  Activity,
} from "lucide-react";
import { getTypeColor } from "@/lib/utils";

const ICON_MAP: Record<
  string,
  React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>
> = {
  git_commit: GitCommit,
  git_push: GitBranch,
  file_edit: FileEdit,
  note: StickyNote,
  terminal: Terminal,
  browser_visit: Globe,
  meeting: Users,
  research: BookOpen,
  feature: Sparkles,
  bug_fix: Bug,
  deploy: Rocket,
  refactor: RefreshCw,
  documentation: FileText,
  test: FlaskConical,
  build: Hammer,
  review: Eye,
  manual: PenLine,
  project_created: FolderPlus,
  project_updated: FolderOpen,
};

interface ActivityIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
  showBg?: boolean;
}

const SIZE_MAP = {
  sm: { wrapper: "w-7 h-7", icon: "w-3.5 h-3.5" },
  md: { wrapper: "w-8 h-8", icon: "w-4 h-4" },
  lg: { wrapper: "w-10 h-10", icon: "w-5 h-5" },
};

export function ActivityIcon({ type, size = "md", showBg = true }: ActivityIconProps) {
  const Icon = ICON_MAP[type] || Activity;
  const color = getTypeColor(type);
  const sizes = SIZE_MAP[size];

  if (!showBg) {
    return <Icon className={sizes.icon} style={{ color }} />;
  }

  return (
    <div
      className={`${sizes.wrapper} rounded-lg flex items-center justify-center shrink-0`}
      style={{ backgroundColor: `${color}18` }}
    >
      <Icon className={sizes.icon} style={{ color }} />
    </div>
  );
}
