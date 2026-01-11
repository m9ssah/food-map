"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from './useMap';
import { Marker } from './Marker'; 
import RestaurantDetail from './RestaurantDetail';
import { useMapStore, Spot } from '@/stores/mapStore';

type Props = {
  spots: Spot[];
};

export default function Map({ spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMap(containerRef); // ← Updated

  const { selectedSpotId, setSelectedSpot } = useMapStore();

  useEffect(() => {
    console.log('Map ready state changed:', isMapReady);
    if (isMapReady && spots.length > 0) {
      console.log('Creating markers for', spots.length, 'spots');
    }
  }, [isMapReady, spots]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
  
      {isMapReady && mapRef.current && spots.map((spot) => (
        <Marker
          key={spot.id}
          map={mapRef.current!}
          spot={spot}
        />
      ))}

      {selectedSpotId && (
        <RestaurantDetail
          restaurantId={selectedSpotId}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}