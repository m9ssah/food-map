'use client';

import { useEffect, useState, useMemo } from 'react';
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function detectSpotType() {
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

      if (!cancelled) {
        setSpotInfo({
          isFoodTruck: !!categoryResult.data,
          hasMenuItems: (menuResult.count ?? 0) > 0,
          address: restaurantResult.data?.address || null,
        });
      }
    }

    detectSpotType();
    return () => { cancelled = true; };
  }, [restaurantId, supabase]);

  // Always show RestaurantDetail immediately — no black loading popup.
  // Once we confirm it's a food truck WITH menu items, swap to FoodTruckDetail.
  if (spotInfo?.isFoodTruck && spotInfo?.hasMenuItems) {
    return (
      <FoodTruckDetail
        restaurantId={restaurantId}
        onClose={onClose}
      />
    );
  }

  // Show restaurant detail right away; it has its own graceful loading skeleton.
  return (
    <RestaurantDetail
      restaurantId={restaurantId}
      onClose={onClose}
    />
  );
}