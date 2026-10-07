const BASE = "/api/v1";

export type Status = {
  votes: number; meetings: number; issuers: number; reporters: number;
  sources: number; software_version: string; adapter_version: string;
  disclaimer: string;
};
export type Season = { season: number; meetings: number; votes: number; reporters: number };
export type IssuerRow = {
  issuer_id: string; canonical_name: string; country: string | null;
  lei: string | null; meetings: number | null; reporters: number | null;
  observed_votes: number | null; latest_meeting: string | null; isins: string | null;
};
export type MeetingRow = {
  meeting_id: string; meeting_date: string; meeting_type: string;
  proposals: number | null; reporters: number | null;
  observed_votes: number | null; dissent_votes: number | null;
};
export type PivotRow = {
  proposal_id: string; proposal_number: string | null;
  proposal_title_normalized: string; category: string | null;
  reporter: string; reporter_group: string | null;
  direction: string; management_recommendation: string | null;
  management_alignment: string | null;
  against_management: boolean | null; is_split: boolean | null;
  vote_raw: string; source_id: string;
};
export type ReporterRow = {
  reporter_id: string; canonical_name: string; reporter_type: string;
  country: string | null; parent_group: string | null;
  units: number | null; meetings: number | null; observed_votes: number | null;
  dissent_votes: number | null;
  disclosure_seasons?: { season: number; disclosure_level: string;
    significance_criteria_documented: boolean; significance_criteria_text: string | null }[];
};
export type SourceRow = {
  vote_rows_published: boolean;
  source_id: string; source_type: string; name: string; base_url: string;
  reuse_status: string; adapter_version: string;
  votes_ingested: number; last_retrieved: string | null; observations: number;
};
export type CompareResult = {
  a: string; b: string; season: number | null;
  common_disclosed_proposals: number; same_direction: number;
  different_direction: number; observed_agreement: number | null;
  meetings_compared: number; issuers_compared: number; caveat: string;
  proposals: {
    issuer: string; meeting_date: string; proposal_id: string;
    proposal_title_normalized: string; category: string | null;
    vote_a: string | null; vote_b: string | null;
  }[];
};

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export const api = {
  status: () => get<Status>("/status"),
  seasons: () => get<{ seasons: Season[] }>("/seasons"),
  issuers: (q = "", limit = 100) =>
    get<{ issuers: IssuerRow[] }>(`/issuers?limit=${limit}&q=${encodeURIComponent(q)}`),
  issuer: (id: string) => get<any>(`/issuers/${id}`),
  issuerMeetings: (id: string) =>
    get<{ meetings: MeetingRow[] }>(`/issuers/${id}/meetings`),
  meeting: (id: string) => get<any>(`/meetings/${id}`),
  meetingPivot: (id: string) =>
    get<{ pivot: PivotRow[] }>(`/meetings/${id}/votes?pivot=true`),
  meetingVotes: (id: string) => get<{ votes: any[] }>(`/meetings/${id}/votes`),
  reporters: () => get<{ reporters: ReporterRow[] }>("/reporters"),
  reporter: (id: string) => get<any>(`/reporters/${id}`),
  compare: (a: string, b: string, season?: number) =>
    get<CompareResult>(`/compare/reporters?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}${season ? `&season=${season}` : ""}`),
  categories: () => get<{ categories: any[] }>("/categories"),
  sources: () => get<{ sources: SourceRow[] }>("/sources"),
  vote: (id: string) => get<any>(`/votes/${id}`),
};
