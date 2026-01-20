import { createClient } from '@/lib/supabase/server';
import MapWrapper from "./components/map/MapWrapper";
import LogoutButton from "./components/LogoutButton";
import Link from 'next/link';
import { User, Search } from 'lucide-react';
import SearchBar from "./components/SearchBar"; 

export default async function Home() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, latitude, longitude');

  if (error) {
    console.error('Error fetching restaurants:', error); 
  }

  const spots = restaurants?.map(restaurant => ({
    id: restaurant.id, 
    name: restaurant.name, 
    lat: restaurant.latitude, 
    lng: restaurant.longitude,
    })) || []; 

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-900">

      {/* Search bar */}
      <SearchBar />
      <div className="w-full h-full">
        <MapWrapper spots={spots} />
      </div>
    </main>
  );
}