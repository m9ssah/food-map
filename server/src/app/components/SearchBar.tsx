'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Star, SlidersHorizontal, Coffee, Van, University, Pizza, Soup, DollarSign, CookingPot, Drumstick, Vegan, Laptop, Clock, Utensils, Beef, CakeSlice, IceCreamCone } from 'lucide-react'
import { useMapStore, Spot } from '@/stores/mapStore'

type Restaurant = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  google_rating: number | null
  google_ratings_count: number | null
}

type Category = {
    id: string;
    slug: string;
    name: string;
};

type RestaurantData = {
    restaurant: Restaurant;
    categories?: Category[];
    averageRating: number | null;
    totalRatings: number;
};

const filterTags = [
  { icon: Utensils, label: 'Restaurants' },
  { icon: Coffee, label: 'Cafes' },
  { icon: Laptop, label: 'Laptop Friendly' },   
  { icon: Van, label: 'Food Trucks' },
  { icon: University, label: 'On Campus' },
  { icon: Pizza, label: 'Italian'},
  { icon: IceCreamCone, label: 'Dessert' },
  { icon: Soup, label: 'East Asian' },
  { icon: Drumstick, label: 'Middle Eastern' },
  { icon: CookingPot, label: 'Indian' },
  { icon: DollarSign, label: 'Cheap Eats' },
  { icon: Clock, label: 'Open Now' },     // special case
  { icon: Vegan, label: 'Vegetarian' },
  { icon: Beef, label: 'Halal' },
  { icon: CakeSlice, label: 'Bakery' },
  
]
const categoryIdCache: Record<string, string> = {}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Restaurant[]>([])
  const [filteredResults, setFilteredResults] = useState<Restaurant[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  
  const supabase = useMemo(() => createClient(), [])
  
  const setSelectedSpot = useMapStore((state) => state.setSelectedSpot)
  const activeFilter = useMapStore((state) => state.activeFilter)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setFilteredSpots = useMapStore((state) => state.setFilteredSpots)

  // filter spots by category when a tag is clicked
  useEffect(() => {
    const fetchFilteredRestaurants = async () => {
      if (!activeFilter) {
        setFilteredSpots([])
        setFilteredResults([])
        return
      }

      setFilterLoading(true)

      // special case for open now
      if (activeFilter === 'Open Now') {
        try {
          const response = await fetch('/api/restaurants/open-now')
          const data = await response.json()
          
          if (data.error) {
            console.error('open now api error:', data.error)
            setFilteredSpots([])
            setFilteredResults([])
            setFilterLoading(false)
            return
          }

          const restaurants = data.restaurants || []
          
          const spots: Spot[] = restaurants.map((r: { id: string; name: string; latitude: number; longitude: number }) => ({
            id: r.id,
            name: r.name,
            lat: r.latitude,
            lng: r.longitude,
            category: 'Open Now',
          }))

          setFilteredSpots(spots)
          setFilteredResults(restaurants)
          setFilterLoading(false)
          return
        } catch (err) {
          console.error('Error fetching open restaurants:', err)
          setFilteredSpots([])
          setFilteredResults([])
          setFilterLoading(false)
          return
        }
      }

      // check cache first
      let categoryId = categoryIdCache[activeFilter]
      
      if (!categoryId) {
        // fetch category id and cache it
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', activeFilter)
          .single()

        if (categoryError || !categoryData) {
          console.error('Category lookup error:', categoryError)
          setFilteredSpots([])
          setFilteredResults([])
          setFilterLoading(false)
          return
        }
        
        categoryId = categoryData.id
        categoryIdCache[activeFilter] = categoryId
      }

      const { data: restaurantCategories, error: rcError } = await supabase
        .from('restaurant_categories')
        .select('restaurant_id')
        .eq('category_id', categoryId)

      if (rcError || !restaurantCategories) {
        console.error('Restaurant categories error:', rcError)
        setFilteredSpots([])
        setFilteredResults([])
        setFilterLoading(false)
        return
      }

      const restaurantIds = restaurantCategories.map(rc => rc.restaurant_id)
      
      if (restaurantIds.length === 0) {
        setFilteredSpots([])
        setFilteredResults([])
        setFilterLoading(false)
        return
      }

      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, address, latitude, longitude, google_rating, google_ratings_count')
        .in('id', restaurantIds)

      if (restaurantsError) {
        console.error('Restaurants fetch error:', restaurantsError)
        setFilteredSpots([])
        setFilteredResults([])
        setFilterLoading(false)
        return
      }

      // map markers
      const spots: Spot[] = restaurants?.map(r => ({
        id: r.id,
        name: r.name,
        lat: r.latitude,
        lng: r.longitude,
        category: activeFilter,
      })) || []

      setFilteredSpots(spots)
      setFilteredResults(restaurants || [])
      setFilterLoading(false)
    }

    fetchFilteredRestaurants()
  }, [activeFilter, supabase, setFilteredSpots])

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

  return (
    <div className="absolute top-6 left-6 z-10 flex flex-col items-center" ref={searchRef}>
      <div className="w-full max-w-4xl">
        <div className="backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-2xl shadow-2xl p-1">
          <div className="flex items-center px-4 py-5">
            <Search className="w-9 h-9 text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants..."
              className="w-full bg-transparent border-none outline-none text-white text-2xl placeholder-gray-400 pl-1"
            />
            {query && (
              <button
                onClick={handleClear}
                className="ml-2 p-1.5 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-7 h-7 text-gray-400" />
              </button>
            )}
            <button className="ml-2 p-2 rounded-full hover:bg-white/10 transition">
              <SlidersHorizontal className="w-7 h-7 text-gray-300" />
            </button>
            {/* Profile Button */}
            <a href="/profile" className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
              <div className="w-7 h-7 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-xs text-white"></span>
              </div>
            </a>
          </div>
          
          {/* Filter Tags Row */}
          <div className="flex gap-2 px-3 pb-4 overflow-x-auto scrollbar-hide">

            {filterTags.map((tag) => (
              <button
                key={tag.label}
                onClick={() => setActiveFilter(activeFilter === tag.label ? null : tag.label)}
                className={`flex items-center gap-1.5 px-4.5 py-3 bg-white/10 border border-white/10 rounded-full text-sm whitespace-nowrap transition${
                  activeFilter === tag.label
                    ? 'bg-white text-gray-900 bg-white/90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tag.icon className="w-6 h-6" />    {/* TODO CHANGE BACK TO 4 */}
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Dropdown */}
        {(isOpen || (activeFilter && filteredResults.length > 0)) && (
          <div className="mt-2 backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto scrollbar-hide">
            {(loading || filterLoading) ? (
              <div className="p-4 text-center text-gray-400">
                {loading ? 'Searching...' : 'Loading...'}
              </div>
            ) : isOpen && results.length > 0 ? (
              // search results r priority
              <div className="py-2">
                {results.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full px-4 py-3 hover:bg-gray-900/10 text-left transition"
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
            ) : isOpen && query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                No restaurants found for "{query}"
              </div>
            ) : activeFilter && filteredResults.length > 0 ? (
              // category filter results
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/10">
                  {filteredResults.length} {activeFilter} spot{filteredResults.length !== 1 ? 's' : ''}
                </div>
                {filteredResults.map((restaurant) => (
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
            ) : activeFilter ? (
              <div className="p-4 text-center text-gray-500">
                No spots found for "{activeFilter}"
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}