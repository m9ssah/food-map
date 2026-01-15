'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Star, MapPin, LogIn, Clock } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Inter } from 'next/font/google';

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
    google_photo_reference?: string;
    hours?: string;
};

type Category = {
    id: string;
    slug: string;
    name: string;
};

type RestaurantData = {
    restaurant: Restaurant;
    categories?: Category[];
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
            <div className="absolute top-4 right-4 bottom-4 w-96 backdrop-blur-xl bg-gray-900/30 border border-white/10 shadow-2xl z-50 p-6 rounded-2xl">
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute top-4 right-4 bottom-4 w-96 backdrop-blur-xl bg-gray-900/30 border border-white/10 shadow-2xl z-50 p-6 rounded-2xl">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-red-400">{error || 'Restaurant not found'}</div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="absolute top-4 right-4 bottom-4 w-96 backdrop-blur-xl bg-gray-900/30 border border-white/10 shadow-2xl z-50 p-6 rounded-2xl">
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-white">{error || 'Loading Restaurant'}</div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    const { restaurant, categories = [], averageRating, totalRatings } = data;

    const photoUrl = restaurant.google_photo_reference 
        ? `/api/google/photo?reference=${encodeURIComponent(restaurant.google_photo_reference)}&maxwidth=400`
        : null;

    return (
      <div className="absolute top-4 right-4 bottom-4 w-96 backdrop-blur-xl bg-gray-900/30 border border-white/10 shadow-2xl z-50 overflow-y-auto rounded-2xl">
            {/* Photo */}
            {photoUrl && (
                <div className="px-4 pt-4">
                    <div className="relative w-full h-64 overflow-hidden rounded-xl">
                        <img 
                            src={photoUrl} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-gray-900/30 hover:bg-gray-700 rounded-lg transition"
                        >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className={`${photoUrl} p-4 flex items-start justify-between z-10`}>
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {restaurant.name}
                    </h2>
                    {/* re add price range later */}
                </div>
                {!photoUrl && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}
            </div>
            
            {/* Content */}
            <div className="px-5 space-y-6">
                  {/* Combined Rating Section */}
                  {(averageRating !== null || restaurant.google_rating) && (
                      <div>
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
                                  <div className="flex items-center justify-start gap-5">
                                      <div className="flex items-center gap-2">
                                          <span className="text-white text-xl font-bold">
                                              {combinedRating.toFixed(1)}
                                          </span>
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
                                      </div>
                                      {restaurant.google_price_level !== undefined && restaurant.google_price_level > 0 && (
                                          <span className="text-gray-300 text-xl">
                                              {'$'.repeat(restaurant.google_price_level)}
                                          </span>
                                      )}
                                  </div>
                              );
                          })()}
                      </div>
                  )}
                  {/* Categories */}
                    <div className="flex gap-2 flex-wrap">
                        {categories && categories.length > 0 && categories.map((category) => (
                            <span 
                                key={category.id}
                                className="inline-block px-3 py-1.5 bg-white/10 text-white text rounded-l border border-white/10"
                            >
                                {category.name}
                            </span>
                        ))}
                    </div>
                  {/* Location */}
                  {restaurant.address && (
                    <div>
                          <h3 className="text-white text-xl font-semibold mb-2 flex items-center gap-4">
                              <MapPin className="w-5 h-5" />
                              Location
                          </h3>
                          <p className="ml-1 text-gray-300 text-l">{restaurant.address}</p>
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


                {/* Rating */}
                <div className="pt-4 border-t border-white/10">
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
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
