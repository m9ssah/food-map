'use client'; 

import { createClient } from '../../lib/supabase/client'; 
import { useRouter } from 'next/navigation'; 

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-white text-black rounded-lg hover:bg-red-700 transition"
    >
      Sign Out
    </button>
  )
}