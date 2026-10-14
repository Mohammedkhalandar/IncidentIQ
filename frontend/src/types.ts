export type Role = "ADMIN" | "SUPPORT_LEAD" | "ENGINEER" | "REPORTER";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Status = "OPEN" | "IN_PROGRESS" | "PENDING" | "RESOLVED" | "CLOSED";
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  team?: string | null;
}
export interface Incident {
  id: number;
  incidentKey: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  category: string;
  reporterId: number;
  reporterName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  teamId: number | null;
  teamName: string | null;
  responseDueAt: string;
  resolutionDueAt: string;
  firstResponseAt: string | null;
  responseBreached: boolean;
  resolutionBreached: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
export interface DashboardSummary {
  total: number;
  open: number;
  inProgress: number;
  pending: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  responseBreaches: number;
  resolutionBreaches: number;
  slaCompliance: number;
}
export interface Team {
  id: number;
  name: string;
  description: string;
}
export interface SlaPolicy {
  priority: Priority;
  responseMinutes: number;
  resolutionMinutes: number;
  active: boolean;
}
export interface Comment {
  id: number;
  authorName: string;
  message: string;
  createdAt: string;
}
export interface HistoryItem {
  id: number;
  actorName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}
