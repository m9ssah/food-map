import { createClient } from '@/lib/supabase/server';
import MapWrapper from '@/app/components/map/MapWrapper';
import { Users, ArrowLeft, Sparkles } from 'lucide-react';
import ShareBlendButton from './ShareBlendButton';
import Link from 'next/link';

export default async function BlendPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: blend, error } = await supabase
    .from('blends')
    .select(`
      *,
      blend_members(
        user_id,
        profiles(username)
      )
    `)
    .eq('id', id)
    .single();

  if (!blend) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Blend not found</h1>
          <p className="text-gray-500 mb-6 text-sm">{error?.message || 'This blend may have been deleted or the link is invalid.'}</p>
          <Link href="/profile" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all duration-200 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  const memberIds = blend?.blend_members.map((m: { user_id: string }) => m.user_id) || [];
  
  const { data: favoritedRestaurants } = await supabase
    .from('user_favorites')
    .select(`
      restaurant_id,
      user_id,
      restaurants(
        id,
        name,
        latitude,
        longitude,
        google_price_level,
        restaurant_categories(
          categories(slug, name)
        )
      )
    `)
    .in('user_id', memberIds);

  const restaurantCounts = new Map();
  const restaurantData = new Map();
  
  favoritedRestaurants?.forEach(({ restaurant_id, restaurants, user_id }) => {
    if (!restaurantCounts.has(restaurant_id)) {
      restaurantCounts.set(restaurant_id, new Set());
      restaurantData.set(restaurant_id, restaurants);
    }
    restaurantCounts.get(restaurant_id).add(user_id);
  });

  const blendedRestaurants = Array.from(restaurantCounts.entries())
    .map(([restaurant_id, userSet]) => ({
      ...restaurantData.get(restaurant_id),
      memberCount: userSet.size,
      totalMembers: memberIds.length
    }))
    .sort((a, b) => b.memberCount - a.memberCount)
    .map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      categories: r.restaurant_categories?.map(
        (rc: { categories: { slug: string } | null }) => rc.categories?.slug
      ).filter(Boolean) || [],
      category: r.restaurant_categories?.[0]?.categories?.slug,
      priceLevel: r.google_price_level,
      memberCount: r.memberCount,
      totalMembers: r.totalMembers
    }));

  const sharedByAll = blendedRestaurants.filter(r => r.memberCount === memberIds.length);

  return (
    <div className="h-screen flex flex-col bg-gray-950">

      {/* Header */}
      <header className="flex-shrink-0 backdrop-blur-2xl bg-gray-950/80 border-b border-white/[0.06] z-10">
        <div className="px-4 pt-3 pb-3">

          {/* Top row: back + share */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
            >
              <span className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">Profile</span>
            </Link>
            <ShareBlendButton inviteCode={blend.invite_code} />
          </div>

          {/* Blend name + member count */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{blend?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-500 text-xs">
                  {blend?.blend_members.length} member{blend?.blend_members.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-300 text-xs font-medium">
                {blendedRestaurants.length} spots
              </span>
              {sharedByAll.length > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  {sharedByAll.length} everyone loves
                </span>
              )}
            </div>
          </div>

          {/* Member avatars */}
          <div className="flex items-center gap-1.5">
            {blend?.blend_members.slice(0, 6).map((member: { user_id: string; profiles: { username: string | null } | null }) => (
              <div
                key={member.user_id}
                className="w-8 h-8 rounded-full  flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-950 shadow-lg"
                title={member.profiles?.username || 'User'}
              >
                {(member.profiles?.username?.[0] || '?').toUpperCase()}
              </div>
            ))}
            {blend?.blend_members.length > 6 && (
              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-gray-400 text-xs font-semibold ring-2 ring-gray-950">
                +{blend.blend_members.length - 6}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        {blendedRestaurants.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <div className="text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-white font-semibold mb-2">No shared favourites yet</p>
              <p className="text-gray-500 text-sm">
                Once members heart restaurants on the map, they&apos;ll appear here
              </p>
            </div>
          </div>
        ) : (
          <MapWrapper spots={blendedRestaurants} />
        )}
      </div>
    </div>
  );
}