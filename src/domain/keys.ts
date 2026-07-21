export function issueObjectKey(issueId: string, ext: string): string {
  return `issues/${issueId}/${crypto.randomUUID()}.${ext}`;
}
