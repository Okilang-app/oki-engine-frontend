const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export interface Creator {
  id: string;
  legal_name: string;
  public_name: string;
  channel_url: string;
  primary_language: string;
  contact_email: string;
  status: string;
  created_at: string;
}

export interface CreatorCreate {
  legal_name: string;
  public_name: string;
  channel_url: string;
  primary_language: string;
  contact_email: string;
}

export interface Agreement {
  id: string;
  creator_id: string;
  status: string;
  effective_date: string | null;
  expiration_date: string | null;
  permitted_languages: string[];
  permitted_platforms: string[];
  full_video_rights: boolean;
  shorts_rights: boolean;
  sponsorship_replacement_rights: boolean;
  voice_clone_rights: boolean;
}

export interface Asset {
  id: string;
  organization_id: string;
  creator_id: string;
  rights_agreement_id: string | null;
  project_id: string | null;
  localization_job_id: string | null;
  title: string;
  description: string | null;
  status: string;
  storage_key: string | null;
  storage_bucket: string | null;
  sha256: string | null;
  size_bytes: number | null;
  duration_seconds: number | null;
  container_format: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface InternalAd {
  id: string;
  organization_id: string;
  name: string;
  storage_key: string;
  duration_seconds: number | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  creator_id: string;
  agreement_id: string;
  title: string;
  target_language: string;
  workflow_state: string;
  created_at: string;
}

export interface TimelineItem {
  start_time: number;
  end_time: number;
  type: string;
  label: string;
  data: Record<string, unknown>;
}

export interface TranslationSegment {
  id: string;
  segment_id: string;
  source_text: string;
  translated_text: string;
  status: string;
}

export interface SponsorCandidate {
  id: string;
  job_id: string;
  asset_id: string;
  start_time: number;
  end_time: number;
  sponsor_name: string | null;
  status: string;
  detection_reason: string;
  confidence: number;
  proposed_replacement_ad_id: string | null;
  proposed_replacement_ad_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenderJob {
  id: string;
  project_id: string | null;
  job_id: string | null;
  status: string;
  output_storage_key: string | null;
  progress_percent: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  total_creators: number;
  active_projects: number;
  published_videos: number;
  total_views: number;
  oki_conversions: number;
}

/**
 * Refresh the access token, de-duplicated across concurrent callers.
 *
 * A page that fires several requests at once would otherwise refresh several
 * times; with rotating single-use refresh tokens (revokeRefreshToken in the
 * realm) the losers of that race invalidate the winner's token and log the
 * user out. Sharing one in-flight promise avoids that entirely.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request<T>(path: string, options?: RequestInit, isRetry = false): Promise<T> {
  const token = typeof window !== "undefined" ? getCookie("access_token") : undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (networkErr) {
    // Network-level failures (browser extension interceptors, CORS blocks, etc.)
    console.warn("Fetch network error:", networkErr);
    const errMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    throw new Error(`Network error (${errMsg}) — check that the backend is running on ${API_BASE}, disable browser extensions, or try refreshing the page.`);
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // The realm's access tokens expire after 5 minutes. Try to refresh once
      // and replay the request before disrupting the user — a full-page
      // redirect here would discard whatever they were in the middle of.
      if (!isRetry && (await refreshAccessToken())) {
        return request<T>(path, options, true);
      }
      // Refresh failed: the session really is over.
      const current = window.location.pathname;
      if (!current.startsWith("/api/auth/")) {
        window.location.href = "/api/auth/signin";
      }
      return {} as T;
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  creators: {
    list: () => request<Creator[]>("/api/creators"),
    get: (id: string) => request<Creator>(`/api/creators/${id}`),
    create: (data: CreatorCreate) =>
      request<Creator>("/api/creators", { method: "POST", body: JSON.stringify(data) }),
  },
  agreements: {
    list: (creatorId: string) =>
      request<Agreement[]>(`/api/creators/${creatorId}/agreements`),
    approve: (id: string) =>
      request<Agreement>(`/api/agreements/${id}/approve`, { method: "POST" }),
    revoke: (id: string) =>
      request<Agreement>(`/api/agreements/${id}/revoke`, { method: "POST" }),
  },
  assets: {
    list: () => request<Asset[]>("/api/assets"),
    get: (id: string) => request<Asset>(`/api/assets/${id}`),
    simpleUpload: (data: {title: string; file_name: string; content_type: string; size_bytes: number}) =>
      request<{asset_id: string; presigned_url: string; storage_key: string}>("/api/assets/simple-upload", {method: "POST", body: JSON.stringify(data)}),
    finalizeUpload: (assetId: string, sha256: string) =>
      request<Asset>(`/api/assets/${assetId}/finalize`, {method: "POST", body: JSON.stringify({sha256})}),
    playbackUrl: (assetId: string) =>
      request<{playback_url: string}>(`/api/assets/${assetId}/playback-url`),
    streamUrl: (assetId: string) => `${API_BASE}/api/assets/${assetId}/stream`,
    validateRights: (assetId: string) =>
      request<{ valid: boolean }>(`/api/assets/${assetId}/validate-rights`, { method: "POST" }),
  },
  ads: {
    list: () => request<InternalAd[]>("/api/ads"),
    create: (data: {name: string; storage_key: string; duration_seconds?: number}) =>
      request<InternalAd>("/api/ads", {method: "POST", body: JSON.stringify(data)}),
    delete: (id: string) => request<void>(`/api/ads/${id}`, {method: "DELETE"}),
  },
  jobs: {
    list: () => request<Project[]>("/api/jobs"),
    get: (id: string) => request<Project>(`/api/jobs/${id}`),
    create: (data: {name: string; source_asset_id?: string; source_language?: string; target_language?: string}) =>
      request<Project>("/api/jobs", { method: "POST", body: JSON.stringify(data) }),
    analyze: (jobId: string) =>
      request<{ job_id: string; status: string; segments_created?: number; sponsors_detected?: number; source?: string }>("/api/jobs/analyze", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),
    delete: (jobId: string) =>
      request<{ job_id: string; status: string }>(`/api/jobs/${jobId}`, { method: "DELETE" }),
    translate: (jobId: string, language: string) =>
      request<{ task_id: string }>("/api/jobs/translate", {
        method: "POST",
        body: JSON.stringify({ job_id: jobId, target_language: language }),
      }),
    dub: (jobId: string) =>
      request<{ task_id: string }>("/api/jobs/dub", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),
    render: async (jobId: string) => {
      const r = await api.renders.create({ job_id: jobId });
      await api.renders.execute(r.id);
      return { task_id: r.id };
    },
    cancel: (jobId: string) =>
      request<{ cancelled: boolean }>("/api/jobs/cancel", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),
    timeline: (jobId: string) =>
      request<{ asset_id: string; items: TimelineItem[] }>(`/api/jobs/${jobId}/timeline`).then((r) => r.items),
    sponsors: (jobId: string) =>
      request<{ job_id: string; candidates: SponsorCandidate[] }>(`/api/jobs/${jobId}/sponsors`),
  },
  sponsors: {
    approve: (segmentId: string, reason?: string) =>
      request<{ id: string; decision: string }>(`/api/sponsors/${segmentId}/approve`, { method: "POST", body: JSON.stringify({ reason }) }),
    reject: (segmentId: string, reason?: string) =>
      request<{ id: string; decision: string }>(`/api/sponsors/${segmentId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
    replace: (segmentId: string, adId: string, reason?: string) =>
      request<{ id: string; decision: string }>(`/api/sponsors/${segmentId}/replace`, { method: "POST", body: JSON.stringify({ ad_id: adId, reason }) }),
  },
  translations: {
    get: (jobId: string, language: string) =>
      request<{ segments: TranslationSegment[] }>(`/api/jobs/${jobId}/translations/${language}`),
    reviseSegment: (translationId: string, segmentId: string, text: string) =>
      request<TranslationSegment>(`/api/translations/${translationId}/segments/${segmentId}/revise`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
  },
  reviews: {
    get: (jobId: string) =>
      request<{ package_version_id: string; status: string; comments: unknown[] }>(`/api/reviews/${jobId}`),
    approve: (jobId: string) =>
      request<{ approved: boolean }>(`/api/reviews/${jobId}/approve`, { method: "POST" }),
    reject: (jobId: string) =>
      request<{ rejected: boolean }>(`/api/reviews/${jobId}/reject`, { method: "POST" }),
  },
  analytics: {
    creators: () => request<AnalyticsSummary>("/api/analytics/creators"),
    videos: () => request<AnalyticsSummary>("/api/analytics/videos"),
    languages: () => request<AnalyticsSummary>("/api/analytics/languages"),
    campaigns: () => request<AnalyticsSummary>("/api/analytics/campaigns"),
    okiConversions: () => request<AnalyticsSummary>("/api/analytics/oki-conversions"),
  },
  renders: {
    list: () => request<RenderJob[]>("/api/renders"),
    create: (data: {project_id?: string; job_id?: string}) =>
      request<RenderJob>("/api/renders", {method: "POST", body: JSON.stringify(data)}),
    get: (id: string) => request<RenderJob>(`/api/renders/${id}`),
    execute: (id: string) =>
      request<{render_id: string; status: string}>(`/api/renders/${id}/execute`, {method: "POST"}),
    playbackUrl: (id: string) =>
      request<{playback_url: string; render_id: string}>(`/api/renders/${id}/playback-url`),
    updateStatus: (id: string, data: {status: string; progress_percent?: number; output_storage_key?: string}) =>
      request<RenderJob>(`/api/renders/${id}/status`, {method: "POST", body: JSON.stringify(data)}),
  },
};
