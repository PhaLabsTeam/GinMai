#!/usr/bin/env node
// Backend security check (Phase 8). Runs against the live Supabase project as
// a signed-out visitor and as four test users, and checks every rule in
// docs/backend/access-matrix.md. Exit code 1 if any check fails.
//
//   npm run security-check
//
// Uses only the public anon key and the Supabase test numbers. It creates its
// own Moments (area "security-check") and cancels them at the end; rows the
// rules won't let it delete are removed by supabase/scripts/purge-test-data.sql.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const AREA = "security-check";

const client = () =>
  createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(phone, token) {
  const c = client();
  await c.auth.signInWithOtp({ phone });
  const { data, error } = await c.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) throw new Error(`sign-in ${phone}: ${error.message}`);
  return { c, id: data.user.id };
}

const results = [];
async function check(id, name, fn) {
  try {
    const { ok, detail } = await fn();
    results.push({ id, name, ok, detail });
  } catch (e) {
    results.push({ id, name, ok: false, detail: `threw: ${e.message}` });
  }
}
// A write counts as refused when it errors or touches no rows
const refused = ({ error, data }) => !!error || !data || (Array.isArray(data) && data.length === 0);
const why = ({ error, data }) => (error ? error.message : `${Array.isArray(data) ? data.length : 1} row(s) affected`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newMoment(hostId, extra = {}) {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  return {
    host_id: hostId,
    host_name: "Check",
    starts_at: start.toISOString(),
    expires_at: new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString(),
    duration: "normal",
    lat: 18.796,
    lng: 98.968,
    area_name: AREA,
    seats_total: 2,
    ...extra,
  };
}

async function main() {
  const anon = client();
  const tester = await signIn("66999999999", "123456"); // host
  const sam = await signIn("66123456789", "159632"); // guest
  const kai = await signIn("66812345678", "123456"); // second host
  const ben = await signIn("66887654321", "123456"); // outsider
  // Every test user needs a profile (foreign keys); harmless if it exists
  for (const [u, n] of [[tester, "Tester"], [sam, "Sam"], [kai, "Kai"], [ben, "Ben"]]) {
    const { data } = await u.c.rpc("my_profile");
    if (!data?.length) await u.c.rpc("complete_my_profile", { p_first_name: n });
  }

  // Fixtures: Tester's Moment M (Sam joins), Kai's 1-seat Moment K (full)
  const created = [];
  const mk = async (u, extra) => {
    const { data, error } = await u.c.from("moments").insert(newMoment(u.id, extra)).select("id").single();
    if (error) throw new Error(`create moment: ${error.message}`);
    created.push([u, data.id]);
    return data.id;
  };
  const M = await mk(tester);
  const K = await mk(kai, { seats_total: 1 });
  await sam.c.from("connections").insert({ moment_id: M, user_id: sam.id, status: "confirmed" });
  await tester.c.from("connections").insert({ moment_id: K, user_id: tester.id, status: "confirmed" }); // fills K

  // --- Signed-out visitor ---
  await check("A1", "anon can't create a Moment", async () => {
    const r = await anon.from("moments").insert(newMoment(tester.id)).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("A2", "anon can't edit or delete a Moment", async () => {
    const u = await anon.from("moments").update({ note: "x" }).eq("id", M).select("id");
    const d = await anon.from("moments").delete().eq("id", M).select("id");
    return { ok: refused(u) && refused(d), detail: `update: ${why(u)}; delete: ${why(d)}` };
  });
  for (const t of ["users", "connections", "feedback", "reports", "blocks", "eat_again_matches", "relationships", "blocked_users"]) {
    await check("A3", `anon reads nothing from ${t}`, async () => {
      const r = await anon.from(t).select("*").limit(1);
      return { ok: !!r.error || r.data.length === 0, detail: r.error ? r.error.message : `${r.data.length} row(s)` };
    });
  }
  await check("A4", "anon can't call nearby_moments", async () => {
    const r = await anon.rpc("nearby_moments", { user_lat: 18.79, user_lng: 98.97, radius_km: 50 });
    return { ok: !!r.error, detail: r.error ? r.error.message : `${r.data?.length} row(s) returned` };
  });

  // --- Moments (#64) ---
  await check("M1", "a user can't edit someone else's Moment", async () => {
    const r = await ben.c.from("moments").update({ note: "x" }).eq("id", M).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("M2", "a host can't move their Moment's time or place (#64)", async () => {
    const r = await tester.c.from("moments").update({ starts_at: new Date(Date.now() + 9e6).toISOString(), lat: 1 }).eq("id", M).select("starts_at, lat");
    const moved = !r.error && r.data?.[0]?.lat === 1;
    return { ok: !moved, detail: r.error ? r.error.message : moved ? "time and place changed" : "unchanged" };
  });
  await check("M3", "a host can't post under someone else's name (#64)", async () => {
    const r = await tester.c.from("moments").insert(newMoment(tester.id, { host_name: "GinMai Team" })).select("id, host_name").single();
    if (r.data) created.push([tester, r.data.id]);
    return { ok: !!r.error || r.data.host_name !== "GinMai Team", detail: r.error ? r.error.message : `host_name = ${r.data.host_name}` };
  });
  await check("M4", "a Moment can't be made to last for months (#64)", async () => {
    const r = await tester.c.from("moments").insert(newMoment(tester.id, { expires_at: "2099-01-01T00:00:00Z" })).select("id, expires_at").single();
    if (r.data) created.push([tester, r.data.id]);
    return { ok: !!r.error || r.data.expires_at < "2098", detail: r.error ? r.error.message : `expires_at = ${r.data.expires_at}` };
  });
  await check("M5", "a host can still cancel their Moment", async () => {
    const id = await mk(tester);
    const r = await tester.c.from("moments").update({ status: "cancelled" }).eq("id", id).select("status");
    return { ok: !r.error && r.data?.[0]?.status === "cancelled", detail: why(r) };
  });

  // --- Connections (#65) ---
  await check("C1", "a user can't join on someone else's behalf", async () => {
    const id = await mk(kai);
    const r = await ben.c.from("connections").insert({ moment_id: id, user_id: sam.id, status: "confirmed" }).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("C2", "a join can't start as completed or arrived (#65)", async () => {
    const id = await mk(kai);
    const r = await ben.c.from("connections").insert({ moment_id: id, user_id: ben.id, status: "completed" }).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("C3", "a guest can't move their seat to another (full) Moment (#65)", async () => {
    const r = await sam.c.from("connections").update({ moment_id: K }).eq("moment_id", M).eq("user_id", sam.id).select("moment_id");
    const moved = !r.error && r.data?.[0]?.moment_id === K;
    if (moved) await sam.c.from("connections").update({ moment_id: M }).eq("moment_id", K).eq("user_id", sam.id);
    return { ok: !moved, detail: r.error ? r.error.message : moved ? "moved into a full Moment" : why(r) };
  });
  await check("C4", "a host can't put another user into their Moment (#65)", async () => {
    const r = await tester.c.from("connections").update({ user_id: ben.id }).eq("moment_id", M).eq("user_id", sam.id).select("user_id");
    const swapped = !r.error && r.data?.[0]?.user_id === ben.id;
    if (swapped) await tester.c.from("connections").update({ user_id: sam.id }).eq("moment_id", M).eq("user_id", ben.id);
    return { ok: !swapped, detail: r.error ? r.error.message : swapped ? "guest swapped for Ben" : why(r) };
  });
  await check("C5", "a user can't see other people's connections", async () => {
    const r = await ben.c.from("connections").select("id").eq("moment_id", M);
    return { ok: !!r.error || r.data.length === 0, detail: r.error ? r.error.message : `${r.data.length} row(s)` };
  });
  await check("C6", "a guest can still arrive, run late and leave", async () => {
    const a = await sam.c.from("connections").update({ running_late: true, running_late_at: new Date().toISOString() }).eq("moment_id", M).eq("user_id", sam.id).select("id");
    const b = await sam.c.from("connections").update({ status: "arrived", arrived_at: new Date().toISOString() }).eq("moment_id", M).eq("user_id", sam.id).select("id");
    const c = await sam.c.from("connections").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("moment_id", M).eq("user_id", sam.id).select("id");
    const d = await sam.c.from("connections").update({ status: "confirmed", cancelled_at: null, running_late: false }).eq("moment_id", M).eq("user_id", sam.id).select("id");
    const ok = [a, b, c, d].every((r) => !refused(r));
    return { ok, detail: [a, b, c, d].map(why).join(" | ") };
  });

  // --- Users (#62, #66) ---
  await check("U1", "phone numbers aren't readable by others", async () => {
    const r = await ben.c.from("users").select("phone").neq("id", ben.id);
    return { ok: !!r.error || r.data.every((x) => !x.phone), detail: r.error ? r.error.message : `${r.data.length} phone(s) readable` };
  });
  await check("U2", "a user can't change their own phone or verified flag (#66)", async () => {
    const r = await sam.c.from("users").update({ phone_verified: true }).eq("id", sam.id).select("id");
    return { ok: !!r.error, detail: r.error ? r.error.message : "update accepted" };
  });
  await check("U3", "a user can't reset their no-shows or ban status", async () => {
    const r = await sam.c.from("users").update({ no_shows: 0, status: "active" }).eq("id", sam.id).select("id");
    return { ok: !!r.error, detail: r.error ? r.error.message : "update accepted" };
  });

  // --- Feedback (#67) ---
  await check("F1", "no feedback about people you didn't eat with (#67)", async () => {
    const r = await ben.c.from("feedback").insert({ moment_id: M, from_user: ben.id, about_user: tester.id, rating: "nope", eat_again: false }).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("F2", "nobody reads feedback written about them", async () => {
    const r = await tester.c.from("feedback").select("id").eq("about_user", tester.id).neq("from_user", tester.id);
    return { ok: !!r.error || r.data.length === 0, detail: r.error ? r.error.message : `${r.data.length} row(s)` };
  });

  // --- Reports (#68) ---
  await check("R1", "a report can't carry a made-up phone or a 'resolved' status (#68)", async () => {
    const r = await sam.c.from("reports").insert({ reporter_id: sam.id, reported_user_id: ben.id, moment_id: K, category: "other", status: "resolved", reported_phone: "+66000000000" }).select("id");
    return { ok: refused(r), detail: why(r) };
  });
  await check("R2", "a reporter can't read the reported person's phone (#68)", async () => {
    await sam.c.from("reports").insert({ reporter_id: sam.id, reported_user_id: ben.id, moment_id: M, category: "other" });
    const r = await sam.c.from("reports").select("reported_phone, admin_notes").eq("reporter_id", sam.id);
    return { ok: !!r.error || r.data.every((x) => !x.reported_phone), detail: r.error ? r.error.message : `${r.data.filter((x) => x.reported_phone).length} phone(s) readable` };
  });

  // --- Connections list / legacy (#69) ---
  await check("L1", "a user can't add a fake Connection (#69)", async () => {
    const [a, b] = [ben.id, tester.id].sort();
    const r = await ben.c.from("relationships").insert({ user_a: a, user_b: b }).select("id");
    if (!refused(r)) await ben.c.from("relationships").delete().eq("user_a", a).eq("user_b", b);
    return { ok: refused(r), detail: why(r) };
  });
  await check("L2", "a user can't list someone else's Connections (#69)", async () => {
    const r = await ben.c.rpc("get_user_connections", { p_user_id: tester.id });
    return { ok: !!r.error || r.data.length === 0, detail: r.error ? r.error.message : `${r.data.length} of Tester's Connections returned` };
  });

  // --- Realtime (#71) ---
  await check("RT1", "the host gets a live event when a guest joins (#71)", async () => {
    const id = await mk(tester);
    let got = false;
    const ch = tester.c.channel(`check-${id}`).on("postgres_changes", { event: "*", schema: "public", table: "connections", filter: `moment_id=eq.${id}` }, () => (got = true));
    await new Promise((res) => ch.subscribe((s) => s === "SUBSCRIBED" && res()));
    // Realtime needs a moment after SUBSCRIBED before it delivers (in the app
    // the host opens the live screen long before anyone joins)
    await sleep(2000);
    await kai.c.from("connections").insert({ moment_id: id, user_id: kai.id, status: "confirmed" });
    for (let i = 0; i < 40 && !got; i++) await sleep(250);
    await tester.c.removeChannel(ch);
    return { ok: got, detail: got ? "event received" : "no event within 10 s" };
  });
  await check("RT2", "an outsider gets no events about other people's connections", async () => {
    const id = await mk(tester);
    let got = 0;
    const ch = ben.c.channel(`spy-${id}`).on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => got++);
    await new Promise((res) => ch.subscribe((s) => s === "SUBSCRIBED" && res()));
    await sleep(2000);
    await kai.c.from("connections").insert({ moment_id: id, user_id: kai.id, status: "confirmed" });
    await sleep(5000);
    await ben.c.removeChannel(ch);
    return { ok: got === 0, detail: `${got} event(s) leaked` };
  });

  // --- Seats (#60) ---
  await check("S1", "two people can't both take the last seat", async () => {
    const id = await mk(tester, { seats_total: 1 });
    await Promise.all([
      ben.c.from("connections").insert({ moment_id: id, user_id: ben.id, status: "confirmed" }),
      kai.c.from("connections").insert({ moment_id: id, user_id: kai.id, status: "confirmed" }),
    ]);
    const { data } = await tester.c.from("connections").select("id").eq("moment_id", id).neq("status", "cancelled");
    return { ok: data.length === 1, detail: `${data.length} guest(s) got the seat` };
  });

  // Clean up: cancel every Moment we made (connections stay for history)
  for (const [u, id] of created) await u.c.from("moments").update({ status: "cancelled" }).eq("id", id);

  // Report
  const w = Math.max(...results.map((r) => r.name.length));
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id.padEnd(4)} ${r.name.padEnd(w)}  ${r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
