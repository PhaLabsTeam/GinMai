import { distanceMeters } from "./distance";
import type { LatLng } from "./location";

/**
 * The names people in Chiang Mai actually use (#30). Geocoders only know
 * official subdistricts ("Suthep", "Chang Phueak"), which is how Nimman
 * showed up as "Suthep". Centres are approximate; the nearest one within
 * its radius wins.
 */
const NEIGHBORHOODS: Array<{ name: string; lat: number; lng: number; radius: number }> = [
  { name: "Nimman", lat: 18.7985, lng: 98.9675, radius: 900 },
  { name: "Old City", lat: 18.7883, lng: 98.9853, radius: 1000 },
  { name: "Santitham", lat: 18.8030, lng: 98.9780, radius: 700 },
  { name: "Chang Phueak", lat: 18.8080, lng: 98.9860, radius: 800 },
  { name: "Night Bazaar", lat: 18.7870, lng: 99.0000, radius: 600 },
  { name: "Riverside", lat: 18.7900, lng: 99.0060, radius: 600 },
  { name: "Wua Lai", lat: 18.7795, lng: 98.9855, radius: 500 },
  { name: "Chang Khlan", lat: 18.7780, lng: 98.9990, radius: 700 },
  { name: "Hai Ya", lat: 18.7780, lng: 98.9780, radius: 600 },
  { name: "CMU", lat: 18.8030, lng: 98.9530, radius: 1000 },
];

/** "Tambon Chang Phueak" -> "Chang Phueak" */
export function cleanSubdistrict(name: string | null | undefined): string | null {
  if (!name) return null;
  const cleaned = name.replace(/^(Tambon|Khwaeng|Amphoe)\s+/i, "").trim();
  return cleaned || null;
}

/** The local neighbourhood name for a point, else the cleaned subdistrict. */
export function areaNameFor(point: LatLng, subdistrict?: string | null): string | null {
  let best: { name: string; d: number } | null = null;
  for (const n of NEIGHBORHOODS) {
    const d = distanceMeters(point, n);
    if (d <= n.radius && (!best || d < best.d)) best = { name: n.name, d };
  }
  return best?.name ?? cleanSubdistrict(subdistrict);
}

/** How to name a Moment's location in titles (#52). */
export function momentPlaceTitle(location: { place_name?: string; area_name?: string }): string {
  if (location.place_name) return location.place_name;
  if (location.area_name) return `Somewhere in ${location.area_name}`;
  return "Somewhere nearby";
}
