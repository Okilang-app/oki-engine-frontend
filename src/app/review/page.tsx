"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

export default function ReviewPage() {
  const [comment, setComment] = useState("");

  const packages = [
    {
      id: "pkg-1",
      jobTitle: "Video Localization - ES",
      version: "v1.2",
      status: "pending_review",
      type: "internal",
      changedSegments: 3,
      sponsorReplacements: 1,
    },
    {
      id: "pkg-2",
      jobTitle: "Video Localization - FR",
      version: "v1.0",
      status: "creator_review",
      type: "creator",
      changedSegments: 5,
      sponsorReplacements: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review & Approval</h1>
        <p className="text-muted-foreground">Review localized packages and submit approvals.</p>
      </div>

      <Tabs defaultValue="internal">
        <TabsList>
          <TabsTrigger value="internal">Internal QA</TabsTrigger>
          <TabsTrigger value="creator">Creator Review</TabsTrigger>
        </TabsList>
        <TabsContent value="internal">
          <div className="space-y-4">
            {packages
              .filter((p) => p.type === "internal")
              .map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{pkg.jobTitle}</CardTitle>
                      <Badge variant="secondary">{pkg.version}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge variant="outline">Changed Segments: {pkg.changedSegments}</Badge>
                      <Badge variant="outline">Sponsor Replacements: {pkg.sponsorReplacements}</Badge>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comment</label>
                      <Textarea
                        placeholder="Add review comments..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Comment
                      </Button>
                      <Button size="sm" variant="default">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
        <TabsContent value="creator">
          <div className="space-y-4">
            {packages
              .filter((p) => p.type === "creator")
              .map((pkg) => (
                <Card key={pkg.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{pkg.jobTitle}</CardTitle>
                      <Badge>Creator Review</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Badge variant="outline">Changed Segments: {pkg.changedSegments}</Badge>
                      <Badge variant="outline">Sponsor Replacements: {pkg.sponsorReplacements}</Badge>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Request Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
