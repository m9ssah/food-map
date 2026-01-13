'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // update their profile with username
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username || email.split('@')[0] })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    setLoading(false)
    router.push('/')
    router.refresh()
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md p-8 rounded-lg shadow-xl" style={{  backgroundColor: '#213955' }}>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Campus Food App
        </h1>

        {/* Sign In / Sign Up Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-2 rounded-lg transition ${
              !isSignUp
                ? 'bg-white text-[#002F65]'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-2 rounded-lg transition ${
              isSignUp
                ? 'bg-white text-[#002F65]'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          {/* Username field (for signup) */}
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 bg-[#17283C] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required={isSignUp}
              />
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.utoronto.ca"
              className="w-full px-4 py-2 bg-[#17283C] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 bg-[#17283C] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 bg-white text-[#002F65] rounded-lg hover:bg-[#95B4D8] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {isSignUp && (
          <p className="text-gray-400 text-xs mt-4 text-center">
            Only UofT emails (@mail.utoronto.ca or @utoronto.ca) are allowed
          </p>
        )}
      </div>
    </div>
  )
}