'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import RestaurantDetail from './map/RestaurantDetail';
import FoodTruckDetail from './FoodTruckDetail';

const FOOD_TRUCK_CATEGORY_ID = 'e4b95331-c1a6-41c4-b009-198de99561a5';

type SpotInfo = {
  isFoodTruck: boolean;
  hasMenuItems: boolean;
  address: string | null;
};

type Props = {
  restaurantId: string;
  onClose: () => void;
};

export default function SpotDetail({ restaurantId, onClose }: Props) {
  const [spotInfo, setSpotInfo] = useState<SpotInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function detectSpotType() {
      setLoading(true);

      // check if it's a food truck and get basic info in parallel
      const [categoryResult, menuResult, restaurantResult] = await Promise.all([
        supabase
          .from('restaurant_categories')
          .select('category_id')
          .eq('restaurant_id', restaurantId)
          .eq('category_id', FOOD_TRUCK_CATEGORY_ID)
          .single(),
        supabase
          .from('restaurant_menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId),
        supabase
          .from('restaurants')
          .select('address, name')
          .eq('id', restaurantId)
          .single(),
      ]);

      setSpotInfo({
        isFoodTruck: !!categoryResult.data,
        hasMenuItems: (menuResult.count ?? 0) > 0,
        address: restaurantResult.data?.address || null,
      });

      setLoading(false);
    }

    detectSpotType();
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 h-32 bg-gray-900 rounded-t-2xl flex items-center justify-center border-t border-white/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50" />
      </div>
    );
  }

  // show food truck detail if it's a food truck WITH menu items
  if (spotInfo?.isFoodTruck && spotInfo?.hasMenuItems) {
    return (
      <FoodTruckDetail
        restaurantId={restaurantId}
        restaurantName="" 
        address={spotInfo.address}
        onClose={onClose}
      />
    );
  }
  
  return (
    <RestaurantDetail
      restaurantId={restaurantId}
      onClose={onClose}
    />
  );
}