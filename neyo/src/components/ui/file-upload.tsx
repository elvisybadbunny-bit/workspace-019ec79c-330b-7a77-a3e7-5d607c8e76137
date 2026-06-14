"use client";

import * as React from "react";
import { Paperclip, Loader2, X, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export interface UploadedFile {
  id: string;
  url: string;
  fileName: string;
}

/**
 * Reusable upload control (A.9). Runs presign -> PUT -> confirm.
 * Works in dev (local provider) and prod (R2) with the same code.
 */
export function FileUpload({
  category = "attachment",
  accept = "image/*,application/pdf",
  onUploaded,
  label = "Attach",
}: {
  category?: string;
  accept?: string;
  onUploaded: (file: UploadedFile) => void;
  label?: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      // 1) presign
      const pres = await fetch("/api/files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          category,
        }),
      });
      const presJson = await pres.json();
      if (!presJson.ok) {
        toast({ title: presJson.error?.message || "Upload failed.", tone: "error" });
        return;
      }
      const { uploadUrl, key } = presJson.data;

      // 2) PUT the bytes directly to storage (R2 presigned, or dev endpoint)
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        toast({ title: "Could not upload the file.", tone: "error" });
        return;
      }

      // 3) confirm/record
      const conf = await fetch("/api/files/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          category,
        }),
      });
      const confJson = await conf.json();
      if (!confJson.ok) {
        toast({ title: confJson.error?.message || "Could not save the file.", tone: "error" });
        return;
      }
      onUploaded(confJson.data);
    } catch {
      toast({ title: "Network problem during upload.", tone: "error" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-navy-100 disabled:opacity-50 dark:text-navy-300 dark:hover:bg-navy-800"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Paperclip className="h-5 w-5" />
        )}
      </button>
    </>
  );
}

/** Small chip showing a staged attachment with a remove button. */
export function AttachmentChip({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs text-navy-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200">
      <FileText className="h-3.5 w-3.5" />
      <span className="max-w-[12rem] truncate">{file.fileName}</span>
      <button onClick={onRemove} aria-label="Remove" className="text-navy-400 hover:text-red-500">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
