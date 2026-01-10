import Map from "../components/map/Map";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-900">
      <div className="absolute top-0 left-0 right-0 text-white p-4 z-10 bg-gray-900/80">
        Food Map
      </div>
      <div className="w-full h-full">
        <Map spots={[]} />
      </div>
    </main>
  );
}
