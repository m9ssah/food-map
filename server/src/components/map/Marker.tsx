import mapboxgl from 'mapbox-gl';
import { useEffect } from 'react';
import {  useMapStore } from '../../stores/mapStore';

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
        const el = document.createElement('div');
        el.className = "w-3 h-3 rounded-full bg-red-500 cursor-pointer";    // TODO: change

        el.addEventListener('click', () => {
            setSelectedSpot(spot.id);
            map.flyTo({ center: [spot.lng, spot.lat], zoom: 18 });
        });

        const marker = new mapboxgl.Marker(el)
            .setLngLat([spot.lng, spot.lat])
            .addTo(map);
        
        return () => {
            marker.remove();
        };
    }, [map, spot, setSelectedSpot]);

    return null;
}