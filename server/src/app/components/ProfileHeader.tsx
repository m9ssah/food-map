'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit2, Check, X, Camera, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Props = {
  userId: string
  initialUsername: string | null
  initialBio: string | null
  initialAvatarUrl?: string | null
}

export default function ProfileHeader({ userId, initialUsername, initialBio, initialAvatarUrl }: Props) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bio, setBio] = useState(initialBio || '')
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${userId}/${oldPath}`])
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      router.refresh()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mb-8">
      {/* Avatar */}
      <div className="relative w-24 h-24 mb-4 group">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile picture"
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {initialUsername?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        
        {/* Upload overlay */}
        <label 
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="hidden"
          disabled={uploading}
        />
      </div>
      
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