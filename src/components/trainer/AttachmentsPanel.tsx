"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useProfile } from "@/hooks/useProfile";
import type { ClientAttachment, LiabilityWaiver } from "@/lib/portal/types";
import {
  Card,
  Field,
  TextInput,
  TextArea,
  PortalButton,
  ErrorBanner,
  Spinner,
} from "@/components/portal/ui";

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export default function AttachmentsPanel({
  clientId,
  waiver,
}: {
  clientId: string;
  waiver: LiabilityWaiver | null;
}) {
  const { profile } = useProfile();
  const [attachments, setAttachments] = useState<ClientAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("client_attachments")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setAttachments((data as ClientAttachment[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  function pickFile(f: File | null) {
    setError("");
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Please choose a PDF or image (JPG, PNG, WebP).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File must be under 20 MB.");
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function upload() {
    if (!profile) return;
    if (!title.trim()) {
      setError("Add a title for this attachment.");
      return;
    }
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setMsg("");
    const supabase = getSupabaseBrowser();

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${clientId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("client-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setUploading(false);
      setError(`Upload failed: ${upErr.message}`);
      return;
    }

    const { error: insErr } = await supabase.from("client_attachments").insert({
      client_id: clientId,
      title: title.trim(),
      note: note.trim() || null,
      file_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      created_by: profile.id,
    });
    setUploading(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setTitle("");
    setNote("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setMsg("Attachment uploaded.");
    setTimeout(() => setMsg(""), 3000);
    load();
  }

  async function openAttachment(att: ClientAttachment) {
    const supabase = getSupabaseBrowser();
    const { data, error: err } = await supabase.storage
      .from("client-attachments")
      .createSignedUrl(att.file_path, 60 * 60);
    if (err || !data) {
      setError("Could not open file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function remove(att: ClientAttachment) {
    if (!confirm(`Delete "${att.title}"? This cannot be undone.`)) return;
    const supabase = getSupabaseBrowser();
    await supabase.storage.from("client-attachments").remove([att.file_path]);
    await supabase.from("client_attachments").delete().eq("id", att.id);
    load();
  }

  return (
    <div className="space-y-6">
      {/* Waiver */}
      <Card>
        <h2 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Liability Waiver
        </h2>
        {!waiver ? (
          <p className="font-sans text-sm text-text-muted">Not signed yet.</p>
        ) : (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm font-medium ${
                waiver.agreed ? "bg-olive/10 text-olive" : "bg-blush text-burgundy"
              }`}
            >
              {waiver.agreed ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Agreed & signed by{" "}
                  <span className="font-semibold">{waiver.signed_name}</span>
                </>
              ) : (
                "Not agreed"
              )}
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              <WaiverRow label="Signed name" value={waiver.signed_name} />
              <WaiverRow label="Signed at" value={new Date(waiver.signed_at).toLocaleString()} />
              <WaiverRow label="Version" value={waiver.waiver_version} />
              <WaiverRow label="IP address" value={waiver.ip_address ?? "—"} />
            </dl>
          </div>
        )}
      </Card>

      {/* Upload */}
      <Card className="space-y-4">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Upload attachment
        </h2>
        <Field label="Title" required>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Signed contract, intake form, before photo…"
          />
        </Field>
        <Field label="Note">
          <TextArea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional context for this file"
          />
        </Field>
        <div>
          <label className="mb-1.5 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
            File <span className="text-terracotta">*</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PortalButton variant="secondary" onClick={() => fileRef.current?.click()}>
              {file ? "Change file" : "Choose file"}
            </PortalButton>
            {file && (
              <span className="font-sans text-sm text-text-muted">
                {file.name} · {formatBytes(file.size)}
              </span>
            )}
          </div>
          <p className="mt-1.5 font-sans text-xs text-text-muted/70">
            PDF or image (JPG, PNG, WebP) · max 20 MB · trainer-only, clients never see these
          </p>
        </div>

        <ErrorBanner message={error} />
        {msg && <p className="font-sans text-sm font-medium text-olive">{msg}</p>}

        <PortalButton onClick={upload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </PortalButton>
      </Card>

      {/* List */}
      <div>
        <h2 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted">
          Files {attachments.length > 0 && `(${attachments.length})`}
        </h2>
        {loading ? (
          <Spinner />
        ) : attachments.length === 0 ? (
          <Card className="text-center">
            <p className="font-sans text-sm text-text-muted">No attachments uploaded yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg-alt text-text-muted">
                    {isImage(att.mime_type) ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-sm font-medium text-text">{att.title}</p>
                    <p className="truncate font-sans text-xs text-text-muted">
                      {att.file_name}
                      {att.size_bytes ? ` · ${formatBytes(att.size_bytes)}` : ""}
                    </p>
                    {att.note && (
                      <p className="mt-0.5 font-sans text-xs italic text-text-muted">{att.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={() => openAttachment(att)}
                    className="font-sans text-xs font-medium text-terracotta hover:underline"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => remove(att)}
                    className="font-sans text-xs text-text-muted hover:text-burgundy"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function WaiverRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-alt/50 px-3 py-2">
      <dt className="font-sans text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-sans text-sm text-text">{value}</dd>
    </div>
  );
}
