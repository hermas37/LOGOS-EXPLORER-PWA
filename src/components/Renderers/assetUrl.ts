/** Light assets are stored as repo-relative paths (e.g. "episodes/slug/file.md"); heavy assets are already absolute Blob URLs. */
export function toFetchUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return '/' + url.replace(/^\/+/, '');
}
