'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Truck, MapPin, DollarSign } from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  price: number | null;
  price_label: string | null;
};

type Props = {
  restaurantId: string;
  onClose: () => void;
};

export default function FoodTruckDetail({ restaurantId, onClose }: Props) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantName, setRestaurantName] = useState('');  // ⬅️ Now fetched internally
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const [menuResult, restaurantResult] = await Promise.all([
        supabase
          .from('restaurant_menu_items')
          .select('id, name, price, price_label')
          .eq('restaurant_id', restaurantId)
          .order('price', { ascending: true }),
        supabase
          .from('restaurants')
          .select('name, address')
          .eq('id', restaurantId)
          .single(),
      ]);

      if (menuResult.error) console.error('Error fetching menu items:', menuResult.error);
      if (restaurantResult.error) console.error('Error fetching restaurant:', restaurantResult.error);

      setMenuItems(menuResult.data || []);
      setRestaurantName(restaurantResult.data?.name || '');
      setAddress(restaurantResult.data?.address || null);
      setLoading(false);
    }

    fetchData();
  }, [restaurantId]);

  function formatPrice(item: MenuItem): string {
    if (item.price_label) return item.price_label;
    if (item.price) return `$${item.price.toFixed(2)}`;
    return '';
  }

  const cheapItems = menuItems.filter(i => i.price && i.price <= 6);
  const midItems = menuItems.filter(i => i.price && i.price > 6 && i.price <= 10);
  const premiumItems = menuItems.filter(i => i.price && i.price > 10);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[70vh] flex flex-col bg-gray-900 rounded-t-2xl shadow-2xl border-t border-white/10 overflow-hidden">
      {/* Handle bar */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-white/20 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl mt-0.5">
            <Truck className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              {loading ? (
                <span className="inline-block w-40 h-5 bg-white/10 rounded animate-pulse" />
              ) : (
                restaurantName
              )}
            </h2>
            {address && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <p className="text-gray-400 text-xs">{address}</p>
              </div>
            )}
            <span className="inline-block mt-1.5 text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
              🚚 Food Truck
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Menu Preview */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">Menu Preview</h3>
              <div className="flex items-center gap-1 text-gray-400 text-xs">
                <DollarSign className="w-3 h-3" />
                <span>
                  {menuItems.length > 0
                    ? `From $${Math.min(...menuItems.filter(i => i.price).map(i => i.price!)).toFixed(2)}`
                    : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 transition rounded-xl px-4 py-3 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-5 text-center">
                      {index + 1}
                    </span>
                    <span className="text-white text-sm">{item.name}</span>
                  </div>
                  <span className="text-orange-400 font-semibold text-sm whitespace-nowrap ml-4">
                    {formatPrice(item)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price summary pills */}
            {menuItems.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {cheapItems.length > 0 && (
                  <span className="text-xs px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                    💚 Budget picks from ${Math.min(...cheapItems.filter(i => i.price).map(i => i.price!)).toFixed(2)}
                  </span>
                )}
                {midItems.length > 0 && (
                  <span className="text-xs px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20">
                    ⭐ Mains from ${Math.min(...midItems.filter(i => i.price).map(i => i.price!)).toFixed(2)}
                  </span>
                )}
                {premiumItems.length > 0 && (
                  <span className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                    🔥 Premium from ${Math.min(...premiumItems.filter(i => i.price).map(i => i.price!)).toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}