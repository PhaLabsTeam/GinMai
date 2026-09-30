import * as Location from "expo-location";

export type LatLng = { lat: number; lng: number };

/**
 * The user's position, or null. A cold GPS often fails the first request
 * (kCLErrorDomain 0), so fall back to the last known fix, which is plenty for
 * "meals near me". Never throws; callers decide what to do without a position.
 */
export async function getBestPosition(): Promise<LatLng | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const position =
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null)) ??
      (await Location.getLastKnownPositionAsync());
    if (!position) return null;

    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch (e) {
    console.log("Location unavailable:", e);
    return null;
  }
}
