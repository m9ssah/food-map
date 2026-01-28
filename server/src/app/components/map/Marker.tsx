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
        category?: string;
        categories?: string[];
        priceLevel?: number;
    };
};

// helper function to get category icon
function getCategoryIcon(category?: string): string {
    const icons: Record<string, string> = {
        restaurants: '🍴',
        cafes: '☕',
        bakery: '☕',
        studentdiscount: '🎓',
        eastasian: '🥢',
        italian: '🍕',
        laptopfriendly: '💻',
        brunch: '🍔',
        dessert: '🍰',
        foodtruck: '🚚',
        halal: '🕌',
        middleeastern: '🕌',
        vegetarianoptions: '🥗',
        indian: '🍛',
        default: '📍'
    };
    
    const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '') || 'default';
    return icons[normalizedCategory] || icons[category?.toLowerCase() || 'default'] || icons.default;
}

// helper function to get primary category from spot
function getPrimaryCategory(spot: Props['spot']): string | undefined {
    if (spot.category) return spot.category;
    
    if (spot.categories && spot.categories.length > 0) {
        return spot.categories[0];
    }
    
    return undefined;
}

// helper function to get price level display
function getPriceDisplay(priceLevel?: number): string {
    if (!priceLevel) return '';
    return '$'.repeat(Math.min(priceLevel, 4));
}

export function Marker({ map, spot }: Props) {
    const setSelectedSpot = useMapStore((state) => state.setSelectedSpot);

    useEffect(() => {
        const primaryCategory = getPrimaryCategory(spot);
        console.log('Creating marker for:', spot.name, 'at', spot.lat, spot.lng);
        console.log('Primary category:', primaryCategory);
        
        // create container for marker and label
        const container = document.createElement('div');
        container.className = 'flex flex-col items-center cursor-pointer';
        
        // create label
        const label = document.createElement('div');
        label.className = 'backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl text-white px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap mb-1 flex items-center gap-2';
        label.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        
        // add category icon
        const icon = getCategoryIcon(primaryCategory);
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        label.appendChild(iconSpan);
        
        // add price level if available
        const priceDisplay = getPriceDisplay(spot.priceLevel);
        if (priceDisplay) {
            const priceSpan = document.createElement('span');
            priceSpan.textContent = priceDisplay;
            priceSpan.className = 'text-green-400';
            label.appendChild(priceSpan);
        }
        
        // create marker dot
        const dot = document.createElement('div');
        dot.className = "w-6 h-6 rounded-full bg-red-500 border-2 border-white";
        dot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        
        // append elements
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