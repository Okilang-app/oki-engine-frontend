"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Creator } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink } from "lucide-react";

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    legal_name: "",
    public_name: "",
    channel_url: "",
    primary_language: "en",
    contact_email: "",
  });

  useEffect(() => {
    api.creators
      .list()
      .then(setCreators)
      .catch(() => setCreators([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const created = await api.creators.create(form);
    setCreators((prev) => [created, ...prev]);
    setOpen(false);
    setForm({ legal_name: "", public_name: "", channel_url: "", primary_language: "en", contact_email: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creators</h1>
          <p className="text-muted-foreground">Manage licensed creators and their agreements.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            <Plus className="h-4 w-4" />
            Add Creator
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Creator</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input id="legal_name" value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_name">Public Name</Label>
                <Input id="public_name" value={form.public_name} onChange={(e) => setForm({ ...form, public_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel_url">Channel URL</Label>
                <Input id="channel_url" type="url" value={form.channel_url} onChange={(e) => setForm({ ...form, channel_url: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_language">Primary Language</Label>
                <Input id="primary_language" value={form.primary_language} onChange={(e) => setForm({ ...form, primary_language: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Create Creator</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <Card key={creator.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{creator.public_name}</CardTitle>
                  <Badge variant={creator.status === "ACTIVE" ? "default" : "secondary"}>
                    {creator.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{creator.legal_name}</p>
                <a
                  href={creator.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Channel
                </a>
                <p className="text-xs text-muted-foreground">{creator.contact_email}</p>
                <div className="pt-2">
                  <Link href={`/creators/${creator.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
