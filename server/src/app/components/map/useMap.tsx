"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const DEFAULT_CENTER: [number, number] = [-79.397617, 43.662455];
  const DEFAULT_ZOOM: number = 15.42;

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false); 

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      mapRef.current = new mapboxgl.Map({
        style: process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL!,
        container: containerRef.current,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
      });

      mapRef.current.on('load', () => {
        console.log('Map loaded successfully');
        setIsMapReady(true); 
      });

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            mapRef.current?.flyTo({
              center: [longitude, latitude],
              zoom: DEFAULT_ZOOM * 1.2,
              speed: 1.2,
            });
            },
            (err) => {
              console.warn('Geolocation denied or failed, using default location', err);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
      }

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

  return { mapRef, isMapReady }; 
}