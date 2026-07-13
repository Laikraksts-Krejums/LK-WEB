import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

/**
 * `revalidate` only works on Workers with BOTH an incremental cache and a queue;
 * with neither it silently does nothing.
 *
 * revalidateTag/revalidatePath additionally need a D1 tag cache. We have none,
 * which is why nothing calls them — without one they are no-ops that look like
 * they worked.
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    bypassTagCacheOnCacheHit: true,
  }),
  queue: doQueue,
});
