import { createClient } from '@/lib/supabase/server';
import MapWrapper from "./components/map/MapWrapper";
import LogoutButton from "./components/LogoutButton";
import Link from 'next/link';
import { User } from 'lucide-react';

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
    lng: restaurant.longitude
  })) || []; 

  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-900">
      {user && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Link
            href="/profile"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <LogoutButton />
        </div>
      )}
      
      {!user && (
        <div className="absolute top-4 right-4 z-10">
          <a
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Sign In
          </a>
        </div>
      )}
      
      <div className="w-full h-full">
        <MapWrapper spots={spots} />
      </div>
    </main>
  );
}