"use client";

import { useEffect, useState } from "react";
import { api, type Asset } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Upload, FileVideo } from "lucide-react";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    api.assets
      .list()
      .then(setAssets)
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    setProgress(0);
    try {
      const { asset_id, presigned_url } = await api.assets.simpleUpload({
        title: file.name,
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      await uploadFileWithProgress(file, presigned_url, setProgress);

      const sha256 = await sha256File(file);
      const asset = await api.assets.finalizeUpload(asset_id, sha256);
      setAssets((prev) => [asset, ...prev]);
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Upload failed. See console for details.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">Upload and manage source media files.</p>
        </div>
        <label className="inline-flex cursor-pointer">
          <span className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Asset"}
          </span>
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            disabled={uploading}
          />
        </label>
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileVideo className="h-4 w-4" />
                    {asset.title || "Untitled"}
                  </CardTitle>
                  <Badge variant={asset.status === "VALIDATED" ? "default" : "secondary"}>
                    {asset.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size</span>
                  <span>{formatBytes(asset.size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" disabled={asset.status !== "PENDING_VALIDATION"}>
                  Validate Rights
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
