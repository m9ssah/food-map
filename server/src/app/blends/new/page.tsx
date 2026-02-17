'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBlendPage() {
  const [blendName, setBlendName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function createBlend() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !blendName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // generate simple invite code (no RPC needed)
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      console.log('Creating blend with:', { name: blendName, created_by: user.id, invite_code: inviteCode });

      // create blend
      const { data: blend, error: blendError } = await supabase
        .from('blends')
        .insert({ 
          name: blendName, 
          created_by: user.id,
          invite_code: inviteCode,
          is_public: true 
        })
        .select()
        .single();

      if (blendError) {
        console.error('Blend creation error:', blendError);
        setError(`Failed to create blend: ${blendError.message}`);
        setLoading(false);
        return;
      }

      console.log('Blend created:', blend);

      // add creator as member
      const { error: memberError } = await supabase
        .from('blend_members')
        .insert({ blend_id: blend.id, user_id: user.id });

      if (memberError) {
        console.error('Member addition error:', memberError);
        setError(`Failed to add member: ${memberError.message}`);
        setLoading(false);
        return;
      }

      console.log('Member added, redirecting...');
      router.push(`/blends/${blend.id}`);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="backdrop-blur-xl bg-gray-900/30 border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create a Blend</h1>
          <p className="text-gray-400 mb-6">
            Share the invite code with friends to find restaurants you all want to try!
          </p>
          
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="text-white block mb-2">Blend Name</label>
            <input
              type="text"
              value={blendName}
              onChange={(e) => setBlendName(e.target.value)}
              placeholder="e.g., Weekend Brunch Spots"
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <button
            onClick={createBlend}
            disabled={!blendName.trim() || loading}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating...' : 'Create Blend'}
          </button>
        </div>
      </div>
    </div>
  );
}