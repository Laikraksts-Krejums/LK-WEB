import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Local-dev fallback. In production images come from the bucket's public custom
 * domain and this route is never hit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.join("/");

  const { env } = getCloudflareContext();
  const bucket = env.PAGES_BUCKET;
  if (!bucket) return new Response("bucket not configured", { status: 500 });

  const object = await bucket.get(objectKey);
  if (!object) return new Response("not found", { status: 404 });

  // Headers are built by hand rather than with object.writeHttpMetadata(): in
  // `next dev` the R2 object is a proxied handle over to workerd, and a local
  // Headers instance cannot cross that boundary.
  const headers = new Headers({
    "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
    etag: object.httpEtag,
    "cache-control": "public, max-age=31536000, immutable",
  });

  return new Response(await object.arrayBuffer(), { headers });
}
