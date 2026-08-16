"use client";

import { useEffect, useState } from "react";
import { api, type TranslationSegment } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw } from "lucide-react";

export default function TranslationPage() {
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For MVP, load mock translation data
    setTimeout(() => {
      setSegments([
        { id: "1", segment_id: "s1", source_text: "Hello everyone, welcome back to the channel.", translated_text: "Hola a todos, bienvenidos de nuevo al canal.", status: "APPROVED" },
        { id: "2", segment_id: "s2", source_text: "Today we are going to talk about Oki.", translated_text: "Hoy vamos a hablar sobre Oki.", status: "PENDING" },
        { id: "3", segment_id: "s3", source_text: "Use code OKI20 for 20% off.", translated_text: "Usa el código OKI20 para un 20% de descuento.", status: "REVIEW_REQUIRED" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  function updateSegment(id: string, text: string) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, translated_text: text } : s)));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Translation Workspace</h1>
        <p className="text-muted-foreground">Review and edit translated segments with full context.</p>
      </div>

      <div className="space-y-4">
        {segments.map((segment) => (
          <Card key={segment.id}>
            <CardContent className="py-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground uppercase">Source</div>
                  <p className="text-sm">{segment.source_text}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Translation</span>
                    <Badge variant={segment.status === "APPROVED" ? "default" : segment.status === "REVIEW_REQUIRED" ? "destructive" : "secondary"}>
                      {segment.status}
                    </Badge>
                  </div>
                  <Textarea
                    value={segment.translated_text}
                    onChange={(e) => updateSegment(segment.id, e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => updateSegment(segment.id, segment.source_text)}>
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Revert
                </Button>
                <Button size="sm">
                  <Save className="mr-2 h-3 w-3" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
