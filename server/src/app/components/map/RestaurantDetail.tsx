'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Star, MapPin, LogIn, Clock, DollarSign } from 'lucide-react';
import { User } from '@supabase/supabase-js';

type GoogleOpeningHours = {
    open_now?: boolean;
    weekday_text?: string[];
};

type Restaurant = {
    id: string;
    name: string;
    createdAt?: string;
    latitude: number;
    longitude: number;
    address: string | null;
    google_place_id?: string;
    google_rating?: number;
    google_ratings_count?: number;
    google_price_level?: number;
    google_opening_hours?: GoogleOpeningHours;
    category?: string;
    hours?: string;
};

type RestaurantData = {
    restaurant: Restaurant;
    averageRating: number | null;
    totalRatings: number;
};

type Props = {
    restaurantId: string;
    onClose: () => void;
};

const cache = new Map<string, { data: RestaurantData; timestamp: number }>();
const CACHE_TIME = 5 * 60 * 1000; // 5 mins

function getCachedData(key: string): RestaurantData | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TIME) {
        return cached.data;
    }
    return null;
}

function setCachedData(key: string, data: RestaurantData): void {
    cache.set(key, { data, timestamp: Date.now() });
}

export default function RestaurantDetail({ restaurantId, onClose }: Props) {
    const [data, setData] = useState<RestaurantData | null>(() => getCachedData(restaurantId));
    const [loading, setLoading] = useState(!getCachedData(restaurantId));
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const supabase = createClient();

    const fetchData = useCallback(async () => {
        const cached = getCachedData(restaurantId);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/restaurants/${restaurantId}`, {
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error('Failed to fetch restaurant data');
            }

            const result: RestaurantData = await response.json();
            setCachedData(restaurantId, result);
            setData(result);
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message);
                console.error('Error fetching restaurant:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => {
        fetchData();

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData, supabase]);

    if (loading) {
        return (
            <div className="absolute top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50 p-6">
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Loading...</div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="absolute top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50 p-6">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-red-400">{error || 'Restaurant not found'}</div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const { restaurant, averageRating, totalRatings } = data;

    return (
      <div className="absolute top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-start justify-between z-10">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1">
                        {restaurant.name}
                    </h2>
                    <div className="flex gap-2 flex-wrap">
                        {restaurant.category && (
                          <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                {restaurant.category}
                            </span>
                        )}  
                    </div>
                    {/* re add price range later */}
                </div>
                <button
                    onClick={onClose}
                    className="ml-4 p-2 hover:bg-gray-700 rounded-lg transition"
                    >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                  {/* Location */}
                  {restaurant.address && (
                      <div>
                          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Location
                          </h3>
                          <p className="text-gray-300">{restaurant.address}</p>
                      </div>
                  )}

                {/* Google Price Level */}
                {restaurant.google_price_level !== undefined && restaurant.google_price_level > 0 && (
                  <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">
                            {'$'.repeat(restaurant.google_price_level)}
                        </span>
                        <span className="text-gray-500 text-sm">
                            (Price level)
                        </span>
                    </div>
                )}

                {/* Description */}
                {restaurant.description && (
                  <div>
                        <h3 className="text-white font-semibold mb-2">About</h3>
                        <p className="text-gray-300">{restaurant.description}</p>
                    </div>
                )}

                {/* Hours */}
                {(restaurant.hours || restaurant.google_opening_hours) && (
                  <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Hours
                            {restaurant.google_opening_hours?.open_now !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                restaurant.google_opening_hours.open_now 
                                ? 'bg-green-600 text-white' 
                                : 'bg-red-600 text-white'
                              }`}>
                                    {restaurant.google_opening_hours.open_now ? 'Open Now' : 'Closed'}
                                </span>
                            )}
                        </h3>
                        {restaurant.google_opening_hours?.weekday_text ? (
                          <div className="space-y-1">
                                {restaurant.google_opening_hours.weekday_text.map((day, index) => (
                                    <p key={index} className="text-gray-300 text-sm">{day}</p>
                                ))}
                            </div>
                        ) : restaurant.hours ? (
                          <p className="text-gray-300">{restaurant.hours}</p>
                        ) : null}
                    </div>
                )}

                {/* Combined Rating Section */}
                {(averageRating !== null || restaurant.google_rating) && (
                    <div className="bg-gray-900 rounded-lg p-4">
                        <h4 className="text-gray-400 text-xs uppercase mb-2">Rating</h4>
                        {(() => {
                            //  combine ratings
                            const communityWeight = totalRatings;
                            const googleWeight = restaurant.google_ratings_count || 0;
                            const totalWeight = communityWeight + googleWeight;
                            
                            let combinedRating: number;
                            let totalReviews: number;
                            
                            if (averageRating !== null && restaurant.google_rating) {
                                // weighted average of both
                                combinedRating = (
                                    (averageRating * communityWeight) + 
                                    (restaurant.google_rating * googleWeight)
                                ) / totalWeight;
                                totalReviews = totalWeight;
                            } else if (averageRating !== null) {
                                combinedRating = averageRating;
                                totalReviews = totalRatings;
                            } else {
                                combinedRating = restaurant.google_rating!;
                                totalReviews = googleWeight;
                            }
                            
                            return (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 ${
                                                    star <= Math.round(combinedRating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-gray-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white font-semibold">
                                        {combinedRating.toFixed(1)}
                                    </span>
                                    <span className="text-gray-400 text-sm">
                                        ({totalReviews.toLocaleString()} {totalReviews === 1 ? 'review' : 'reviews'})
                                    </span>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Rating */}
                <div className="pt-4 border-t border-gray-700">
                    {user ? (
                        <p className="text-gray-400 text-sm text-center">
                            Rating feature coming soon!
                        </p>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-3">
                                Sign in to rate this restaurant
                            </p>
                            <a
                                href="/login"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In to Rate
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
