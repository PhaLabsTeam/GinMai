// Maps raw Supabase/Twilio auth errors to copy users can act on.
// Raw messages can leak provider details (e.g. Twilio account IDs), so they
// only ever go to console.error, never to the screen.

export type AuthStage = "send" | "verify" | "profile";

const FALLBACK: Record<AuthStage, string> = {
  send: "Couldn't send a code. Check the number and try again.",
  verify: "Couldn't verify the code. Please try again.",
  profile: "Couldn't save your name. Please try again.",
};

export function friendlyAuthError(stage: AuthStage, raw?: string | null): string {
  const message = (raw ?? "").toLowerCase();

  if (/network request failed|failed to fetch|timeout|timed out/.test(message)) {
    return "Can't reach GinMai right now. Check your connection and try again.";
  }
  if (/rate limit|too many|429|security purposes/.test(message)) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (stage === "verify" && /expired|invalid|token/.test(message)) {
    return "That code didn't work. Check it, or ask for a new one.";
  }
  if (stage === "send" && /invalid.*phone|phone.*invalid/.test(message)) {
    return "That phone number doesn't look right. Check it and try again.";
  }

  return FALLBACK[stage];
}
