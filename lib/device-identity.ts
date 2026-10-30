export const VIEWER_COOKIE = "mat_viewer";
export const VISITOR_COOKIE = "mat_vid";
export const FOLLOW_COOKIE = "mat_follow";
export const DEFAULT_MUNICIPALITY = "CPT";

export function isDeviceId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}
