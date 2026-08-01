import { createClient } from '@/lib/supabase/server';
import MapWrapper from '@/app/components/map/MapWrapper';
import { Users } from 'lucide-react';
import ShareBlendButton from './ShareBlendButton';
import Link from 'next/link';

export default async function BlendPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient();
  const { id } = await params;

  // get blend details and members
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Blend not found</h1>
          <p className="text-gray-400 mb-4">Error: {error?.message || 'Unknown error'}</p>
          <p className="text-gray-400 mb-4">Blend ID: {id}</p>
          <Link href="/profile" className="text-blue-400 hover:text-blue-300">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  const memberIds = blend?.blend_members.map((m: { user_id: string }) => m.user_id) || [];
  
  // get all restaurants favorited by any member (with counts)
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

  // count how many members have each restaurant
  const restaurantCounts = new Map();
  const restaurantData = new Map();
  
  favoritedRestaurants?.forEach(({ restaurant_id, restaurants, user_id }) => {
    if (!restaurantCounts.has(restaurant_id)) {
      restaurantCounts.set(restaurant_id, new Set());
      restaurantData.set(restaurant_id, restaurants);
    }
    restaurantCounts.get(restaurant_id).add(user_id);
  });

  // convert to array and sort by popularity (most members)
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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{blend?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                {blend?.blend_members.length} member{blend?.blend_members.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <ShareBlendButton inviteCode={blend.invite_code} />
        </div>

        {/* Member avatars */}
        <div className="flex gap-2 items-center mb-3">
          {blend?.blend_members.slice(0, 5).map((member: { user_id: string; profiles: { username: string | null } | null }) => (
            <div
              key={member.user_id}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
              title={member.profiles?.username || 'User'}
            >
              {(member.profiles?.username?.[0] || '?').toUpperCase()}
            </div>
          ))}
          {blend?.blend_members.length > 5 && (
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xs">
              +{blend.blend_members.length - 5}
            </div>
          )}
        </div>
        
        <p className="text-green-400 text-sm">
          {blendedRestaurants.length} restaurant{blendedRestaurants.length !== 1 ? 's' : ''} in blend
          {blendedRestaurants.filter(r => r.memberCount === memberIds.length).length > 0 && (
            <span className="ml-2">
              • {blendedRestaurants.filter(r => r.memberCount === memberIds.length).length} loved by everyone
            </span>
          )}
        </p>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapWrapper spots={blendedRestaurants} />
      </div>
    </div>
  );
}