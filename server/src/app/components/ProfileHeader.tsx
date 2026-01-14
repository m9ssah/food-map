'use client'

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Props = {
  userId: string
  initialUsername: string | null
  initialBio: string | null
}

export default function ProfileHeader({ userId, initialUsername, initialBio }: Props) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState(initialBio || '')
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const handleSaveBio = async () => {
    setSaving(true)
    
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim() || null })
      .eq('id', userId)

    if (error) {
      console.error('Error updating bio:', error)
      alert('Failed to save bio')
    } else {
      setIsEditingBio(false)
      router.refresh()  
    }
    
    setSaving(false)
  }

  const handleCancel = () => {
    setBio(initialBio || '')
    setIsEditingBio(false)
  }

  return (
    <div className="mb-8">
      {/* Avatar */}
      <div className="w-24 h-24 bg-gray-600 rounded-full mb-4" />
      
      {/* Username */}
      <h1 className="text-3xl font-bold text-white mb-1">
        {initialUsername}
      </h1>
      
      {/* Bio Section */}
      <div className="mb-4">
        {isEditingBio ? (
          <div className="space-y-2">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a bio..."
              maxLength={150}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveBio}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className={`flex-1 ${bio ? 'text-gray-300' : 'text-gray-400 italic'}`}>
              {bio || "Write a bio"}
            </p>
            <button
              onClick={() => setIsEditingBio(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
              title="Edit bio"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
