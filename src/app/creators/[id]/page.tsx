"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, type Creator, type Agreement } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from "lucide-react";

export default function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.creators.get(id), api.agreements.list(id)])
      .then(([c, a]) => {
        setCreator(c);
        setAgreements(a);
      })
      .catch(() => {
        setCreator(null);
        setAgreements([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function approveAgreement(agreementId: string) {
    await api.agreements.approve(agreementId);
    if (id) {
      const a = await api.agreements.list(id);
      setAgreements(a);
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

  if (!creator) return <div>Creator not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{creator.public_name}</h1>
        <p className="text-muted-foreground">{creator.legal_name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={creator.status === "ACTIVE" ? "default" : "secondary"}>
                {creator.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Language</span>
              <span>{creator.primary_language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{creator.contact_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel</span>
              <a href={creator.channel_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Link
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rights Agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agreements.length === 0 && (
              <p className="text-sm text-muted-foreground">No agreements found.</p>
            )}
            {agreements.map((agreement) => (
              <div key={agreement.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Agreement</span>
                      <Badge variant={agreement.status === "APPROVED" ? "default" : "secondary"}>
                        {agreement.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Languages: {agreement.permitted_languages.join(", ")} · Platforms:{" "}
                      {agreement.permitted_platforms.join(", ")}
                    </p>
                  </div>
                  {agreement.status !== "APPROVED" && (
                    <Button size="sm" onClick={() => approveAgreement(agreement.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-3 text-xs">
                  <Badge variant="outline">Full Video: {agreement.full_video_rights ? "Yes" : "No"}</Badge>
                  <Badge variant="outline">Shorts: {agreement.shorts_rights ? "Yes" : "No"}</Badge>
                  <Badge variant="outline">Sponsor Replace: {agreement.sponsorship_replacement_rights ? "Yes" : "No"}</Badge>
                  <Badge variant="outline">Voice Clone: {agreement.voice_clone_rights ? "Yes" : "No"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
