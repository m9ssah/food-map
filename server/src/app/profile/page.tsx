import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Heart, Users, Plus, Star, MapPin } from 'lucide-react';
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, bio, avatar_url, created_at')
    .eq('id', user.id)
    .single();

  const { data: userRatings } = await supabase
    .from('ratings')
    .select(`id, score, review, created_at, restaurant_id, restaurants ( name )`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const ratings: UserRating[] = (userRatings || []).map((r) => {
    const raw = r as Record<string, unknown>;
    const restaurant = Array.isArray(raw.restaurants)
      ? (raw.restaurants as Record<string, unknown>[])[0]
      : raw.restaurants as Record<string, unknown> | null;
    return {
      id: raw.id as string,
      score: raw.score as number,
      review: raw.review as string | null,
      created_at: raw.created_at as string,
      restaurant_id: raw.restaurant_id as string,
      restaurant_name: (restaurant?.name as string) || 'Unknown',
    };
  });

  const { data: userFavorites } = await supabase
    .from('user_favorites')
    .select(`id, restaurant_id, created_at, restaurants ( name )`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const favorites: Favorite[] = (userFavorites || []).map((f) => {
    const raw = f as Record<string, unknown>;
    const restaurant = Array.isArray(raw.restaurants)
      ? (raw.restaurants as Record<string, unknown>[])[0]
      : raw.restaurants as Record<string, unknown> | null;
    return {
      id: raw.id as string,
      restaurant_id: raw.restaurant_id as string,
      restaurant_name: (restaurant?.name as string) || 'Unknown',
      created_at: raw.created_at as string,
    };
  });

  const { data: userBlends } = await supabase
    .from('blend_members')
    .select(`blends ( id, name, created_at, invite_code, blend_members ( count ) )`)
    .eq('user_id', user.id);

  const blends: Blend[] = (userBlends || []).map((b) => {
    const blend = Array.isArray((b as Record<string, unknown>).blends)
      ? ((b as Record<string, unknown>).blends as Record<string, unknown>[])[0]
      : (b as Record<string, unknown>).blends as Record<string, unknown>;
    return {
      id: blend.id as string,
      name: blend.name as string,
      created_at: blend.created_at as string,
      invite_code: blend.invite_code as string,
      member_count: Array.isArray(blend.blend_members) ? (blend.blend_members as unknown[]).length : 0,
    };
  });

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top nav bar */}
      <nav className="sticky top-0 z-40 backdrop-blur-2xl bg-gray-950/70 border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
          >
            <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium">Map</span>
          </Link>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 relative">

        {/* Profile card */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-6 shadow-2xl animate-fade-in">
          <ProfileHeader
            userId={user.id}
            initialUsername={profile?.username || user.email?.split('@')[0] || 'User'}
            initialBio={profile?.bio}
            initialAvatarUrl={profile?.avatar_url}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {[
            { label: 'Reviews', value: ratings.length, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
            { label: 'Favourites', value: favorites.length, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
            { label: 'Blends', value: blends.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-4 flex flex-col items-center gap-2 shadow-xl">
              <span className={`p-2 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </span>
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Average score pill */}
        {avgRating && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 w-fit">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-300 text-sm font-semibold">Average rating: {avgRating}</span>
          </div>
        )}

        {/* Blends section */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">My Blends</h2>
              <p className="text-gray-500 text-sm mt-0.5">Collaborative restaurant wishlists</p>
            </div>
            <Link
              href="/blends/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              New Blend
            </Link>
          </div>

          {blends.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] border-dashed p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-white font-semibold mb-1">No blends yet</p>
              <p className="text-gray-500 text-sm mb-5">
                Create a blend to find restaurants you and your friends all love
              </p>
              <Link
                href="/blends/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all duration-200 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Your First Blend
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {blends.map((blend) => (
                <div
                  key={blend.id}
                  className="group rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] backdrop-blur-xl transition-all duration-200 overflow-hidden"
                >
                  <div className="flex items-center p-4">
                    <Link href={`/blends/${blend.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">{blend.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-gray-500 text-xs">
                            {blend.member_count} member{blend.member_count !== 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-700 text-xs">•</span>
                          <span className="text-gray-600 text-xs font-mono tracking-wider">{blend.invite_code}</span>
                          <span className="text-gray-700 text-xs">•</span>
                          <span className="text-gray-600 text-xs">{getTimeAgo(blend.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                    <DeleteBlendButton blendId={blend.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Favourites section */}
        <section className="animate-fade-in pb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Food Wishlist</h2>
            <p className="text-gray-500 text-sm mt-0.5">Restaurants you&apos;ve hearted on the map</p>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] border-dashed p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-red-400" />
              </div>
              <p className="text-white font-semibold mb-1">Nothing saved yet</p>
              <p className="text-gray-500 text-sm">
                Tap the heart ♥ icon on any restaurant to save it here
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-xl divide-y divide-white/[0.06]">
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-1.5 rounded-lg bg-red-500/10 flex-shrink-0">
                      <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{favorite.restaurant_name}</p>
                      <p className="text-gray-600 text-xs">Added {getTimeAgo(favorite.created_at)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/?selected=${favorite.restaurant_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-gray-300 hover:text-white transition-all duration-150 text-xs font-medium flex-shrink-0 ml-3"
                  >
                    <MapPin className="w-3 h-3" />
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reviews section */}
        {ratings.length > 0 && (
          <section className="animate-fade-in pb-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">My Reviews</h2>
              <p className="text-gray-500 text-sm mt-0.5">Restaurants you&apos;ve rated</p>
            </div>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl overflow-hidden shadow-xl divide-y divide-white/[0.06]">
              {ratings.slice(0, 10).map((rating) => (
                <div
                  key={rating.id}
                  className="flex items-start justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors duration-150 gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex-shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-300 text-xs font-bold">{rating.score}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm">{rating.restaurant_name}</p>
                      {rating.review && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{rating.review}</p>
                      )}
                      <p className="text-gray-700 text-xs mt-1">{getTimeAgo(rating.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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