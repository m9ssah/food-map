import mapboxgl from 'mapbox-gl';
import { useEffect } from 'react';
import { useMapStore } from '@/stores/mapStore';

type Props = {
    map: mapboxgl.Map;
    spot: {
        id: string;
        lat: number;
        lng: number;
        name: string;
    };
};

export function Marker({ map, spot }: Props) {
    const setSelectedSpot = useMapStore((state) => state.setSelectedSpot);

    useEffect(() => {
        console.log('Creating marker for:', spot.name, 'at', spot.lat, spot.lng);
        
        const el = document.createElement('div');
        el.className = "w-6 h-6 rounded-full bg-red-500 cursor-pointer border-2 border-white";  // Made bigger and added border
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';  // Add shadow

        el.addEventListener('click', () => {
            console.log('Marker clicked:', spot.name);
            setSelectedSpot(spot.id);
            map.flyTo({ center: [spot.lng, spot.lat], zoom: 18 });
        });

        const marker = new mapboxgl.Marker(el)
            .setLngLat([spot.lng, spot.lat])
            .addTo(map);
        
        console.log('Marker added to map for:', spot.name);
        
        return () => {
            console.log('Removing marker for:', spot.name);
            marker.remove();
        };
    }, [map, spot, setSelectedSpot]);

    return null;
}