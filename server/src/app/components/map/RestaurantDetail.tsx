'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Star, MapPin, LogIn, Clock, DollarSign } from 'lucide-react';
import { User } from '@supabase/supabase-js';

type Restaurant = {
    id: string;
    name: string;
    openTime: string; 
    closeTime: string; 
    createdAt: string; 
    latitude: number;
    longitude: number;
    address: string | null;
}; 

type Rating = {
    id: string;
    userId: string; 
    restaurantId: string; 
    score: number; 
    createdAt: string; 
};

type Props = {
    restaurantId: string; 
    onClose: () => void;
}

export default function RestaurantDetail({ restaurantId, onClose }: Props) {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [averageRating, setAverageRating] = useState<number | null>(null);
    const [totalRatings, setTotalRatings] = useState(0);
    const [recentRatings, setRecentRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    const supabase = createClient(); 

    useEffect(() => {
    async function fetchRestaurantDetails() {
      setLoading(true);
      
      // check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);

      // fetch all ratings for average
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('rating')
        .eq('restaurant_id', restaurantId);

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
      } else if (ratingsData && ratingsData.length > 0) {
        const avg = ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length;
        setAverageRating(avg);
        setTotalRatings(ratingsData.length);
      }

      // fetch recent ratings with user info
      const { data: recentRatingsData, error: recentError } = await supabase
        .from('ratings')
        .select(`
          id,
          rating,
          created_at,
          user_id,
          profiles (
            username
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Error fetching recent ratings:', recentError);
      } else {
        setRecentRatings(recentRatingsData || []);
      }

      setLoading(false);
    }

    fetchRestaurantDetails();
  }, [restaurantId, supabase]);

  if (loading) {
    return (
      <div className="absolute top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

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
            {restaurant.price_range && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                <DollarSign className="w-3 h-3" />
                {restaurant.price_range}
              </span>
            )}
          </div>
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
        {/* Rating Section */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {averageRating !== null ? (
              <>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-400 text-sm">
                  ({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})
                </span>
              </>
            ) : (
              <span className="text-gray-400">No ratings yet</span>
            )}
          </div>
        </div>

        {/* Description */}
        {restaurant.description && (
          <div>
            <h3 className="text-white font-semibold mb-2">About</h3>
            <p className="text-gray-300">{restaurant.description}</p>
          </div>
        )}

        {/* Hours */}
        {restaurant.hours && (
          <div>
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Hours
            </h3>
            <p className="text-gray-300">{restaurant.hours}</p>
          </div>
        )}

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

        {/* Recent Reviews */}
        {recentRatings.length > 0 && (
          <div>
            <h3 className="text-white font-semibold mb-3">Recent Reviews</h3>
            <div className="space-y-3">
              {recentRatings.map((rating) => (
                <div key={rating.id} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-xs">
                      by {rating.profiles?.username || 'Anonymous'}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-gray-300 text-sm">{rating.comment}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
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