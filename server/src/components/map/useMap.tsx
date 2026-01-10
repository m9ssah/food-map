"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const DEFAULT_CENTER: [number, number] = [-79.395532, 43.662781];
  const DEFAULT_ZOOM = 17.85;
  const DEFAULT_PITCH = 81.08;
  const DEFAULT_BEARING = 139.20;

  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;  //  init map once
    
    try {
      mapRef.current = new mapboxgl.Map({
        style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL!,
        container: containerRef.current,
        center: DEFAULT_CENTER,    // [lng, lat] (kings college circle)
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
      });

      mapRef.current.on('load', () => {
        console.log('Map loaded successfully');
      });

      mapRef.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      mapRef.current.addControl(
        new mapboxgl.NavigationControl(),
        "bottom-right"
      );
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [containerRef]);

  return mapRef;
};
