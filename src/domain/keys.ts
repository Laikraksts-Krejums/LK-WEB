/** The R2 object key for one uploaded page. The one definition of the layout —
    the upload route mints keys through here so nothing can drift from it. */
export function issueObjectKey(issueId: string, ext: string): string {
  return `issues/${issueId}/${crypto.randomUUID()}.${ext}`;
}
