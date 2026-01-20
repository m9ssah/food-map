'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Star, MapPin, LogIn, Clock, MessageSquare } from 'lucide-react';
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

type Review = {
    id: string;
    score: number;
    review: string | null;
    created_at: string;
    user_id: string;
    username: string | null;
};

type RestaurantData = {
    restaurant: Restaurant;
    categories?: Category[];
    averageRating: number | null;
    totalRatings: number;
    reviews?: Review[];
};

type Props = {
    restaurantId: string;
    onClose: () => void;
};

const cache = new Map<string, { data: RestaurantData; timestamp: number }>();
const CACHE_TIME = 5 * 60 * 1000; // 5 mins

const userRatingCache = new Map<string, { rating: number; review: string; ratingId: string | null }>();

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
    const [userRating, setUserRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>('');
    const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    
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

    const fetchUserRating = useCallback(async (userId: string) => {
        const cacheKey = `${userId}-${restaurantId}`;
        const cachedRating = userRatingCache.get(cacheKey);
        if (cachedRating) {
            setUserRating(cachedRating.rating);
            setReviewText(cachedRating.review);
            setExistingRatingId(cachedRating.ratingId);
            return;
        }

        try {
            const { data: ratingData, error } = await supabase
                .from('ratings')
                .select('id, score, review')
                .eq('user_id', userId)
                .eq('restaurant_id', restaurantId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user rating:', error);
                return;
            }

            if (ratingData) {
                setUserRating(ratingData.score);
                setReviewText(ratingData.review || '');
                setExistingRatingId(ratingData.id);
                // cache the rating
                userRatingCache.set(cacheKey, {
                    rating: ratingData.score,
                    review: ratingData.review || '',
                    ratingId: ratingData.id
                });
            }
        } catch (err) {
            console.error('Error fetching user rating:', err);
        }
    }, [restaurantId, supabase]);

    // reset rating state when restaurant changes
    useEffect(() => {
        setUserRating(0);
        setReviewText('');
        setExistingRatingId(null);
        setSubmitSuccess(false);
    }, [restaurantId]);

    useEffect(() => {
        fetchData();

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            if (user) {
                fetchUserRating(user.id);
            }
        });

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData, fetchUserRating, supabase]);

    // save ratings
    const handleSubmitRating = async () => {
        if (!user || userRating === 0) return;

        setIsSubmitting(true);
        setSubmitSuccess(false);

        try {
            const ratingData = {
                user_id: user.id,
                restaurant_id: restaurantId,
                score: userRating,
                review: reviewText.trim() || null,
            };

            let result;
            if (existingRatingId) {
                result = await supabase
                    .from('ratings')
                    .update({ score: userRating, review: reviewText.trim() || null })
                    .eq('id', existingRatingId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('ratings')
                    .insert(ratingData)
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('Error saving rating:', result.error);
                return;
            }

            const cacheKey = `${user.id}-${restaurantId}`;
            userRatingCache.set(cacheKey, {
                rating: userRating,
                review: reviewText,
                ratingId: result.data.id
            });
            setExistingRatingId(result.data.id);
            setSubmitSuccess(true);

            // invalidate restaurant data cache to refresh ratings
            cache.delete(restaurantId);
            fetchData();

            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error('Error submitting rating:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="absolute top-4 right-4 bottom-4 !w-[500px] min-w-[500px] backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl z-50 p-8 rounded-2xl">
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-400">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="absolute top-4 right-4 bottom-4 !w-[500px] min-w-[500px] backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl z-50 p-8 rounded-2xl">
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
            <div className="absolute top-4 right-4 bottom-4 !w-[500px] min-w-[500px] backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl z-50 p-8 rounded-2xl">
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

    const { restaurant, categories = [], averageRating, totalRatings, reviews = [] } = data;

    const photoUrl = restaurant.google_photo_reference ? `/api/google/photo?reference=${encodeURIComponent(restaurant.google_photo_reference)}&maxwidth=800&maxheight=800` : null;

    return (
      <div className="absolute top-4 right-4 bottom-4 !w-[500px] min-w-[500px] backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl z-50 overflow-y-auto rounded-2xl">
            {/* Photo */}
            {photoUrl && (
                <div className="px-2 pt-2">
                    <div className="relative w-full h-64 overflow-hidden rounded-xl">
                        <img 
                            src={photoUrl} 
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-gray-700 rounded-lg transition"
                        >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className={`${photoUrl} p-4 flex items-start justify-between z-10`}>
                <div>
                    <h2 className="text-4xl font-bold text-white mb-1">
                        {restaurant.name}
                    </h2>
                    {/* TODO re add price range later */}
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
                                className="inline-block px-3 py-1.5 bg-white/10 text-white text rounded-full border border-white/10"
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

                {/* Description
                {restaurant.description && (
                  <div>
                        <h3 className="text-white font-semibold mb-2">About</h3>
                        <p className="text-gray-300">{restaurant.description}</p>
                    </div>
                )} */}

                {/* Hours */}
                {(restaurant.hours || restaurant.google_opening_hours) && (
                  <div>
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Hours
                            {restaurant.google_opening_hours?.open_now !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded-full justify-center ${
                                restaurant.google_opening_hours.open_now 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-600 text-white'
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


                {/* Reviews */}
                <div className="pt-4 border-t border-white/10">
                    {user ? (
                      <div className="text-white text-center">
                            <div className="text-2xl font-semibold mb-2 gap-4 flex items-center">
                                Your Rating
                                {existingRatingId && (
                                    <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded-full">
                                        Saved
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setUserRating(star)}
                                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                                    >
                                        <Star
                                            className={`w-13 h-13 ${star <= (userRating || 0)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-white/70 hover:text-white'}`} />
                                    </button>
                                ))}
                            </div>
                            <div className="text-gray-500 mt-2">
                                {userRating > 0 ? '' : "Select a rating"}
                            </div>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                placeholder="Share your experience..."
                                rows={3}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all mt-3"
                            />
                            <button
                                onClick={handleSubmitRating}
                                disabled={userRating === 0 || isSubmitting}
                                className={`w-full py-2.5 rounded-xl font-medium transition-all mt-3 ${
                                    userRating > 0 && !isSubmitting
                                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                                }`}
                            >
                                {isSubmitting 
                                    ? 'Saving...' 
                                    : submitSuccess 
                                        ? '✓ Saved!' 
                                        : existingRatingId 
                                            ? 'Update Review' 
                                            : 'Post Review'}
                            </button>
                        </div>
                    ) : (
                        /* Logged Out State */
                        <div className="flex flex-col items-center justify-center py-4 gap-3 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-gray-400 text-sm">Sign in to leave a review</p>
                            <a
                                href="/login"
                                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </a>
                        </div>
                    )}
                </div>

                {/* Reviews wall */}
                {reviews.length > 0 && (
                    <div className="pt-4 border-t border-white/10 pb-6">
                        <h3 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            Reviews ({reviews.length})
                        </h3>
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div 
                                    key={review.id} 
                                    className={`bg-white/5 rounded-xl p-4 border ${
                                        user && review.user_id === user.id 
                                            ? 'border-blue-500/30' 
                                            : 'border-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-white font-medium">
                                                {review.username || 'Anonymous'}
                                                {user && review.user_id === user.id && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${
                                                        star <= review.score
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-white/70'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.review && (
                                        <p className="text-gray-300 text-sm mb-2">{review.review}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
      </div>);
}
