"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";

export type UploadedPage = {
  key: string;
  width: number;
  height: number;
  originalFilename: string;
};

export type UploadProgress = {
  total: number;
  done: number;
  current?: string;
};

/** "name (3).jpg" → ["name", 3]; no suffix is copy 0, which keeps WhatsApp's
    first image ahead of its "(1)" copy instead of behind all ten. */
function orderKey(filename: string): [string, number] {
  const dot = filename.lastIndexOf(".");
  const stem = dot > 0 ? filename.slice(0, dot) : filename;
  const copy = stem.match(/^(.*?) \((\d+)\)$/);
  return copy ? [copy[1], Number(copy[2])] : [stem, 0];
}

/** Best-effort only — filenames may carry no page order at all, so the Studio's
 *  drag-to-reorder stays the source of truth. */
function byReadingOrder(a: File, b: File): number {
  const [aStem, aCopy] = orderKey(a.name);
  const [bStem, bCopy] = orderKey(b.name);
  return (
    aStem.localeCompare(bStem, undefined, { numeric: true }) || aCopy - bCopy
  );
}

/** Measured before upload so the reader can reserve space. */
async function measure(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return { width: 0, height: 0 };
  }
}

/** Uploads to R2 via our own same-origin route, authorised by the Studio's token. */
export function useR2Upload(issueId: string) {
  const client = useClient({ apiVersion: "2024-10-01" });
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<UploadedPage[]> => {
      const ordered = [...files].sort(byReadingOrder);

      const token = client.config().token;
      if (!token) {
        throw new Error(
          "No Sanity access token. Reload the Studio and sign in again.",
        );
      }

      const uploaded: UploadedPage[] = [];

      setProgress({ total: ordered.length, done: 0 });

      // finally, not just success: a thrown upload used to leave `progress` set,
      // which the input reads as busy — bricking the dropzone until a reload.
      try {
        for (const [i, file] of ordered.entries()) {
          setProgress({ total: ordered.length, done: i, current: file.name });

          const { width, height } = await measure(file);
          const res = await fetch(
            `/api/r2/upload?issueId=${encodeURIComponent(issueId)}` +
              `&filename=${encodeURIComponent(file.name)}`,
            {
              method: "POST",
              headers: {
                "content-type": file.type || "application/octet-stream",
                ...(token ? { authorization: `Bearer ${token}` } : {}),
              },
              body: file,
            },
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            throw new Error(`${file.name}: ${res.status} ${detail.slice(0, 120)}`);
          }

          const { key } = (await res.json()) as { key: string };
          uploaded.push({
            key,
            width,
            height,
            originalFilename: file.name,
          });
        }
        return uploaded;
      } finally {
        setProgress(null);
      }
    },
    [client, issueId],
  );

  return { uploadFiles, progress };
}
