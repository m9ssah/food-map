import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Heart, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';
import ProfileHeader from '../components/ProfileHeader';
import DeleteBlendButton from '../components/DeleteBlendButton';

type UserRating = {
  id: string;
  score: number;
  review: string | null;
  created_at: string;
  restaurant_id: string;
  restaurant_name: string | null;
};

type Blend = {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  invite_code: string;
};

type Favorite = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  created_at: string;
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

  const ratings: UserRating[] = (userRatings || []).map((r: { id: string; score: number; review: string | null; created_at: string; restaurant_id: string; restaurants: { name: string } | null }) => ({
    id: r.id,
    score: r.score,
    review: r.review,
    created_at: r.created_at,
    restaurant_id: r.restaurant_id,
    restaurant_name: r.restaurants?.name || null,
  }));

  // fetch user's favorites
  const { data: userFavorites } = await supabase
    .from('user_favorites')
    .select(`
      id,
      restaurant_id,
      created_at,
      restaurants ( name )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const favorites: Favorite[] = (userFavorites || []).map((f: { id: string; restaurant_id: string; created_at: string; restaurants: { name: string } | null }) => ({
    id: f.id,
    restaurant_id: f.restaurant_id,
    restaurant_name: f.restaurants?.name || 'Unknown',
    created_at: f.created_at,
  }));

  // fetch user's blends
  const { data: userBlends } = await supabase
    .from('blend_members')
    .select(`
      blends (
        id,
        name,
        created_at,
        invite_code,
        blend_members ( count )
      )
    `)
    .eq('user_id', user.id);

  const blends: Blend[] = (userBlends || []).map((b: { blends: { id: string; name: string; created_at: string; invite_code: string; blend_members: { count: number }[] } }) => ({
    id: b.blends.id,
    name: b.blends.name,
    created_at: b.blends.created_at,
    invite_code: b.blends.invite_code,
    member_count: b.blends.blend_members?.length || 0,
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
            initialAvatarUrl={profile?.avatar_url}  
          />
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-8 flex-wrap">
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <span className="font-bold text-white text-lg">{ratings.length}</span>
            <span className="text-gray-300 ml-2">Reviews</span>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <span className="font-bold text-white text-lg">{favorites.length}</span>
            <span className="text-gray-300 ml-2">Favorites</span>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-full px-6 py-3 shadow-lg">
            <span className="font-bold text-white text-lg">{blends.length}</span>
            <span className="text-gray-300 ml-2">Blends</span>
          </div>
        </div>

        {/* Blends Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">My Blends</h2>
            <Link
              href="/blends/new"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Blend
            </Link>
          </div>
          
          {blends.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-xl">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300 mb-4">No blends yet</p>
              <p className="text-gray-400 text-sm mb-4">
                Create a blend to find restaurants you and your friends both want to try!
              </p>
              <Link
                href="/blends/new"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition"
              >
                <Plus className="w-4 h-4" />
                Create Your First Blend
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {blends.map((blend) => (
                <div
                  key={blend.id}
                  className="backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-4 shadow-xl hover:bg-white/15 transition"
                >
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/blends/${blend.id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{blend.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {blend.member_count} member{blend.member_count !== 1 ? 's' : ''} • Code: {blend.invite_code}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">
                          Created {getTimeAgo(blend.created_at)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <DeleteBlendButton 
                        blendId={blend.id} 
                        blendName={blend.name}
                      />

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Food Wishlist (Favorites) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Food Wishlist</h2>
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {favorites.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="mb-2">No favorites yet</p>
                <p className="text-sm">
                  Tap the heart icon on restaurants to add them to your wishlist
                </p>
              </div>
            ) : (
              favorites.slice(0, 5).map((favorite, index) => (
                <div
                  key={favorite.id}
                  className={`p-4 flex items-center justify-between hover:bg-white/5 transition ${
                    index !== 0 ? 'border-t border-white/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-400 fill-current" />
                    <div>
                      <span className="text-white font-semibold">
                        {favorite.restaurant_name}
                      </span>
                      <p className="text-gray-400 text-sm">
                        Added {getTimeAgo(favorite.created_at)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/?selected=${favorite.restaurant_id}`}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition border border-white/20"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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