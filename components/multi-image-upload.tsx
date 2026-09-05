"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compress";

export function MultiImageUpload({
  bucket,
  prefix,
  name,
  defaultUrls = [],
  max = 5,
  hint,
}: {
  bucket: string;
  prefix: string;
  name: string;
  defaultUrls?: string[];
  max?: number;
  hint?: string;
}) {
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const room = max - urls.length;
    if (room <= 0) {
      setError(`You can upload up to ${max} images.`);
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const added: string[] = [];
    for (const file of files.slice(0, room)) {
      if (file.size > 30 * 1024 * 1024) {
        setError("Each image must be under 30 MB.");
        continue;
      }
      try {
        const image = await compressImage(file);
        const ext = image.name.split(".").pop() || "jpg";
        const path = `${prefix}/banner-${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, image);
        if (upErr) throw upErr;
        added.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      } catch (err) {
        setError((err as Error).message || "Upload failed.");
      }
    }
    setUrls((prev) => [...prev, ...added].slice(0, max));
    setBusy(false);
  }

  function move(i: number, dir: -1 | 1) {
    setUrls((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div key={url} className="group relative h-24 w-40 overflow-hidden rounded-lg border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`banner ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/50 px-1.5 py-1 opacity-0 transition group-hover:opacity-100">
              <button type="button" className="text-xs text-white disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>←</button>
              <button type="button" className="text-xs text-white" onClick={() => remove(i)}>Remove</button>
              <button type="button" className="text-xs text-white disabled:opacity-30" disabled={i === urls.length - 1} onClick={() => move(i, 1)}>→</button>
            </div>
            <span className="absolute left-1 top-1 rounded bg-black/50 px-1.5 text-[10px] text-white">{i + 1}</span>
          </div>
        ))}
        {urls.length < max && (
          <label className="grid h-24 w-40 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-400 hover:bg-slate-50">
            {busy ? "Uploading…" : `+ Add image (${urls.length}/${max})`}
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={busy} />
          </label>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
