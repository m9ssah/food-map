import Map from "../components/map/Map";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-gray-900">
      <Map spots={[]} />
    </main>
  );
}
