import React from "react";

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

// Web version - maps not available
export const mapsAvailable = false;

export function MapComponent({ fallback }: MapComponentProps) {
  // On web, always show the fallback
  return fallback ? <>{fallback}</> : null;
}
