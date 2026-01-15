'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Star, SlidersHorizontal, Coffee, Globe, DollarSign, Vegan, Clock, Utensils } from 'lucide-react'
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

const filterChips = [
  { icon: Coffee, label: 'Cafes' },
  { icon: Utensils, label: 'Restaurants' },
  { icon: Vegan, label: 'Vegetarian' },
  { icon: Globe, label: 'Middle Eastern' },
  { icon: DollarSign, label: 'Cheap Eats' },
  { icon: Clock, label: 'Open Now' },
]

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Restaurant[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
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
    <div className="absolute top-4 left-4 z-10 flex flex-col items-center" ref={searchRef}>
      <div className="w-full max-w-2xl">
        <div className="backdrop-blur-xl bg-gray-900/60 border border-white/10 rounded-2xl shadow-2xl p-2">
          <div className="flex items-center px-3 py-2">
            <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-gray-400"
            />
            {query && (
              <button
                onClick={handleClear}
                className="ml-2 p-1.5 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button className="ml-2 p-2 rounded-full hover:bg-white/10 transition">
              <SlidersHorizontal className="w-5 h-5 text-gray-300" />
            </button>
            {/* Profile Button */}
            <a href="/profile" className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
              <div className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white"></span>
              </div>
            </a>
          </div>
          
          {/* Filter Chips Row */}
          <div className="flex gap-2 px-2 pb-2 overflow-x-auto scrollbar-hide">
            {filterChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => setActiveFilter(activeFilter === chip.label ? null : chip.label)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  activeFilter === chip.label
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <chip.icon className="w-4 h-4" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="mt-2 backdrop-blur-xl bg-gray-900/80 border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full px-4 py-3 hover:bg-white/10 text-left transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {restaurant.name}
                        </div>
                        {restaurant.address && (
                          <div className="text-sm text-gray-400 mt-1">
                            {restaurant.address}
                          </div>
                        )}
                      </div>
                      {restaurant.google_rating && (
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-white">
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