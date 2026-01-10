import { create } from 'zustand'

export type Spot = {
    id: string;
    name: string;
    lat: number;
    lng: number; 
    category: string;
};

type MapState = {
    selectedSpotId: string | null;
    setSelectedSpot: (id: string | null) => void;
};

export const useMapStore = create<MapState>((set) => ({
    selectedSpotId: null,
    setSelectedSpot: (id) => set({ selectedSpotId: id }),
}));
