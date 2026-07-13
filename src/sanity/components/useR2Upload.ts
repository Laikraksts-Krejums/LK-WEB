"use client";

import { useCallback, useState } from "react";
import { useClient } from "sanity";

export type UploadedPage = {
  key: string;
  width: number;
  height: number;
  originalFilename: string;
  size: number;
};

export type UploadProgress = {
  total: number;
  done: number;
  current?: string;
  error?: string;
};

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
      // page-01…page-18 should land in reading order, not the OS's order.
      const ordered = [...files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );

      const token = client.config().token;
      if (!token) {
        throw new Error(
          "No Sanity access token — reload the Studio and sign in again.",
        );
      }

      const uploaded: UploadedPage[] = [];

      setProgress({ total: ordered.length, done: 0 });

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
          const message = `${file.name}: ${res.status} ${detail.slice(0, 120)}`;
          setProgress({ total: ordered.length, done: i, error: message });
          throw new Error(message);
        }

        const { key } = (await res.json()) as { key: string };
        uploaded.push({
          key,
          width,
          height,
          originalFilename: file.name,
          size: file.size,
        });
      }

      setProgress(null);
      return uploaded;
    },
    [client, issueId],
  );

  return { uploadFiles, progress };
}
