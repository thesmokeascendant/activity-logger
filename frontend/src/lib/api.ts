import type {
  Activity,
  Project,
  Tag,
  Report,
  DashboardStats,
  PaginatedResponse,
  SearchResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API = `${BASE_URL}/api/v1`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Dashboard
export const getDashboard = (): Promise<DashboardStats> =>
  request("/dashboard");

// Projects
export const getProjects = (params?: Record<string, string>): Promise<PaginatedResponse<Project>> => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/projects${qs}`);
};
export const getProject = (id: string): Promise<Project> => request(`/projects/${id}`);
export const createProject = (data: Partial<Project> & { tag_ids?: string[] }): Promise<Project> =>
  request("/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id: string, data: Partial<Project> & { tag_ids?: string[] }): Promise<Project> =>
  request(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProject = (id: string): Promise<void> =>
  request(`/projects/${id}`, { method: "DELETE" });

// Activities
export const getActivities = (params?: Record<string, string>): Promise<PaginatedResponse<Activity>> => {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return request(`/activities${qs}`);
};
export const getActivity = (id: string): Promise<Activity> => request(`/activities/${id}`);
export const createActivity = (data: Partial<Activity> & { project_id?: string; tag_ids?: string[] }): Promise<Activity> =>
  request("/activities", { method: "POST", body: JSON.stringify(data) });
export const updateActivity = (id: string, data: Partial<Activity> & { tag_ids?: string[] }): Promise<Activity> =>
  request(`/activities/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteActivity = (id: string): Promise<void> =>
  request(`/activities/${id}`, { method: "DELETE" });

// Tags
export const getTags = (search?: string): Promise<{ items: Tag[]; total: number }> => {
  const qs = search ? `?search=${search}` : "";
  return request(`/tags${qs}`);
};
export const createTag = (data: { name: string; color: string }): Promise<Tag> =>
  request("/tags", { method: "POST", body: JSON.stringify(data) });
export const deleteTag = (id: string): Promise<void> =>
  request(`/tags/${id}`, { method: "DELETE" });

// Reports
export const getReports = (): Promise<{ items: Report[]; total: number }> => request("/reports");
export const getReport = (id: string): Promise<Report> => request(`/reports/${id}`);
export const generateReport = (data: { type: string; period_start: string; period_end: string }): Promise<Report> =>
  request("/reports", { method: "POST", body: JSON.stringify(data) });
export const deleteReport = (id: string): Promise<void> =>
  request(`/reports/${id}`, { method: "DELETE" });

// Search
export const search = (q: string, limit = 20): Promise<SearchResponse> =>
  request(`/search?q=${encodeURIComponent(q)}&limit=${limit}`);

// Export
export const getExportUrl = (format: "json" | "markdown") =>
  `${API}/export/${format === "json" ? "json" : "markdown"}`;
