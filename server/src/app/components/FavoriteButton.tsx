'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';

type Props = {
  restaurantId: string;
  userId: string | null;
};

export default function FavoriteButton({ restaurantId, userId }: Props) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    
    checkFavorite();
  }, [userId, restaurantId]);

  async function checkFavorite() {
    const { data } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();
    
    setIsFavorite(!!data);
  }

  async function toggleFavorite() {
    if (!userId) return;
    
    setLoading(true);
    
    if (isFavorite) {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId);
      setIsFavorite(false);
    } else {
      await supabase
        .from('user_favorites')
        .insert({ user_id: userId, restaurant_id: restaurantId });
      setIsFavorite(true);
    }
    
    setLoading(false);
  }

  if (!userId) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="p-2 rounded-full hover:bg-white/10 transition-colors"
    >
      <Heart
        className={`w-6 h-6 ${
          isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
        }`}
      />
    </button>
  );
}