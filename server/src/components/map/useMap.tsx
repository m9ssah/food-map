"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const DEFAULT_CENTER = [-79.395314, 43.661582];
  const DEFAULT_ZOOM = 17.94;

  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;  //  init map once

    try {
      mapRef.current = new mapboxgl.Map({
        style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL!,
        container: containerRef.current,
        center: [-79.395314, 43.661582],    // [lng, lat] (kings college circle)
        zoom: DEFAULT_ZOOM,
        pitch: 60,
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

