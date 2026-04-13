"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface GoogleMapProps {
  locations: { position: { latitude: number; longitude: number }; labName: string }[];
  destination: { longitude: number; latitude: number } | null;
  setDestination: (destination: {
    longitude: number;
    latitude: number;
  }) => void;
}

type LatLng = [number, number];

const userIcon = L.divIcon({
  className: "",
  html: "<div style='width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:9999px;box-shadow:0 0 8px rgba(37,99,235,.6);'></div>",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const labIcon = L.divIcon({
  className: "",
  html: "<div style='width:12px;height:12px;background:#16a34a;border:2px solid white;border-radius:9999px;box-shadow:0 0 6px rgba(22,163,74,.6);'></div>",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const toRad = (value: number) => (value * Math.PI) / 180;
const distanceMeters = (a: LatLng, b: LatLng) => {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const x =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const FitBounds: React.FC<{ points: LatLng[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);

  return null;
};

const CustomGoogleMap: React.FC<GoogleMapProps> = ({
  locations,
  destination,
  setDestination,
}) => {
  const [routePath, setRoutePath] = useState<LatLng[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting user location:", error);
        setUserLocation({ lat: 0, lng: 0 });
      }
    );
  }, []);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!userLocation || !destination) {
        setRoutePath([]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (!Array.isArray(coordinates)) {
          setRoutePath([]);
          return;
        }

        const points: LatLng[] = coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]);
        setRoutePath(points);
      } catch (error) {
        console.error("Failed to fetch OSRM route", error);
        setRoutePath([]);
      }
    };

    fetchRoute();
  }, [userLocation, destination]);

  const fitPoints = useMemo(() => {
    if (!userLocation) return [] as LatLng[];

    const userPoint: LatLng = [userLocation.lat, userLocation.lng];
    const nearest = [...locations]
      .map((location) => ({
        point: [location.position.latitude, location.position.longitude] as LatLng,
        distance: distanceMeters(userPoint, [
          location.position.latitude,
          location.position.longitude,
        ]),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map((entry) => entry.point);

    return [userPoint, ...nearest];
  }, [locations, userLocation]);

  return (
    <MapContainer
      center={userLocation ? [userLocation.lat, userLocation.lng] : [0, 0]}
      zoom={11}
      style={{ width: "100%", height: "100vh" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {fitPoints.length > 0 && <FitBounds points={fitPoints} />}

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {locations.map((location, index) => (
        <Marker
          key={index}
          position={[location.position.latitude, location.position.longitude]}
          icon={labIcon}
          eventHandlers={{
            click: () => {
              setDestination(location.position);
            },
          }}
        >
          <Popup>{location.labName}</Popup>
        </Marker>
      ))}

      {routePath.length > 0 && (
        <Polyline positions={routePath} pathOptions={{ color: "#2563eb", weight: 4 }} />
      )}

      {destination && (
        <CircleMarker
          center={[destination.latitude, destination.longitude]}
          radius={8}
          pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
};

export default CustomGoogleMap;
