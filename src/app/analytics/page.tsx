"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign, Users, Eye, MousePointer } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
}

function MetricCard({ label, value, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and attribution data.</p>
      </div>

      <Tabs defaultValue="creators">
        <TabsList>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="conversions">Oki Conversions</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Creators" value="24" icon={Users} trend="+3 this month" />
              <MetricCard label="Localized Videos" value="156" icon={BarChart3} trend="+12 this week" />
              <MetricCard label="Languages Launched" value="8" icon={TrendingUp} />
              <MetricCard label="Avg Approval Rate" value="87%" icon={CheckIcon} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          {loading ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total Views" value="2.4M" icon={Eye} trend="+18% vs last month" />
              <MetricCard label="Watch Time (hrs)" value="180K" icon={BarChart3} />
              <MetricCard label="Subscribers Gained" value="45K" icon={Users} />
              <MetricCard label="YouTube Revenue" value="$12,400" icon={DollarSign} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          {loading ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Spanish" value="68 videos" icon={TrendingUp} />
              <MetricCard label="French" value="42 videos" icon={TrendingUp} />
              <MetricCard label="German" value="28 videos" icon={TrendingUp} />
              <MetricCard label="Portuguese" value="18 videos" icon={TrendingUp} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {loading ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Active Campaigns" value="4" icon={BarChart3} />
              <MetricCard label="Total CTA Clicks" value="18.2K" icon={MousePointer} />
              <MetricCard label="Conversion Rate" value="3.2%" icon={TrendingUp} />
              <MetricCard label="Campaign Revenue" value="$8,900" icon={DollarSign} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          {loading ? (
            <Skeleton className="h-28" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Clicks" value="45K" icon={MousePointer} />
              <MetricCard label="Installs" value="12K" icon={Users} />
              <MetricCard label="Registrations" value="8.5K" icon={Users} />
              <MetricCard label="Purchases" value="1.2K" icon={DollarSign} trend="$89K revenue" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
