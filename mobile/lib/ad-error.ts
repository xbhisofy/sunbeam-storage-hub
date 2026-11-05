// SDK error codes are signals of availability, never proof of an ad blocker.
export function isAdNoFill(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error) || typeof error.code !== "string") return false;
  const code = error.code.replace(/^googleMobileAds\//, "");
  return code === "no-fill" || code === "error-code-no-fill" || code === "mediation-no-fill";
}