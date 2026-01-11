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
      
      {/* Debug info */}
      <div className="absolute top-20 left-4 bg-black/80 text-white p-4 rounded z-50 space-y-1 text-sm max-w-xs">
        <div>Restaurants loaded: {spots.length}</div>
        <div>Map ready: {isMapReady ? 'YES ✓' : 'NO ✗'}</div>
        {isMapReady && spots.length > 0 && (
          <div className="mt-2 text-xs">
            <div>First restaurant:</div>
            <div>{spots[0].name}</div>
            <div>Lat: {spots[0].lat}, Lng: {spots[0].lng}</div>
          </div>
        )}
      </div>
      
      {/* Only render markers when map is ready */}
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