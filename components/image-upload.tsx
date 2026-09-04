"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  bucket,
  prefix,
  name,
  defaultUrl,
  label = "Upload an image",
  hint,
  shape = "square",
}: {
  bucket: string;
  prefix: string;
  name: string;
  defaultUrl?: string | null;
  label?: string;
  hint?: string;
  shape?: "square" | "wide";
}) {
  const [url, setUrl] = useState<string>(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-start gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="preview"
            className={`${shape === "square" ? "h-20 w-20" : "h-20 w-32"} rounded-lg border border-slate-200 object-cover`}
          />
        ) : (
          <div
            className={`${shape === "square" ? "h-20 w-20" : "h-20 w-32"} grid place-items-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400`}
          >
            No image
          </div>
        )}
        <div>
          <label className="btn-ghost btn-sm cursor-pointer">
            {busy ? "Uploading…" : label}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
          </label>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
