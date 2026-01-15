import { NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';

type GoogleOpeningHours = {
    open_now?: boolean;
    weekday_text?: string[];
};

type RestaurantData = {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    created_at: string;
    address: string | null;
    google_place_id?: string;
    google_rating?: number;
    google_ratings_count?: number;
    google_price_level?: number;
    google_opening_hours?: GoogleOpeningHours;
    google_photo_reference?: string;
    google_last_synced_at?: string;
};

type RatingWithProfile = {
    id: string;
    score: number;
    created_at: string;
    user_id: string;
    restaurant_id: string;
};

type Category = {
    id: string;
    slug: string;
    name: string;
};

// cache data for 1 hour
const getCachedGooglePlacesData = unstable_cache(
    async (placeId: string) => {
        const googlePlacesApi = process.env.NEXT_PUBLIC_GOOGLE_PLACES;

        try {
            const googleResponse = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,rating,user_ratings_total,price_level,photos&key=${googlePlacesApi}`,
                { next: { revalidate: 3600 } }
            );

            const googleData = await googleResponse.json();

            if (googleData.status !== 'OK') {
                console.error('Google Places API error:', googleData.status, googleData.error_message);
                return null;
            }

            // very first photo ref
            const photoReference = googleData.result.photos?.[0]?.photo_reference;

            return {
                google_rating: googleData.result.rating,
                google_ratings_count: googleData.result.user_ratings_total,
                google_price_level: googleData.result.price_level,
                google_opening_hours: googleData.result.opening_hours,
                google_photo_reference: photoReference,
            };
        } catch (error) {
            console.error('Error fetching from Google Places API:', error);
            return null;
        }
    },
    ['google-places'],
    { 
        revalidate: 3600,
        tags: ['google-places']
    }
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: restaurantId } = await params;

    if (!restaurantId) {
        return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const [restaurantResult, ratingsResult, categoriesResult] = await Promise.all([
        supabase
            .from('restaurants')
            .select('*')
            .eq('id', restaurantId)
            .single(),
        supabase
            .from('ratings')
            .select('score')
            .eq('restaurant_id', restaurantId),
        supabase
            .from('restaurant_categories')
            .select('*')
            .eq('restaurant_id', restaurantId)
    ]);

    let categories: Category[] = [];
    if (categoriesResult.data && categoriesResult.data.length > 0) {
        const categoryIds = categoriesResult.data.map((rc: { category_id: string }) => rc.category_id);
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('id, slug, name')
            .in('id', categoryIds);
        
        categories = categoriesData ?? [];
        console.log('Fetched categories:', categories);
    }

    if (restaurantResult.error) {
        console.error('Error fetching restaurant:', restaurantResult.error);
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const restaurant: RestaurantData = restaurantResult.data;
    
    // average rating
    let averageRating: number | null = null;
    let totalRatings = 0;
    if (ratingsResult.data && ratingsResult.data.length > 0) {
        averageRating = ratingsResult.data.reduce((sum, r) => sum + r.score, 0) / ratingsResult.data.length;
        totalRatings = ratingsResult.data.length;
    }

    let googleData: Partial<RestaurantData> | null = null;
    if (restaurant.google_place_id) {
        const dayOld = !restaurant.google_last_synced_at || 
            Date.now() - new Date(restaurant.google_last_synced_at).getTime() > 24 * 60 * 60 * 1000;
        
        if (dayOld) {
            googleData = await getCachedGooglePlacesData(restaurant.google_place_id);
            
            if (googleData) {
                await supabase
                    .from('restaurants')
                    .update({
                        ...googleData,
                        google_last_synced_at: new Date().toISOString(),
                    })
                    .eq('id', restaurantId);
            }
        }
    }

    const responseData = {
        restaurant: googleData ? { ...restaurant, ...googleData } : restaurant,
        categories,
        averageRating,
        totalRatings,
    };

    return NextResponse.json(responseData, {
        headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        }
    });
}
