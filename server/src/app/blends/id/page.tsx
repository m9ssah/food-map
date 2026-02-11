import { createClient } from '@/lib/supabase/server';
import MapWrapper from '@/app/components/map/MapWrapper';

export default async function BlendPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // get blend details and members
  const { data: blend } = await supabase
    .from('blends')
    .select(`
      *,
      blend_members(
        user_id,
        profiles(email, username)
      )
    `)
    .eq('id', params.id)
    .single();

  // get common restaurants (restaurants favorited by ALL members)
  const memberIds = blend?.blend_members.map((m: any) => m.user_id) || [];
  
  // find restaurants that appear in ALL members' favorites
  const { data: commonRestaurants } = await supabase
    .from('user_favorites')
    .select(`
      restaurant_id,
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
  commonRestaurants?.forEach(({ restaurant_id }) => {
    restaurantCounts.set(
      restaurant_id,
      (restaurantCounts.get(restaurant_id) || 0) + 1
    );
  });

  // filter to only restaurants favorited by ALL members
  const trulyCommon = commonRestaurants
    ?.filter(({ restaurant_id }) => 
      restaurantCounts.get(restaurant_id) === memberIds.length
    )
    .map(({ restaurants }) => ({
      id: restaurants.id,
      name: restaurants.name,
      lat: restaurants.latitude,
      lng: restaurants.longitude,
      categories: restaurants.restaurant_categories?.map(
        (rc: any) => rc.categories?.slug
      ).filter(Boolean) || [],
      category: restaurants.restaurant_categories?.[0]?.categories?.slug,
      priceLevel: restaurants.google_price_level
    })) || [];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">{blend?.name}</h1>
        <div className="flex gap-2 mt-2">
          {blend?.blend_members.map((member: any) => (
            <span key={member.user_id} className="text-gray-400 text-sm">
              {member.profiles?.email}
            </span>
          ))}
        </div>
        <p className="text-green-400 mt-2">
          {trulyCommon.length} restaurant(s) in common
        </p>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapWrapper spots={trulyCommon} />
      </div>
    </div>
  );
}