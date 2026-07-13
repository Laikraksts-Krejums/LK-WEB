// Served from the bucket's public custom domain in production. Without one, we
// fall back to streaming from the R2 binding so local dev works offline.
const PUBLIC_BASE = normalizeBase(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);

/**
 * A bare hostname in the env var would produce a relative URL and silently
 * break every page image, so assume https:// when no scheme is given.
 */
function normalizeBase(value: string | undefined): string | undefined {
  const base = value?.trim().replace(/\/+$/, "");
  if (!base) return undefined;
  return /^https?:\/\//i.test(base) ? base : `https://${base}`;
}

export function r2PublicUrl(key: string): string {
  if (!key) return "";
  const clean = key.replace(/^\/+/, "");
  if (!PUBLIC_BASE) return `/api/r2/asset/${clean}`;
  return `${PUBLIC_BASE}/${clean}`;
}

/** Keys are always minted server-side. */
export function issueObjectKey(issueId: string, ext: string): string {
  return `issues/${issueId}/${crypto.randomUUID()}.${ext}`;
}
