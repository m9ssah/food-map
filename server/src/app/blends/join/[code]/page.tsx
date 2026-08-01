import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import JoinBlendClient from './JoinBlendClient';

export default async function JoinBlendPage({ params }: { params: Promise<{ code: string }> }) {
  const supabase = await createClient();
  const { code } = await params;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // find blend by invite code
  const { data: blend } = await supabase
    .from('blends')
    .select('id, name, invite_code')
    .eq('invite_code', code.toUpperCase())
    .single();

  if (!blend) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Blend Not Found</h1>
          <p className="text-gray-400">This invite code doesn&apos;t exist or has expired.</p>
        </div>
      </div>
    );
  }

  // check if user is already a member
  const { data: existingMember } = await supabase
    .from('blend_members')
    .select('id')
    .eq('blend_id', blend.id)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    redirect(`/blends/${blend.id}`);
  }

  return <JoinBlendClient blend={blend} userId={user.id} />;
}