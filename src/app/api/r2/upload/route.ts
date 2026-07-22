import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { issueObjectKey } from "@/domain/keys";
import { apiVersion, dataset, projectId } from "@/sanity/env";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 15 * 1024 * 1024;

// Cached so an 18-file drop isn't 18 round-trips; pruned on read to drop revoked tokens.
const verified = new Map<string, number>();
const VERIFY_TTL_MS = 60_000;

function isVerified(token: string): boolean {
  const now = Date.now();
  for (const [t, expiry] of verified) {
    if (expiry <= now) verified.delete(t);
  }
  return (verified.get(token) ?? 0) > now;
}

// Dry-run create: membership is NOT enough — a read-only viewer token is a member.
async function canWriteToProject(token: string): Promise<boolean> {
  if (isVerified(token)) return true;

  let res: Response;
  try {
    res = await fetch(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?dryRun=true`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mutations: [
            { create: { _id: "drafts.r2-upload-permission-probe", _type: "issue" } },
          ],
        }),
      },
    );
  } catch {
    return false; // fail closed
  }
  if (!res.ok) return false;

  verified.set(token, Date.now() + VERIFY_TTL_MS);
  return true;
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await canWriteToProject(token))) {
    return NextResponse.json(
      { error: "forbidden: this Sanity account cannot write to the dataset" },
      { status: 403 },
    );
  }

  const contentType = (request.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `unsupported content-type: ${contentType || "(none)"}` },
      { status: 415 },
    );
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const url = new URL(request.url);
  const issueId = (url.searchParams.get("issueId") ?? "").replace(
    /[^a-zA-Z0-9_-]/g,
    "",
  );
  // Reject a stripped/dots-only id rather than trusting R2 to neutralise `issues/../…`.
  if (!issueId) {
    return NextResponse.json({ error: "missing issueId" }, { status: 400 });
  }

  const body = await readBounded(request);
  if (!body) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const key = issueObjectKey(issueId, EXT_BY_TYPE[contentType]);

  const { env } = getCloudflareContext();
  const bucket = env.PAGES_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      { error: "R2 bucket binding PAGES_BUCKET is not configured" },
      { status: 500 },
    );
  }

  try {
    await bucket.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "storage write failed" }, { status: 502 });
  }

  return NextResponse.json({ key });
}

// Bounded read: an understated content-length can't make us buffer an unbounded upload.
async function readBounded(request: Request): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) {
    const buf = new Uint8Array(await request.arrayBuffer());
    return buf.byteLength > MAX_BYTES ? null : buf;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
