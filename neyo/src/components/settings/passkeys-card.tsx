"use client";

import * as React from "react";
import {
  Fingerprint,
  Loader2,
  Trash2,
  Plus,
  KeyRound,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface Passkey {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export function PasskeysCard({ initial }: { initial: Passkey[] }) {
  const { toast } = useToast();
  const [passkeys, setPasskeys] = React.useState<Passkey[]>(initial);
  const [adding, setAdding] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    setSupported(
      typeof window !== "undefined" && Boolean(window.PublicKeyCredential)
    );
  }, []);

  async function addPasskey() {
    setLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      const optJson = await optRes.json();
      if (!optJson.ok) {
        toast({ title: optJson.error?.message || "Could not start.", tone: "error" });
        return;
      }

      // Browser prompts for Face ID / fingerprint / security key here.
      const attResp = await startRegistration(optJson.data.options);

      const verRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp, deviceLabel: label || "Passkey" }),
      });
      const verJson = await verRes.json();
      if (!verJson.ok) {
        toast({ title: verJson.error?.message || "Verification failed.", tone: "error" });
        return;
      }

      toast({ title: "Passkey added", tone: "success" });
      setAdding(false);
      setLabel("");
      await refresh();
    } catch (e) {
      // User cancelled the OS prompt, or it failed.
      toast({
        title: "Passkey setup cancelled",
        description: "No changes were made.",
        tone: "info",
      });
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    const res = await fetch("/api/auth/me");
    // Re-fetch list via a lightweight call: reuse the page data instead.
    // Simpler: reload the passkeys from a dedicated endpoint is overkill; we
    // optimistically add. To stay truthful, do a full reload of the section.
    window.location.reload();
  }

  async function remove(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/passkey/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        setPasskeys((p) => p.filter((x) => x.id !== id));
        toast({ title: "Passkey removed", tone: "info" });
      } else {
        toast({ title: json.error?.message || "Could not remove.", tone: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Passkeys</CardTitle>
        {supported && !adding && (
          <Button size="sm" onClick={() => setAdding(true)} disabled={loading}>
            <Plus className="h-4 w-4" />
            Add passkey
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!supported ? (
          <p className="text-sm text-navy-500 dark:text-navy-400">
            This device or browser doesn&apos;t support passkeys. Try a recent
            version of Chrome, Safari, or Edge.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-navy-500 dark:text-navy-400">
              Sign in with your fingerprint, Face ID, Windows Hello, or a
              hardware security key — no password needed.
            </p>

            {adding && (
              <div className="mb-5 space-y-3 rounded-2xl border border-navy-100 bg-warm-50 p-4 dark:border-navy-800 dark:bg-navy-950">
                <Input
                  placeholder="Name this device, e.g. My iPhone"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={loading}
                />
                <div className="flex gap-2">
                  <Button onClick={addPasskey} disabled={loading} className="flex-1">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Fingerprint className="h-4 w-4" />
                    )}
                    Create passkey
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAdding(false);
                      setLabel("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {passkeys.length === 0 ? (
              <EmptyState
                icon={KeyRound}
                title="No passkeys yet"
                description="Add a passkey to sign in with one touch."
                action={
                  !adding ? (
                    <Button onClick={() => setAdding(true)}>
                      <Plus className="h-4 w-4" />
                      Add your first passkey
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-navy-100 dark:divide-navy-800">
                {passkeys.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-500 dark:bg-navy-800 dark:text-navy-300">
                        <Fingerprint className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-900 dark:text-navy-50">
                          {p.deviceLabel || "Passkey"}
                        </p>
                        <p className="text-xs text-navy-400 dark:text-navy-500">
                          Added{" "}
                          {new Date(p.createdAt).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {p.lastUsedAt
                            ? ` · last used ${new Date(
                                p.lastUsedAt
                              ).toLocaleDateString("en-KE", {
                                day: "numeric",
                                month: "short",
                              })}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={loading}
                      aria-label="Remove passkey"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
