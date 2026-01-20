import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import Image from 'next/image';
import ProfileHeader from '../components/ProfileHeader';

type UserRating = {
  id: string;
  score: number;
  review: string | null;
  created_at: string;
  restaurant_id: string;
  restaurant_name: string | null;
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
    .select('username, bio, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  // fetch user's ratings
  const { data: userRatings } = await supabase
    .from('ratings')
    .select(`
      id,
      score,
      review,
      created_at,
      restaurant_id,
      restaurants ( name )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const ratings: UserRating[] = (userRatings || []).map((r: any) => ({
    id: r.id,
    score: r.score,
    review: r.review,
    created_at: r.created_at,
    restaurant_id: r.restaurant_id,
    restaurant_name: r.restaurants?.name || null,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="backdrop-blur-xl bg-gray-900/30 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6 mb-6">
          <ProfileHeader 
          userId={user.id}
          initialUsername={profile?.username || user.email?.split('@')[0] || 'User'}
          initialBio={profile?.bio}
          initialAvatarUrl={profile?.avatar_url}  // ← Add this
        />
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <span className="font-bold text-white text-lg">{ratings.length}</span>
            <span className="text-gray-300 ml-2">Reviews</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
          
          {ratings.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-xl">
              <p className="text-gray-300 mb-4">No reviews yet</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition border border-white/20"
              >
                Explore Restaurants
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratings.slice(0, 4).map((rating) => (
                <div key={rating.id} className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition">
                  <div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-white font-semibold">
                        {profile?.username || 'You'}
                      </span>
                      <span className="text-gray-400">reviewed</span>
                      <span className="text-white font-semibold">
                        {rating.restaurant_name || 'Unknown'}
                      </span>
                      <div className="flex">
                        {[...Array(rating.score)].map((_, i) => (
                          <Star 
                            key={i}
                            className="w-4 h-4 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Placeholder for image */}
                  <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-lg h-32 mb-3 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Photo coming soon</span>
                  </div>

                  {/* Review */}
                  {rating.review && (
                    <p className="text-gray-200 mb-3">{rating.review}</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-gray-400 text-sm border-t border-white/10 pt-3">
                    <span>{getTimeAgo(rating.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>0 likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Food Wishlist */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Food Wishlist</h2>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 text-center text-gray-400">
              Wishlist feature coming soon!
            </div>
          </div>
        </div>

        {/* Campus Favorites */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Campus Favorites</h2>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {ratings.length > 0 ? (
              ratings
                .filter((r) => r.score >= 4)
                .slice(0, 3)
                .map((rating, index) => (
                  <div
                    key={rating.id}
                    className={`p-4 flex items-center justify-between hover:bg-white/5 transition ${
                      index !== 0 ? 'border-t border-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">
                        {rating.restaurant_name || 'Unknown'}
                      </span>
                      <Heart className="w-5 h-5 text-gray-400" />
                    </div>
                    <Link
                      href="/"
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition border border-white/20"
                    >
                      View Review
                    </Link>
                  </div>
                ))
            ) : (
              <div className="p-6 text-center text-gray-400">
                No favorites yet - rate some restaurants!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper function to get time ago string
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'today';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInDays < 60) return '1 month ago';
  return `${Math.floor(diffInDays / 30)} months ago`;
}