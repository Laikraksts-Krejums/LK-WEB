import { getCloudflareContext } from "@opennextjs/cloudflare";

// Local-dev fallback; production serves images from the bucket's public domain.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  const { env } = getCloudflareContext();
  const bucket = env.PAGES_BUCKET;
  if (!bucket) return new Response("bucket not configured", { status: 500 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response("not found", { status: 404 });

  // Hand-built, not writeHttpMetadata(): in dev the R2 object is a proxied workerd handle.
  const headers = new Headers({
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    etag: object.httpEtag,
    "cache-control": "public, max-age=31536000, immutable",
  });

  if (request.headers.get("if-none-match") === object.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(object.body, { headers });
}
