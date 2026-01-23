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

        // container for marker and label
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center cursor-pointer';

        // label
        const label = document.createElement('div');
        label.className = 'bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap mb-1';
        label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        label.textContent = spot.name;

        // marker dot
        const dot = document.createElement('div');
        dot.className = "w-6 h-6 rounded-full bg-red-500 cursor-pointer border-2 border-white";
        dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

        container.appendChild(label);
        container.appendChild(dot);

        container.addEventListener('click', () => {
            console.log('Marker clicked:', spot.name);
            setSelectedSpot(spot.id);
            map.flyTo({ center: [spot.lng, spot.lat], zoom: 18 });
        });

        const marker = new mapboxgl.Marker(container)
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