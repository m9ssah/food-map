'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewBlendPage() {
  const [blendName, setBlendName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  async function searchUsers() {
    if (!searchQuery) return;
    
    // search users by username
    const { data } = await supabase
      .from('profiles') 
      .select('id, username')
      .ilike('username', `%${searchQuery}%`)
      .limit(5);
    
    setSearchResults(data || []);
  }

  async function createBlend() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // create blend
    const { data: blend, error } = await supabase
      .from('blends')
      .insert({ name: blendName, created_by: user.id })
      .select()
      .single();

    if (error || !blend) return;

    // add creator as member
    await supabase
      .from('blend_members')
      .insert({ blend_id: blend.id, user_id: user.id });

    // add selected users as members
    if (selectedUsers.length > 0) {
      await supabase
        .from('blend_members')
        .insert(
          selectedUsers.map(userId => ({
            blend_id: blend.id,
            user_id: userId
          }))
        );
    }

    router.push(`/blends/${blend.id}`);
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen p-8">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-6 mb-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Create a Blend</h1>
        
        {/* Blend Name */}
        <div className="mb-6">
          <label className="text-white block mb-2">Blend Name</label>
          <input
            type="text"
            value={blendName}
            onChange={(e) => setBlendName(e.target.value)}
            placeholder="Alex & John's Dinner Spots"
            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
          />
        </div>

        {/* Search Users */}
        <div className="mb-6">
          <label className="text-white block mb-2">Add Friends</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
            />
            <button
              onClick={searchUsers}
              className="bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-500"
            >
              Search
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                >
                  <span className="text-white">{user.email}</span>
                  <button
                    onClick={() => {
                      if (selectedUsers.includes(user.id)) {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      } else {
                        setSelectedUsers([...selectedUsers, user.id]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      selectedUsers.includes(user.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {selectedUsers.includes(user.id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 mb-2">{selectedUsers.length} friend(s) selected</p>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={createBlend}
          disabled={!blendName || selectedUsers.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Create Blend
        </button>
      </div>
    </div>
  );
}