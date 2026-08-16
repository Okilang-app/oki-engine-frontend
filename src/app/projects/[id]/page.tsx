"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Project, type TimelineItem, type RenderJob } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Play, SkipForward, Loader2 } from "lucide-react";

function RenderPlayer({ renderId }: { renderId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    api.renders.playbackUrl(renderId).then((r) => setUrl(r.playback_url)).catch(() => {});
  }, [renderId]);
  if (!url) return <Skeleton className="h-48 w-full" />;
  return (
    <video src={url} controls className="w-full max-h-[360px] rounded-md border bg-black" playsInline />
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [render, setRender] = useState<RenderJob | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.jobs.get(id).catch((e) => {
        console.warn("Failed to load project:", e);
        return null;
      }),
      api.jobs.timeline(id).catch((e) => {
        console.warn("Failed to load timeline:", e);
        return [] as TimelineItem[];
      }),
    ])
      .then(([p, t]) => {
        setProject(p);
        setTimeline(t);
      })
      .catch((e) => {
        setError(String(e));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let interval: NodeJS.Timeout;

    async function loadRender() {
      try {
        const renders = await api.renders.list();
        const match = renders.find(
          (r) => r.job_id === id || r.project_id === id
        );
        setRender(match || null);
      } catch (e) {
        console.warn("Failed to load renders:", e);
      }
    }

    loadRender();
    interval = setInterval(loadRender, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [id]);

  async function runAction(action: string) {
    if (!id) return;
    setRunningAction(action);
    try {
      switch (action) {
        case "analyze":
          await api.jobs.analyze(id);
          break;
        case "translate":
          await api.jobs.translate(id, project?.target_language || "es");
          break;
        case "dub":
          await api.jobs.dub(id);
          break;
        case "render":
          await startRender();
          break;
      }
      const p = await api.jobs.get(id);
      setProject(p);
    } catch (e) {
      alert(String(e));
    } finally {
      setRunningAction(null);
    }
  }

  async function startRender() {
    if (!id) return;
    setRenderLoading(true);
    try {
      const r = await api.renders.create({ job_id: id });
      setRender(r);
      // Trigger execution
      await api.renders.execute(r.id);
      // Poll until complete
      const poll = setInterval(async () => {
        const status = await api.renders.get(r.id);
        setRender(status);
        if (status.status === "COMPLETED" || status.status === "FAILED") {
          clearInterval(poll);
          setRenderLoading(false);
        }
      }, 2000);
    } catch (e) {
      alert(String(e));
      setRenderLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Error</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Project not found</h1>
        <p className="text-muted-foreground">
          The project you are looking for does not exist or you do not have access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground">
            {project.target_language || "—"} ·{" "}
            <Badge variant="outline">{project.workflow_state}</Badge>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            disabled={runningAction === "analyze"}
            onClick={() => runAction("analyze")}
          >
            {runningAction === "analyze" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Play className="mr-2 h-4 w-4" />
            Analyze
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={runningAction === "translate"}
            onClick={() => runAction("translate")}
          >
            {runningAction === "translate" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <SkipForward className="mr-2 h-4 w-4" />
            Translate
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={runningAction === "dub"}
            onClick={() => runAction("dub")}
          >
            {runningAction === "dub" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <SkipForward className="mr-2 h-4 w-4" />
            Dub
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={runningAction === "render"}
            onClick={() => runAction("render")}
          >
            {runningAction === "render" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <SkipForward className="mr-2 h-4 w-4" />
            Render
          </Button>
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="translation">Translation</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="render">Render</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No timeline data yet. Run analysis to populate.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 rounded border p-3"
                    >
                      <Badge
                        variant={
                          item.type === "segment" ? "default" : "secondary"
                        }
                      >
                        {item.type}
                      </Badge>
                      <span className="text-sm font-mono">
                        {Math.round(item.start_time)}s -{" "}
                        {Math.round(item.end_time)}s
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        {item.label.slice(0, 80)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="translation">
          <Card>
            <CardHeader>
              <CardTitle>Translation Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Go to the Translation page for segment-level editing.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Submit for internal or creator review.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="render">
          <Card>
            <CardHeader>
              <CardTitle>Render Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!render ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No render yet. Click Render to start.
                  </p>
                  <Button
                    size="sm"
                    disabled={renderLoading}
                    onClick={startRender}
                  >
                    {renderLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Play className="mr-2 h-4 w-4" />
                    Render
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline">{render.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Progress:</span>
                    <Progress value={render.progress_percent} />
                    <p className="text-xs text-muted-foreground">
                      {render.progress_percent}%
                    </p>
                  </div>
                  {render.output_storage_key && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Play className="h-4 w-4" />
                        Render complete — modified video with ads replaced:
                      </div>
                      <RenderPlayer renderId={render.id} />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={async () => {
                          const res = await api.renders.playbackUrl(render.id);
                          window.open(res.playback_url, "_blank");
                        }}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Download Output Video
                      </Button>
                    </div>
                  )}
                  {render.error_message && (
                    <div>
                      <span className="text-sm font-medium text-destructive">
                        Error:
                      </span>
                      <p className="text-sm text-destructive">
                        {render.error_message}
                      </p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    disabled={renderLoading}
                    onClick={startRender}
                  >
                    {renderLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Play className="mr-2 h-4 w-4" />
                    Re-Render
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload and publish to authorized channels.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
