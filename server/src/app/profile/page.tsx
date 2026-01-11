import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Star, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';

type UserRating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurants: {
    id: string;
    name: string;
    category: string | null;
  } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, created_at')
    .eq('id', user.id)
    .single();

  // fetch user's ratings
  const { data: userRatings } = await supabase
    .from('ratings')
    .select(`
      id,
      rating,
      comment,
      created_at,
      restaurants (
        id,
        name,
        category
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const ratings = (userRatings || []) as UserRating[];

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Map
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {profile?.username || 'Anonymous User'}
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {profile?.bio && (
            <p className="text-gray-300 mb-4">{profile.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-white">{ratings.length}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-white">
                  {averageRating > 0 ? averageRating.toFixed(1) : '--'}
                </p>
                {averageRating > 0 && (
                  <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User's Ratings */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Your Reviews</h2>
          
          {ratings.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">You haven't reviewed any restaurants yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Explore Restaurants
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {rating.restaurants?.name || 'Unknown Restaurant'}
                      </h3>
                      {rating.restaurants?.category && (
                        <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs rounded-full mt-1">
                          {rating.restaurants.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= rating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {rating.comment && (
                    <p className="text-gray-300 mb-2">{rating.comment}</p>
                  )}
                  
                  <p className="text-gray-500 text-sm">
                    {new Date(rating.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}