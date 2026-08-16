"use client";

import { useEffect, useState, useCallback, useRef, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type SponsorCandidate, type RenderJob } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import {
  CheckCircle2,
  XCircle,
  Replace,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Loader2,
  Video,
  Play,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

interface InternalAd {
  id: string;
  name: string;
  storage_key: string;
  duration_seconds: number | null;
}

function RenderVideoPlayer({ renderId }: { renderId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.renders
      .playbackUrl(renderId)
      .then((res) => setUrl(res.playback_url))
      .catch((e) => setError(String(e)));
  }, [renderId]);

  if (error) return <p className="text-sm text-destructive">Failed to load rendered video: {error}</p>;
  if (!url) return <Skeleton className="h-64 w-full" />;

  return (
    <video
      src={url}
      controls
      className="w-full max-h-[400px] rounded-md border bg-black"
      playsInline
    />
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = h > 0 ? [h, m, s] : [m, s];
  return parts.map((n, i) => (i === 0 ? String(n) : n.toString().padStart(2, "0"))).join(":");
}

function getSegmentLabel(candidate: SponsorCandidate): string {
  if (candidate.sponsor_name) {
    return `${candidate.sponsor_name} (${formatTime(candidate.start_time)})`;
  }
  const duration = candidate.end_time - candidate.start_time;
  return `Sponsor segment at ${formatTime(candidate.start_time)} (${Math.round(duration)}s)`;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [candidates, setCandidates] = useState<SponsorCandidate[]>([]);
  const [ads, setAds] = useState<InternalAd[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState(450);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<Record<string, string>>({});
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);

  const [render, setRender] = useState<RenderJob | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const renderPollRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedAds, setSelectedAds] = useState<Record<string, string>>({});
  const playerRef = useRef<VideoPlayerHandle>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return api.jobs
      .sponsors(jobId)
      .then((res) => {
        setCandidates(res.candidates);
        // Pre-select any already-proposed replacement ads
        const preselected: Record<string, string> = {};
        for (const c of res.candidates) {
          if (c.proposed_replacement_ad_id) {
            preselected[c.id] = c.proposed_replacement_ad_id;
          }
        }
        setSelectedAds((prev) => ({ ...preselected, ...prev }));
        return res.candidates;
      })
      .then((candidates) =>
        Promise.all([
          api.ads.list().then(setAds).catch(() => setAds([])),
          api.assets.list().then((assets) => {
            // Find the source video for this job:
            // 1. Asset linked by localization_job_id
            // 2. Asset referenced by the first sponsor candidate
            // 3. Any available asset as final fallback
            let source = assets.find((a) => a.localization_job_id === jobId);
            if (!source && candidates.length > 0) {
              source = assets.find((a) => a.id === candidates[0].asset_id);
            }
            if (!source) {
              source = assets[0];
            }
            if (source) {
              setVideoUrl(api.assets.streamUrl(source.id));
              if (source.duration_seconds) {
                setVideoDuration(source.duration_seconds);
              }
            }
          }),
        ])
      )
      .catch(() => {
        setCandidates([]);
        setVideoUrl("");
      })
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkRender = useCallback(async () => {
    try {
      const renders = await api.renders.list();
      const match = renders.find((r) => r.job_id === jobId);
      if (match) {
        setRender(match);
        if (match.status === "COMPLETED" || match.status === "FAILED") {
          if (renderPollRef.current) {
            clearInterval(renderPollRef.current);
            renderPollRef.current = null;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, [jobId]);

  useEffect(() => {
    checkRender();
    return () => {
      if (renderPollRef.current) {
        clearInterval(renderPollRef.current);
        renderPollRef.current = null;
      }
    };
  }, [checkRender]);

  const handleStartRender = async () => {
    setRenderLoading(true);
    try {
      const r = await api.renders.create({ job_id: jobId });
      await api.renders.execute(r.id);
      setRender(r);
      renderPollRef.current = setInterval(() => {
        checkRender();
      }, 2000);
    } catch (e) {
      alert("Render failed: " + String(e));
    } finally {
      setRenderLoading(false);
    }
  };

  const handleTimeUpdate = useCallback(
    (time: number) => {
      const active = candidates.find(
        (c) => time >= c.start_time && time <= c.end_time
      );
      setActiveSegment(active?.id || null);
    },
    [candidates]
  );

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setAnalyzeMessage(null);
    try {
      const result = await api.jobs.analyze(jobId);
      if (result.status === "already_analyzed") {
        setAnalyzeMessage(
          `Analysis already completed: ${result.segments_created ?? 0} segments, ${result.sponsors_detected ?? 0} sponsors found.`
        );
      } else {
        setAnalyzeMessage(
          `Analysis complete: ${result.segments_created ?? 0} segments, ${result.sponsors_detected ?? 0} sponsors found.`
        );
      }
      await refresh();
    } catch (err) {
      const msg =
        (err instanceof Error ? err.message : null) ||
        "Analysis failed. Check that the video file is uploaded and try again.";
      setAnalyzeMessage(`Error: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  }, [jobId, refresh]);

  const handleAction = async (
    segmentId: string,
    action: "approve" | "reject" | "replace",
    adId?: string
  ) => {
    setActing((prev) => ({ ...prev, [segmentId]: action }));
    try {
      if (action === "approve") {
        await api.sponsors.approve(segmentId, "Approved via review UI");
      } else if (action === "reject") {
        await api.sponsors.reject(segmentId, "Rejected via review UI");
      } else {
        await api.sponsors.replace(segmentId, adId || "", "Replaced with internal ad");
      }
      refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setActing((prev) => {
        const next = { ...prev };
        delete next[segmentId];
        return next;
      });
    }
  };

  const counts = {
    detected: candidates.filter((c) => c.status === "detected" && !c.proposed_replacement_ad_id).length,
    proposed: candidates.filter((c) => c.proposed_replacement_ad_id !== null).length,
    approved: candidates.filter(
      (c) => c.status === "approved" || c.status === "confirmed"
    ).length,
    rejected: candidates.filter((c) => c.status === "rejected").length,
    replaced: candidates.filter((c) => c.status === "replaced").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ad Review</h1>
          <p className="text-muted-foreground">
            Watch, review, and replace detected sponsor segments.
          </p>
        </div>
      </div>

      {/* Workflow Navigation */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            {[
              { label: "Timeline", href: `/projects/${jobId}`, done: true },
              { label: "Translation", href: `/projects/${jobId}?tab=translation`, done: false },
              { label: "Review", href: "#", done: true, active: true },
              { label: "Render", href: `/projects/${jobId}`, done: !!render && render.status === "COMPLETED" },
              { label: "Publish", href: "#", done: false },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-2 shrink-0">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <Button
                  variant={step.active ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 px-2 text-xs ${
                    step.done && !step.active ? "text-green-600 bg-green-50 hover:bg-green-100" : ""
                  }`}
                  disabled={step.active}
                  onClick={() => step.href !== "#" && router.push(step.href)}
                >
                  {step.done && <CheckCircle className="mr-1 h-3 w-3" />}
                  {step.label}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push("/ads")}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Ad Library
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/projects/${jobId}`)}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Timeline & Render
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{counts.proposed}</div>
            <div className="text-xs text-muted-foreground">Proposed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{counts.detected}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{counts.approved}</div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{counts.rejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{counts.replaced}</div>
            <div className="text-xs text-muted-foreground">Replaced</div>
          </CardContent>
        </Card>
      </div>

      {/* Video Player */}
      {videoUrl && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-4 w-4" />
              Source Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayer
              ref={playerRef}
              src={videoUrl}
              segments={candidates}
              duration={videoDuration}
              onTimeUpdate={handleTimeUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Ad Library Warning */}
      {ads.length === 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              No replacement ads uploaded yet. Go to{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-amber-800 dark:text-amber-200"
                onClick={() => router.push("/ads")}
              >
                Ad Library
              </Button>{" "}
              to upload your clips.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sponsor Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No sponsor segments detected yet.
            </p>
            {analyzeMessage && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                {analyzeMessage}
              </p>
            )}
            <Button
              className="mt-4"
              disabled={analyzing}
              onClick={handleAnalyze}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Run Analysis"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => {
            const hasProposedAd = c.proposed_replacement_ad_id !== null;
            const isPending = c.status === "detected" && !hasProposedAd;
            const isActing = acting[c.id];
            const isActive = activeSegment === c.id;
            const chosenAdName = c.proposed_replacement_ad_name;

            return (
              <Card
                key={c.id}
                className={isActive ? "ring-2 ring-blue-400" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {getSegmentLabel(c)}
                    </CardTitle>
                    <Badge
                      variant={
                        hasProposedAd
                          ? "secondary"
                          : c.status === "detected"
                          ? "destructive"
                          : c.status === "approved" || c.status === "confirmed"
                          ? "default"
                          : c.status === "replaced"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {hasProposedAd ? "proposed" : c.status === "confirmed" ? "approved" : c.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(c.start_time)} — {formatTime(c.end_time)}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Confidence: {Math.round(c.confidence * 100)}%
                    </span>
                    <span>Reason: {c.detection_reason}</span>
                  </div>

                  {hasProposedAd && chosenAdName && (
                    <div className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded px-3 py-2 border border-blue-200 dark:border-blue-800">
                      <Replace className="inline h-3.5 w-3.5 mr-1" />
                      Auto-proposed replacement:{" "}
                      <strong>{chosenAdName}</strong>
                    </div>
                  )}

                  {c.status === "replaced" && chosenAdName && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded px-3 py-2">
                      Replaced with: <strong>{chosenAdName}</strong>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center gap-2 flex-wrap">
                    {hasProposedAd || isPending ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          disabled={!!isActing}
                          onClick={() => playerRef.current?.seekTo(c.start_time)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        {ads.length > 0 && (
                          <select
                            className="h-8 px-2 text-sm border rounded-md bg-background"
                            value={selectedAds[c.id] || c.proposed_replacement_ad_id || ""}
                            onChange={(e) =>
                              setSelectedAds((prev) => ({ ...prev, [c.id]: e.target.value }))
                            }
                          >
                            <option value="" disabled>
                              Select ad…
                            </option>
                            {ads.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          disabled={!!isActing}
                          onClick={() => handleAction(c.id, "approve")}
                        >
                          {isActing === "approve" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={!!isActing}
                          onClick={() => handleAction(c.id, "reject")}
                        >
                          {isActing === "reject" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          disabled={!!isActing || !(selectedAds[c.id] || c.proposed_replacement_ad_id)}
                          onClick={() =>
                            handleAction(c.id, "replace", selectedAds[c.id] || c.proposed_replacement_ad_id || "")
                          }
                        >
                          {isActing === "replace" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Replace className="mr-2 h-4 w-4" />
                          )}
                          Replace
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Decision: <strong>{c.status}</strong>
                        {c.status === "replaced" && chosenAdName && (
                          <span>
                            {" "}
                            → replaced with{" "}
                            <em>{chosenAdName}</em>
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Render & Publish */}
      {(!loading && candidates.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Play className="h-4 w-4" />
              Render & Publish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!render ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  All sponsor decisions reviewed? Render the final output video with
                  approved changes applied.
                </p>
                <Button
                  size="sm"
                  disabled={renderLoading || counts.detected > 0}
                  onClick={handleStartRender}
                  title={
                    counts.detected > 0
                      ? "Approve or reject all pending segments before rendering"
                      : "Render final video"
                  }
                >
                  {renderLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  {renderLoading ? "Starting…" : "Render Video"}
                </Button>
                {counts.detected > 0 && (
                  <p className="text-xs text-amber-600">
                    You still have {counts.detected} pending segment{counts.detected > 1 ? "s" : ""} to review.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="outline">{render.status}</Badge>
                </div>
                {render.status === "QUEUED" || render.status === "PROCESSING" ? (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Progress:</span>
                    <Progress value={render.progress_percent} />
                    <p className="text-xs text-muted-foreground">
                      {render.progress_percent}%
                    </p>
                  </div>
                ) : render.status === "COMPLETED" ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Render complete — this is your modified video with ads replaced
                    </div>
                    <RenderVideoPlayer renderId={render.id} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={async () => {
                          const res = await api.renders.playbackUrl(render!.id);
                          window.open(res.playback_url, "_blank");
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Download Output Video
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/projects/${jobId}?tab=publish`)
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Go to Publish
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">
                      Error: {render.error_message || "Render failed"}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleStartRender}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Retry Render
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
