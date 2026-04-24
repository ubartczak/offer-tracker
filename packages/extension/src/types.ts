export type Portal = "LINKEDIN" | "JUSTJOIN" | "PRACUJ" | "OTHER";
export type SalaryType = "MONTHLY" | "HOURLY";
export type Currency = "PLN" | "USD" | "EUR" | "OTHER";

export type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "IGNORED";

export interface JobData {
  title: string;
  company: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: Currency;
  salaryType?: SalaryType;
  contractType?: string;
  url: string;
  portal: Portal;
}

export interface SaveApplicationPayload extends JobData {
  status: ApplicationStatus;
  notes?: string;
  feedback?: string;
  interviewAt?: string;
  replyBy?: string;
  offerExpiresAt?: string;
  tags?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
