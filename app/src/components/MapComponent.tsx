import { View, Platform } from "react-native";
import React from "react";

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
  showsUserLocation = false,
  scrollEnabled = true,
  zoomEnabled = true,
  style,
  fallback,
}: MapComponentProps) {
  if (!mapsAvailable || !MapView) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <MapView
      style={style || { flex: 1 }}
      initialRegion={region}
      region={region}
      onMapReady={onMapReady}
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
                    backgroundColor: "#F97316",
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
