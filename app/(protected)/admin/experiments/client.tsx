"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  createFlag,
  toggleFlag,
  updateFlagRollout,
  removeFlag,
} from "@/actions/feature-flags";
import type { FeatureFlag } from "@/lib/feature-flags";
import {
  FlaskConicalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

export default function ExperimentsClient({
  initialFlags,
}: {
  initialFlags: FeatureFlag[];
}) {
  const [flags, setFlags] = useState(initialFlags);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRollout, setNewRollout] = useState(50);

  const handleCreate = async () => {
    if (!newKey.trim()) return toast.error("Flag key is required");
    const res = await createFlag({
      key: newKey,
      description: newDesc,
      rolloutPercent: newRollout,
    });
    if ("success" in res) {
      toast.success("Flag created");
      setFlags((prev) => [
        {
          key: newKey.toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 50),
          description: newDesc,
          enabled: true,
          rolloutPercent: newRollout,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewKey("");
      setNewDesc("");
      setNewRollout(50);
      setShowCreate(false);
    }
  };

  const handleToggle = async (key: string, enabled: boolean) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled } : f))
    );
    const res = await toggleFlag(key, enabled);
    if ("error" in res) toast.error(res.error);
  };

  const handleRollout = async (key: string, percent: number) => {
    setFlags((prev) =>
      prev.map((f) => (f.key === key ? { ...f, rolloutPercent: percent } : f))
    );
    await updateFlagRollout(key, percent);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete flag "${key}"?`)) return;
    setFlags((prev) => prev.filter((f) => f.key !== key));
    await removeFlag(key);
    toast.success("Flag deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A/B testing feature flags powered by Upstash Redis.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <PlusIcon className="h-4 w-4 mr-1" />
          New Flag
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="rounded-xl border border-border">
          <CardContent className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Flag Key</Label>
                <Input
                  placeholder="e.g. new_feed_layout"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  placeholder="What this experiment tests"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Treatment rollout: {newRollout}%</Label>
              <Slider
                value={[newRollout]}
                onValueChange={([v]) => setNewRollout(v)}
                min={0}
                max={100}
                step={5}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} size="sm">
                Create
              </Button>
              <Button
                onClick={() => setShowCreate(false)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flags List */}
      {flags.length === 0 ? (
        <Card className="rounded-xl border border-border">
          <CardContent className="p-10 text-center">
            <FlaskConicalIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No experiments yet. Create your first feature flag.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card
              key={flag.key}
              className="rounded-xl border border-border"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-semibold">
                        {flag.key}
                      </code>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          flag.enabled
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {flag.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                    {flag.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Treatment:</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {flag.rolloutPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[flag.rolloutPercent]}
                        onValueChange={([v]) =>
                          handleRollout(flag.key, v)
                        }
                        min={0}
                        max={100}
                        step={5}
                        className="w-40"
                        disabled={!flag.enabled}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(checked) =>
                        handleToggle(flag.key, checked)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(flag.key)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
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
