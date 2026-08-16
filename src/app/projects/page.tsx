"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Project } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Workflow, Play, Eye, Plus, Loader2, Trash2 } from "lucide-react";
import { type Asset } from "@/lib/api";

const WORKFLOW_STATES = [
  "CREATOR_LEAD",
  "RIGHTS_PENDING",
  "RIGHTS_APPROVED",
  "SOURCE_REQUESTED",
  "SOURCE_UPLOADED",
  "SOURCE_VALIDATED",
  "ANALYSIS_RUNNING",
  "AD_REVIEW_REQUIRED",
  "TRANSLATION_RUNNING",
  "TRANSLATION_REVIEW",
  "DUBBING_RUNNING",
  "AUDIO_REVIEW",
  "RENDER_RUNNING",
  "INTERNAL_QA",
  "CREATOR_REVIEW",
  "PUBLISH_READY",
  "UPLOADED_PRIVATE",
  "PLATFORM_CHECK",
  "PUBLISHED",
  "PERFORMANCE_REVIEW",
  "ARCHIVED",
];

function stateProgress(state: string): number {
  const idx = WORKFLOW_STATES.indexOf(state);
  return idx >= 0 ? Math.round((idx / (WORKFLOW_STATES.length - 1)) * 100) : 0;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState<Record<string, boolean>>({});
  const [rendering, setRendering] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const router = useRouter();

  useEffect(() => {
    if (dialogOpen) {
      api.assets.list().then(setAssets).catch(() => setAssets([]));
    }
  }, [dialogOpen]);

  const refresh = () => {
    setLoading(true);
    api.jobs
      .list()
      .then(setProjects)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const job = await api.jobs.create({
        name: newName.trim(),
        source_asset_id: selectedAssetId || undefined,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      });
      setProjects((prev) => [job, ...prev]);
      setNewName("");
      setSelectedAssetId("");
      setSourceLanguage("auto");
      setTargetLanguage("es");
      setDialogOpen(false);
    } catch (e) {
      alert(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleAnalyze = async (jobId: string) => {
    setAnalyzing((prev) => ({ ...prev, [jobId]: true }));
    try {
      const result = await api.jobs.analyze(jobId);
      const msg =
        result.status === "already_analyzed"
          ? "Already analyzed — segments already exist."
          : `Analysis complete! ${result.segments_created} segments created, ${result.sponsors_detected} sponsors detected (${result.source || ""}).`;
      alert(msg);
      refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setAnalyzing((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleRender = async (jobId: string) => {
    setRendering((prev) => ({ ...prev, [jobId]: true }));
    try {
      const r = await api.renders.create({ job_id: jobId });
      await api.renders.execute(r.id);
      alert("Render started");
      refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setRendering((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setDeleting((prev) => ({ ...prev, [jobId]: true }));
    try {
      await api.jobs.delete(jobId);
      alert("Project deleted");
      refresh();
    } catch (e) {
      alert(String(e));
    } finally {
      setDeleting((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Track localization jobs across the pipeline.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            <Plus className="h-4 w-4" />
            New Project
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Localization Project</DialogTitle>
              <DialogDescription>
                Create a new project to start ad detection and replacement.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Project name (e.g. 'Summer Tech Review')"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Select value={selectedAssetId} onValueChange={(v) => setSelectedAssetId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source video asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceLanguage} onValueChange={(v) => setSourceLanguage(v ?? "auto")}>
                <SelectTrigger>
                  <SelectValue placeholder="Source language (auto-detect)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={targetLanguage} onValueChange={(v) => setTargetLanguage(v ?? "es")}>
                <SelectTrigger>
                  <SelectValue placeholder="Target language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="sv">Swedish</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={!newName.trim() || !selectedAssetId || creating}
                onClick={handleCreate}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No projects yet. Create your first one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{project.title}</span>
                      {project.target_language && (
                        <Badge variant="secondary">{project.target_language}</Badge>
                      )}
                      <Badge
                        variant={
                          project.workflow_state === "AD_REVIEW_REQUIRED"
                            ? "destructive"
                            : project.workflow_state === "PUBLISHED"
                            ? "default"
                            : "outline"
                        }
                      >
                        {project.workflow_state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: {project.id.slice(0, 8)}…
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-48">
                      <Progress value={stateProgress(project.workflow_state)} />
                    </div>
                    <div className="flex items-center gap-2">
                      {(project.workflow_state === "SOURCE_VALIDATED" ||
                        project.workflow_state === "CREATOR_LEAD") && (
                        <Button
                          size="sm"
                          onClick={() => handleAnalyze(project.id)}
                          disabled={analyzing[project.id]}
                        >
                          {analyzing[project.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Analyze
                        </Button>
                      )}
                      {(project.workflow_state === "AD_REVIEW_REQUIRED" ||
                        project.workflow_state === "ANALYSIS_RUNNING") && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            router.push(`/projects/${project.id}/review`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review Ads
                        </Button>
                      )}
                      {(project.workflow_state === "RENDER_RUNNING" ||
                        project.workflow_state === "PUBLISH_READY") && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={rendering[project.id]}
                          onClick={() => handleRender(project.id)}
                        >
                          {rendering[project.id] ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Render
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/projects/${project.id}`)
                        }
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting[project.id]}
                        onClick={() => handleDelete(project.id)}
                      >
                        {deleting[project.id] ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
