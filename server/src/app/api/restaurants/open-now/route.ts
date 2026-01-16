import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

type RestaurantWithPlaceId = {
    id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    google_place_id: string;
    google_rating: number | null;
    google_ratings_count: number | null;
};

export async function GET() {
    const supabase = await createClient();
    const googlePlacesApi = process.env.NEXT_PUBLIC_GOOGLE_PLACES;

    const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('id, name, address, latitude, longitude, google_place_id, google_rating, google_ratings_count')
        .not('google_place_id', 'is', null);

    if (error) {
        console.error('Error fetching restaurants:', error);
        return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
    }

    if (!restaurants || restaurants.length === 0) {
        return NextResponse.json({ restaurants: [] });
    }

    const openRestaurants: RestaurantWithPlaceId[] = [];

    const batchSize = 10;
    for (let i = 0; i < restaurants.length; i += batchSize) {
        const batch = restaurants.slice(i, i + batchSize);
        
        const results = await Promise.all(
            batch.map(async (restaurant) => {
                if (!restaurant.google_place_id) return null;

                try {
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${restaurant.google_place_id}&fields=opening_hours&key=${googlePlacesApi}`
                    );
                    const data = await response.json();

                    if (data.status === 'OK' && data.result?.opening_hours?.open_now) {
                        return restaurant as RestaurantWithPlaceId;
                    }
                    return null;
                } catch (err) {
                    console.error(`Error checking open status for ${restaurant.name}:`, err);
                    return null;
                }
            })
        );

        openRestaurants.push(...results.filter((r): r is RestaurantWithPlaceId => r !== null));
    }

    return NextResponse.json({ restaurants: openRestaurants });
}
