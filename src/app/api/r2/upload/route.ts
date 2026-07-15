import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { issueObjectKey } from "@/domain/keys";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * The only endpoint that writes to storage. Called from the Studio's pages
 * input; same-origin, via the R2 binding, so there are no S3 keys and no CORS.
 *
 * Object keys are minted server-side, so a client cannot traverse paths or
 * overwrite another issue's pages.
 */

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 15 * 1024 * 1024;

/** Cached briefly so an 18-file drop isn't 18 round-trips. */
const verified = new Map<string, number>();
const VERIFY_TTL_MS = 60_000;

/**
 * Asks Sanity whether this token may actually write to this project's dataset,
 * by dry-running a create it never commits.
 *
 * Checking project *membership* is not enough: a read-only viewer token is a
 * member, so it would pass and could then write junk into the bucket. This asks
 * the question we actually care about, and Sanity answers it authoritatively —
 * a viewer token comes back 403 "permission create required". The host is
 * project-scoped, so a token from another project fails here too.
 */
async function canWriteToProject(token: string): Promise<boolean> {
  const cached = verified.get(token);
  if (cached && Date.now() < cached) return true;

  const res = await fetch(
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
    /[^a-zA-Z0-9._-]/g,
    "",
  );
  if (!issueId) {
    return NextResponse.json({ error: "missing issueId" }, { status: 400 });
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  // Minted here, never taken from the client.
  const key = issueObjectKey(issueId, EXT_BY_TYPE[contentType]);

  const { env } = getCloudflareContext();
  const bucket = env.PAGES_BUCKET;
  if (!bucket) {
    return NextResponse.json(
      { error: "R2 bucket binding PAGES_BUCKET is not configured" },
      { status: 500 },
    );
  }

  await bucket.put(key, body, {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  return NextResponse.json({ key });
}
