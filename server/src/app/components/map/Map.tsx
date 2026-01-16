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
  const { mapRef, isMapReady } = useMap(containerRef);

  const { selectedSpotId, setSelectedSpot, activeFilter, filteredSpots } = useMapStore();

  const displaySpots = activeFilter && filteredSpots.length > 0 ? filteredSpots : (activeFilter ? [] : spots);

  useEffect(() => {
    console.log('Map ready state changed:', isMapReady);
    if (isMapReady && displaySpots.length > 0) {
      console.log('Creating markers for', displaySpots.length, 'spots');
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
        <RestaurantDetail
          restaurantId={selectedSpotId}
          onClose={() => setSelectedSpot(null)}
        />
      )}
    </div>
  );
}