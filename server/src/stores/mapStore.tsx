import { create } from 'zustand'

export type Spot = {
    id: string;
    name: string;
    lat: number;
    lng: number; 
    categories?: string[];
};

type MapState = {
    selectedSpotId: string | null;
    setSelectedSpot: (id: string | null) => void;
    activeFilter: string | null;
    setActiveFilter: (filter: string | null) => void;
    filteredSpots: Spot[];
    setFilteredSpots: (spots: Spot[]) => void;
};

export const useMapStore = create<MapState>((set) => ({
    selectedSpotId: null,
    setSelectedSpot: (id) => set({ selectedSpotId: id }),
    activeFilter: null,
    setActiveFilter: (filter) => set({ activeFilter: filter }),
    filteredSpots: [],
    setFilteredSpots: (spots) => set({ filteredSpots: spots }),
}));
