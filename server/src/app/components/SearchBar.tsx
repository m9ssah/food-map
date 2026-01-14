'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Star } from 'lucide-react'
import { useMapStore } from '@/stores/mapStore'

type Restaurant = {
  id: string
  name: string
  category: string | null
  address: string | null
  latitude: number
  longitude: number
  google_rating: number | null
  google_ratings_count: number | null
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Restaurant[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClient()
  const setSelectedSpot = useMapStore((state) => state.setSelectedSpot)

  // search restaurants
  useEffect(() => {
    const searchRestaurants = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setLoading(true)
      
     const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, address, latitude, longitude, google_rating, google_ratings_count')
      .ilike('name', `%${query}%`)
      .limit(10)

    if (error) {
      console.error('Search error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
    } else {
      console.log('Search success! Found:', data?.length, 'results')
      setResults(data || [])
      setIsOpen(true)
    }
      
      setLoading(false)
    }

    const timeoutId = setTimeout(searchRestaurants, 300)
    return () => clearTimeout(timeoutId)
  }, [query, supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedSpot(restaurant.id)
    setQuery('')
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  useEffect(() => {
  const testConnection = async () => {
    console.log('Testing Supabase connection...')
    const { data, error, count } = await supabase
      .from('restaurants')
      .select('id, name', { count: 'exact' })
      .limit(1)
    
    console.log('Test result:', { data, error, count })
  }
  
  testConnection()
}, [supabase])

  return (
    <div className="absolute top-4 left-4 z-10" ref={searchRef}>
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#002F65]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search restaurants..."
          className="w-full pl-10 pr-10 py-2 bg-white text-[#002F65] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full px-4 py-3 hover:bg-gray-100 text-left transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {restaurant.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {restaurant.address && (
                            <span className="text-xs">{restaurant.address}</span>
                          )}
                        </div>
                      </div>
                      {restaurant.google_rating && (
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {restaurant.google_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No restaurants found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}