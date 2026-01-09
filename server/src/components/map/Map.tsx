"use client";

import { useEffect, useRef } from 'react';
import { useMap } from './useMap';
import { Marker } from './Marker'; 
import { Spot } from '../../stores/mapStore';

type Props = {
  spots: Spot[];
};

export default function Map({ spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useMap(containerRef);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0" />
      {mapRef.current  &&
        spots.map((spot) => (
          <Marker
            key={spot.id}
            map={mapRef.current!}
            spot={spot}
          />
        ))}
    </div>
  );
}