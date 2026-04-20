export type Portal = "LINKEDIN" | "JUSTJOIN" | "PRACUJ" | "OTHER";

export type ApplicationStatus =
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "IGNORED";

export interface JobData {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  url: string;
  portal: Portal;
}

export interface SaveApplicationPayload extends JobData {
  status: ApplicationStatus;
  notes?: string;
  tags?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
