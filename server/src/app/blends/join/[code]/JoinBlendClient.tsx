'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

type Props = {
  blend: {
    id: string;
    name: string;
    invite_code: string;
  };
  userId: string;
};

export default function JoinBlendClient({ blend, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function joinBlend() {
    setLoading(true);

    const { error } = await supabase
      .from('blend_members')
      .insert({ blend_id: blend.id, user_id: userId });

    if (error) {
      alert('Error joining blend');
      setLoading(false);
      return;
    }

    router.push(`/blends/${blend.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">{blend.name}</h1>
        <p className="text-gray-400 mb-6">
          You've been invited to join this blend!
        </p>
        
        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-sm mb-1">Invite Code</p>
          <p className="text-white font-mono text-2xl">{blend.invite_code}</p>
        </div>

        <button
          onClick={joinBlend}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition font-semibold"
        >
          {loading ? 'Joining...' : 'Join Blend'}
        </button>
      </div>
    </div>
  );
}