import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

const getCachedGooglePlacesData = unstable_cache(
    async (placeId: string) => {
        const googlePlacesApi = process.env.NEXT_PUBLIC_GOOGLE_PLACES;

        const googleResponse = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,rating,user_ratings_total,price_level&key=${googlePlacesApi}`,
            { 
                next: { revalidate: 3600 }
            }
        );

        const googleData = await googleResponse.json();

        if (googleData.status !== 'OK') {
            console.error('Google Places API error:', googleData.status, googleData.error_message);
            return null;
        }

        return {
            google_rating: googleData.result.rating,
            google_ratings_count: googleData.result.user_ratings_total,
            google_price_level: googleData.result.price_level,
            google_opening_hours: googleData.result.opening_hours,
        };
    },
    ['google-places'],
    { 
        revalidate: 3600,
        tags: ['google-places']
    }
);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get('place_id');

    if (!placeId) {
        return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: restaurantData, error: dbError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('google_place_id', placeId)
        .single();

    const dayOld = 
        restaurantData?.google_last_synced_at && 
        Date.now() - new Date(restaurantData.google_last_synced_at).getTime() < 24 * 60 * 60 * 1000;

    if (dayOld) {
        // Return cached data from database
        return NextResponse.json(restaurantData, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        });
    }

    const googleData = await getCachedGooglePlacesData(placeId);

    if (!googleData) {
        // return exisitng data if api call fails
        if (restaurantData) {
            return NextResponse.json(restaurantData);
        }
        return NextResponse.json({ error: 'Failed to fetch from Google Places API' }, { status: 500 });
    }

    const updates = {
        ...googleData,
        google_last_synced_at: new Date().toISOString(),
    };

    if (restaurantData) {
        await supabase
            .from('restaurants')
            .update(updates)
            .eq('google_place_id', placeId);
    }

    return NextResponse.json(
        { ...restaurantData, ...updates },
        {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        }
    );
}
