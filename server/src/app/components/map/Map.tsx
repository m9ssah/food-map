"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from './useMap';
import { Marker } from './Marker'; 
import SpotDetail from '../SpotDetail';
import { useMapStore, Spot } from '@/stores/mapStore';

type Props = {
  spots: Spot[];
};

export default function Map({ spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMap(containerRef);

  const { selectedSpotId, setSelectedSpot, activeFilter, filteredSpots } = useMapStore();
  const setFlyTo = useMapStore((state) => state.setFlyTo);

  const displaySpots = activeFilter && filteredSpots.length > 0 ? filteredSpots : (activeFilter ? [] : spots);

  useEffect(() => {
    if (isMapReady && mapRef.current) {
      const map = mapRef.current;
      setFlyTo((lng: number, lat: number, zoom?: number) => {
        map.flyTo({ center: [lng, lat], zoom: zoom ?? 18, speed: 1.2 });
      });
    }
    return () => setFlyTo(null); // cleanup on unmount
  }, [isMapReady, mapRef, setFlyTo]);

  useEffect(() => {
    if (isMapReady && displaySpots.length > 0) {
      // makers ready
    }
  }, [isMapReady, displaySpots]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
  
      {isMapReady && mapRef.current && displaySpots.map((spot) => (
        <Marker
          key={spot.id}
          map={mapRef.current!}
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