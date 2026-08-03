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

// SVG paths for each category — all 24x24 viewBox, stroked icons matching lucide style
const CATEGORY_SVGS: Record<string, { path: string; color: string; bg: string }> = {
    restaurants:          { path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7', color: '#f97316', bg: '#f9731618' },
    cafes:                { path: 'M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v3M10 2v3M14 2v3', color: '#a78bfa', bg: '#a78bfa18' },
    bakery:               { path: 'M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4ZM3 14h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5Zm9-4v4', color: '#fbbf24', bg: '#fbbf2418' },
    studentdiscount:      { path: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5', color: '#38bdf8', bg: '#38bdf818' },
    eastasian:            { path: 'M5 8h14M8 8V5a3 3 0 0 1 8 0v3M5 8l1 12h12L19 8', color: '#f87171', bg: '#f8717118' },
    italian:              { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6c-1.5 0-3 .5-4 1.5S6.5 12 6.5 13.5M12 8c1.5 0 3 .5 4 1.5s1.5 2.5 1.5 4', color: '#fb923c', bg: '#fb923c18' },
    laptopfriendly:       { path: 'M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16', color: '#34d399', bg: '#34d39918' },
    brunch:               { path: 'M3 11l19-9-9 19-2-8-8-2z', color: '#f9a8d4', bg: '#f9a8d418' },
    dessert:              { path: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18', color: '#f472b6', bg: '#f472b618' },
    foodtrucks:           { path: 'M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm13 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', color: '#fb923c', bg: '#fb923c18' },
    halal:                { path: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9ZM12 3a6 6 0 0 0 9 9', color: '#4ade80', bg: '#4ade8018' },
    middleeastern:        { path: 'M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5zm-5 0c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5S11 2.67 11 3.5v5c0 .83-.67 1.5-1.5 1.5zM19 9H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z', color: '#fcd34d', bg: '#fcd34d18' },
    vegetarianoptions:    { path: 'M2 2a26.6 26.6 0 0 1 10 20c.9-6.82 1.91-9.72 5-13M2 2a26.6 26.6 0 0 0 10 20C7.91 14.18 6.9 11.28 5 8', color: '#86efac', bg: '#86efac18' },
    indian:               { path: 'M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01', color: '#fb923c', bg: '#fb923c18' },
    default:              { path: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', color: '#94a3b8', bg: '#94a3b818' },
};

function getCategoryStyle(category?: string) {
    const key = category?.toLowerCase().replace(/\s+/g, '') || 'default';
    return CATEGORY_SVGS[key] || CATEGORY_SVGS.default;
}

function getPrimaryCategory(spot: Props['spot']): string | undefined {
    if (spot.category) return spot.category;
    if (spot.categories && spot.categories.length > 0) return spot.categories[0];
    return undefined;
}

function getPriceDisplay(priceLevel?: number): string {
    if (!priceLevel) return '';
    return '$'.repeat(Math.min(priceLevel, 4));
}

function createSvgIcon(path: string, color: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', color);
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');

    // Support multi-path icons (pipe-separated)
    const paths = path.split('M').filter(Boolean);
    paths.forEach((p) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', `M${p}`);
        svg.appendChild(el);
    });

    return svg;
}

export function Marker({ map, spot }: Props) {
    const setSelectedSpot = useMapStore((state) => state.setSelectedSpot);
    const selectedSpotId = useMapStore((state) => state.selectedSpotId);

    useEffect(() => {
        const primaryCategory = getPrimaryCategory(spot);
        const { path, color, bg } = getCategoryStyle(primaryCategory);
        const priceDisplay = getPriceDisplay(spot.priceLevel);

        // Outer container
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';

        // Label pill
        const label = document.createElement('div');
        label.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 8px;
            padding: 4px 8px;
            margin-bottom: 3px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            white-space: nowrap;
        `;

        // Icon badge
        const iconBadge = document.createElement('div');
        iconBadge.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            background: ${bg};
            flex-shrink: 0;
        `;
        const svgIcon = createSvgIcon(path, color);
        iconBadge.appendChild(svgIcon);
        label.appendChild(iconBadge);

        // Price level
        if (priceDisplay) {
            const priceSpan = document.createElement('span');
            priceSpan.textContent = priceDisplay;
            priceSpan.style.cssText = 'color: #4ade80; font-size: 11px; font-weight: 600; font-family: system-ui, sans-serif; letter-spacing: 0.02em;';
            label.appendChild(priceSpan);
        }

        // Connector dot
        const dot = document.createElement('div');
        dot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${color};
            border: 2px solid rgba(15, 23, 42, 0.9);
            box-shadow: 0 0 0 1.5px ${color}55, 0 2px 6px rgba(0,0,0,0.4);
        `;

        container.appendChild(label);
        container.appendChild(dot);

        // Hover effect
        container.addEventListener('mouseenter', () => {
            label.style.transform = 'scale(1.05) translateY(-1px)';
            label.style.boxShadow = `0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}44`;
        });
        container.addEventListener('mouseleave', () => {
            label.style.transform = '';
            label.style.boxShadow = '0 4px 12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)';
        });

        container.addEventListener('click', () => {
            setSelectedSpot(spot.id);
            map.flyTo({ center: [spot.lng, spot.lat], zoom: 18, speed: 1.2 });
        });

        const marker = new mapboxgl.Marker({ element: container, anchor: 'bottom' })
            .setLngLat([spot.lng, spot.lat])
            .addTo(map);

        return () => {
            marker.remove();
        };
    }, [map, spot, setSelectedSpot, selectedSpotId]);

    return null;
}