"use client";

import { useEffect, useState } from "react";
import { api, type InternalAd } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, Megaphone } from "lucide-react";

async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function uploadFileWithProgress(file: File, url: string, onProgress: (p: number) => void): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", url, true);
  xhr.setRequestHeader("Content-Type", file.type);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      onProgress(Math.round((e.loaded / e.total) * 100));
    }
  };
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      resolve();
    } else {
      reject(new Error(`Upload failed: ${xhr.statusText}`));
    }
  };
  xhr.onerror = () => reject(new Error("Upload network error"));
  xhr.send(file);
  return promise;
}

export default function AdsPage() {
  const [ads, setAds] = useState<InternalAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    api.ads
      .list()
      .then(setAds)
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(file: File) {
    if (!name.trim()) {
      alert("Please enter an ad name.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const { asset_id, presigned_url, storage_key } = await api.assets.simpleUpload({
        title: file.name,
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      await uploadFileWithProgress(file, presigned_url, setProgress);

      const sha256 = await sha256File(file);
      await api.assets.finalizeUpload(asset_id, sha256);

      const created = await api.ads.create({
        name: name.trim(),
        storage_key,
        duration_seconds: duration ? parseInt(duration, 10) : undefined,
      });

      setAds((prev) => [created, ...prev]);
      setName("");
      setDuration("");
    } catch (e) {
      console.error("Ad creation failed:", e);
      alert("Ad creation failed. See console for details.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ad?")) return;
    try {
      await api.ads.delete(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Delete failed. See console for details.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ad Library</h1>
          <p className="text-muted-foreground">Upload replacement ad clips.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ad-name">Name</Label>
            <Input
              id="ad-name"
              placeholder="Ad name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-duration">Duration (seconds)</Label>
            <Input
              id="ad-duration"
              type="number"
              placeholder="Optional"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={uploading}
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex cursor-pointer">
              <span className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Ad"}
              </span>
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCreate(file);
                }}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    {ad.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(ad.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{ad.duration_seconds != null ? `${ad.duration_seconds}s` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
