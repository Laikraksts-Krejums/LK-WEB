const PUBLIC_BASE = normalizeBase(process.env.NEXT_PUBLIC_R2_PUBLIC_URL);

function normalizeBase(value: string | undefined): string | undefined {
  const base = value?.trim().replace(/\/+$/, "");
  if (!base) return undefined;
  return /^https?:\/\//i.test(base) ? base : `https://${base}`;
}

export const R2_PUBLIC_ORIGIN = PUBLIC_BASE;

export function r2PublicUrl(key: string): string {
  if (!key) return "";
  const clean = key.replace(/^\/+/, "");
  if (!PUBLIC_BASE) return `/api/r2/asset/${clean}`;
  return `${PUBLIC_BASE}/${clean}`;
}
