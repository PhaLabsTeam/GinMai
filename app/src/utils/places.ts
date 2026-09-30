import { Platform } from "react-native";
import type { LatLng } from "./location";

/**
 * Google Places API (New): restaurant search for create-moment (#13).
 * The key is restricted to the iOS bundle id, so every request says which app
 * it comes from. Sessions group an autocomplete run with the details lookup
 * that ends it, which Google bills as one search.
 */
const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";
const BASE = "https://places.googleapis.com/v1";
const APP_ID = "com.ginmai.app";

export const placesConfigured = () => KEY.length > 0;

export type PlaceSuggestion = { placeId: string; name: string; address: string };
export type PlaceDetails = { name: string; lat: number; lng: number; subdistrict: string | null };

function headers(extra: Record<string, string> = {}) {
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": KEY,
    ...(Platform.OS === "ios" ? { "X-Ios-Bundle-Identifier": APP_ID } : { "X-Android-Package": APP_ID }),
    ...extra,
  };
}

export function newSessionToken(): string {
  // Any unique string; a UUID-shaped one per search session
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Food places near `near` matching `query`. Empty on any failure. */
export async function searchPlaces(query: string, near: LatLng, sessionToken: string): Promise<PlaceSuggestion[]> {
  if (!placesConfigured() || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${BASE}/places:autocomplete`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        input: query,
        sessionToken,
        locationBias: { circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 8000 } },
        // Autocomplete accepts at most five primary types
        includedPrimaryTypes: ["restaurant", "cafe", "bakery", "bar", "food_court"],
        includedRegionCodes: ["th"],
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.log("Places search failed:", res.status, body?.error?.message);
      return [];
    }
    const data = await res.json();
    return (data.suggestions ?? [])
      .map((s: any) => s.placePrediction)
      .filter(Boolean)
      .slice(0, 6)
      .map((p: any) => ({
        placeId: p.placeId,
        name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
        address: p.structuredFormat?.secondaryText?.text ?? "",
      }));
  } catch (e) {
    console.log("Places search error:", e);
    return [];
  }
}

/** Name, coordinates and subdistrict for a chosen suggestion. */
export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails | null> {
  if (!placesConfigured()) return null;
  try {
    const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}?sessionToken=${sessionToken}`, {
      headers: headers({ "X-Goog-FieldMask": "displayName,location,addressComponents" }),
    });
    if (!res.ok) {
      console.log("Place details failed:", res.status);
      return null;
    }
    const d = await res.json();
    if (!d.location) return null;
    const sub = (d.addressComponents ?? []).find((c: any) =>
      (c.types ?? []).some((t: string) => t === "sublocality_level_1" || t === "sublocality")
    );
    return {
      name: d.displayName?.text ?? "",
      lat: d.location.latitude,
      lng: d.location.longitude,
      subdistrict: sub?.longText ?? null,
    };
  } catch (e) {
    console.log("Place details error:", e);
    return null;
  }
}
