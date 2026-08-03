"use client";

import { useEffect, useRef, useMemo, useState } from 'react';
import { useMap } from './useMap';
import { Marker } from './Marker'; 
import SpotDetail from '../SpotDetail';
import { useMapStore, Spot } from '@/stores/mapStore';
import type mapboxgl from 'mapbox-gl';

type Props = {
  spots: Spot[];
};

export default function Map({ spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMap(containerRef);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const { selectedSpotId, setSelectedSpot, activeFilter, filteredSpots } = useMapStore();
  const setFlyTo = useMapStore((state) => state.setFlyTo);

  const displaySpots = useMemo(() => {
    return activeFilter && filteredSpots.length > 0 ? filteredSpots : (activeFilter ? [] : spots);
  }, [activeFilter, filteredSpots, spots]);

  // sync ref to state for safe render
  useEffect(() => {
    if (isMapReady && mapRef.current) {
      setMapInstance(mapRef.current);
      const map = mapRef.current;
      setFlyTo((lng: number, lat: number, zoom?: number) => {
        map.flyTo({ center: [lng, lat], zoom: zoom ?? 18, speed: 1.2 });
      });
    }
    return () => setFlyTo(null);
  }, [isMapReady, mapRef, setFlyTo]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
  
      {isMapReady && mapInstance && displaySpots.map((spot) => (
        <Marker
          key={spot.id}
          map={mapInstance}
          spot={spot}
        />
      ))}

      {selectedSpotId && (
        <SpotDetail
          restaurantId={selectedSpotId}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}