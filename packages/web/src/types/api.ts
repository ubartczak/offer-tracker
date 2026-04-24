export type Portal = "LINKEDIN" | "JUSTJOIN" | "PRACUJ" | "OTHER";
export type SalaryType = "MONTHLY" | "HOURLY";
export type Currency = "PLN" | "USD" | "EUR" | "OTHER";
export type ApplicationStatus =
  | "SAVED" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" | "IGNORED";

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  portal: Portal;
  status: ApplicationStatus;
  salaryMin?: number;
  salaryMax?: number;
  currency?: Currency;
  salaryType?: SalaryType;
  contractType?: string;
  notes?: string;
  feedback?: string;
  tags: string[];
  interviewAt?: string;
  replyBy?: string;
  offerExpiresAt?: string;
  appliedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationsResponse {
  applications: JobApplication[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface StatsResponse {
  total: number;
  responseRate: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  byPortal: Partial<Record<Portal, number>>;
}

export interface AuthResponse {
  user: { id: string; email: string; createdAt: string };
  accessToken: string;
  refreshToken: string;
}
