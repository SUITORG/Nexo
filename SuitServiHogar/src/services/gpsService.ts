export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface ObfuscatedLocation {
  lat: number;
  lng: number;
  radius: number; // 150-250m
}

const OBFUSCATION_MIN = 150; // meters
const OBFUSCATION_MAX = 250; // meters

function metersToLatOffset(meters: number): number {
  return meters / 111000; // 1 degree lat ≈ 111km
}

function metersToLngOffset(meters: number, lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return meters / (111000 * Math.cos(latRad));
}

export function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function obfuscateLocation(point: GeoPoint): ObfuscatedLocation {
  const radius = OBFUSCATION_MIN + Math.random() * (OBFUSCATION_MAX - OBFUSCATION_MIN);
  const angle = Math.random() * 2 * Math.PI;
  const latOffset = metersToLatOffset(radius) * Math.cos(angle);
  const lngOffset = metersToLngOffset(radius, point.lat) * Math.sin(angle);
  return {
    lat: point.lat + latOffset,
    lng: point.lng + lngOffset,
    radius: Math.round(radius),
  };
}

export function getGoogleMapsStaticUrl(point: ObfuscatedLocation, zoom = 15, size = '400x300'): string {
  const { lat, lng, radius } = point;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const base = 'https://maps.googleapis.com/maps/api/staticmap';
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: zoom.toString(),
    size,
    maptype: 'roadmap',
    markers: `color:red|${lat},${lng}`,
    format: 'png',
    ...(apiKey && { key: apiKey }),
  });
  return `${base}?${params.toString()}`;
}

export function getGoogleMapsEmbedUrl(point: ObfuscatedLocation): string {
  const { lat, lng } = point;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`;
}