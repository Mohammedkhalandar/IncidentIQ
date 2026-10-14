import axios from "axios";
import type {
  Comment,
  DashboardSummary,
  HistoryItem,
  Incident,
  Page,
  Priority,
  Status,
  Team,
  User,
} from "./types";
import type { SlaPolicy } from "./types";
const baseURL = import.meta.env.VITE_API_URL || "/api/v1";
export const api = axios.create({ baseURL, timeout: 12000 });
api.interceptors.request.use((c) => {
  const token = localStorage.getItem("incidentiq_token");
  if (token) c.headers.Authorization = `Bearer ${token}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (
      e.response?.status === 401 &&
      !String(e.config?.url).includes("/auth/login")
    ) {
      localStorage.removeItem("incidentiq_token");
      localStorage.removeItem("incidentiq_user");
      window.dispatchEvent(new Event("incidentiq:unauthorized"));
    }
    return Promise.reject(e);
  },
);
export const login = async (email: string, password: string) =>
  (
    await api.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    })
  ).data;
export const getSummary = async () =>
  (await api.get<DashboardSummary>("/dashboard/summary")).data;
export const getIncidents = async (params: {
  page?: number;
  size?: number;
  search?: string;
  status?: Status | "";
  priority?: Priority | "";
}) => (await api.get<Page<Incident>>("/incidents", { params })).data;
export const createIncident = async (data: {
  title: string;
  description: string;
  priority: Priority;
  category: string;
  teamId?: number | null;
}) => (await api.post<Incident>("/incidents", data)).data;
export const transitionIncident = async (
  id: number,
  status: Status,
  note?: string,
) =>
  (await api.post<Incident>(`/incidents/${id}/transition`, { status, note }))
    .data;
export const assignIncident = async (
  id: number,
  assigneeId: number | null,
  teamId: number | null,
) =>
  (await api.post<Incident>(`/incidents/${id}/assign`, { assigneeId, teamId }))
    .data;
export const getComments = async (id: number) =>
  (await api.get<Comment[]>(`/incidents/${id}/comments`)).data;
export const addComment = async (id: number, message: string) =>
  (await api.post<Comment>(`/incidents/${id}/comments`, { message })).data;
export const getHistory = async (id: number) =>
  (await api.get<HistoryItem[]>(`/incidents/${id}/history`)).data;
export const getUsers = async () => (await api.get<User[]>("/users")).data;
export const getTeams = async () => (await api.get<Team[]>("/teams")).data;
export const getSlaPolicies = async () =>
  (await api.get<SlaPolicy[]>("/sla/policies")).data;
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}
