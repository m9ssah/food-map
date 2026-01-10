import { createClient } from '@supabase/supabase-js';
import MapWrapper from "../components/map/MapWrapper";

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_API_KEY!
);

export default async function Home() {
  // fetching restaurants from Supabase 
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
      <div className="w-full h-full">
        <MapWrapper spots={spots} />
      </div>
    </main>
  );
}
