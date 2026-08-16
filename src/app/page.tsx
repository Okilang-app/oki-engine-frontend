"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, Film, Eye, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_creators: 0,
    active_projects: 0,
    published_videos: 0,
    total_views: 0,
    oki_conversions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics.creators().then((d) => {
      setStats({
        total_creators: d.total_creators ?? 0,
        active_projects: d.active_projects ?? 0,
        published_videos: d.published_videos ?? 0,
        total_views: d.total_views ?? 0,
        oki_conversions: d.oki_conversions ?? 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const items = [
    { label: "Creators", value: stats.total_creators, icon: Users },
    { label: "Active Projects", value: stats.active_projects, icon: Briefcase },
    { label: "Published Videos", value: stats.published_videos, icon: Film },
    { label: "Total Views", value: stats.total_views.toLocaleString(), icon: Eye },
    { label: "Oki Conversions", value: stats.oki_conversions, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your localization pipeline.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {items.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{item.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["RIGHTS_PENDING", "SOURCE_UPLOADED", "ANALYSIS_RUNNING", "TRANSLATION_RUNNING", "DUBBING_RUNNING", "RENDER_RUNNING", "CREATOR_REVIEW", "PUBLISH_READY"].map(
              (state) => (
                <Badge key={state} variant="secondary">
                  {state}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
