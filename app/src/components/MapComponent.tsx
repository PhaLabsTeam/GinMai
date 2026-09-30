import { View, Platform } from "react-native";
import React, { useEffect, useRef } from "react";
import { colors } from "../theme/colors";

// Conditionally import MapView and Marker only on native
let MapView: any = null;
let Marker: any = null;
let mapsAvailable = false;

if (Platform.OS !== "web") {
  try {
    const Maps = require("react-native-maps");
    MapView = Maps.default;
    Marker = Maps.Marker;
    mapsAvailable = true;
  } catch (e) {
    console.log("react-native-maps not available:", e);
    mapsAvailable = false;
  }
}

interface MapComponentProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    onPress?: () => void;
  }>;
  onMapReady?: () => void;
  // MapKit's own fix for the blue dot; often available before expo-location's
  onUserLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  showsUserLocation?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  style?: any;
  fallback?: React.ReactNode;
}

export function MapComponent({
  region,
  markers = [],
  onMapReady,
  onUserLocationChange,
  showsUserLocation = false,
  scrollEnabled = true,
  zoomEnabled = true,
  style,
  fallback,
}: MapComponentProps) {
  const mapRef = useRef<any>(null);

  // Not a controlled `region`: that snapped the map back whenever the screen
  // re-rendered after the user panned. Only move it when the app asks to.
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  useEffect(() => {
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta, longitudeDelta }, 400);
  }, [latitude, longitude, latitudeDelta, longitudeDelta]);

  if (!mapsAvailable || !MapView) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <MapView
      ref={mapRef}
      style={style || { flex: 1 }}
      initialRegion={region}
      onMapReady={onMapReady}
      onUserLocationChange={
        onUserLocationChange
          ? (e: any) => e?.nativeEvent?.coordinate && onUserLocationChange(e.nativeEvent.coordinate)
          : undefined
      }
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      pitchEnabled={false}
      rotateEnabled={false}
      mapType="standard"
    >
      {Marker &&
        markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            onPress={marker.onPress}
          >
            {/* Pulse marker */}
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(249, 115, 22, 0.25)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.accent,
                  }}
                />
              </View>
            </View>
          </Marker>
        ))}
    </MapView>
  );
}

export { mapsAvailable };
