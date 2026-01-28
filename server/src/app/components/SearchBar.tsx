'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Star, ChevronLeft, ChevronRight, GripVertical, SlidersHorizontal, Coffee, Van, University, Pizza, Soup, DollarSign, CookingPot, Drumstick, Vegan, Laptop, Clock, Utensils, Beef, CakeSlice, IceCreamCone } from 'lucide-react'
import { useMapStore, Spot } from '@/stores/mapStore'

type Restaurant = {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  google_rating: number | null
  google_ratings_count: number | null
  google_place_id?: string | null
  photoUrl?: string | null
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

const heroCategories = [    // TODO: add more later
  { 
    label: 'Restaurants', 
    icon: Utensils,
    image: 'https://torontolife.mblycdn.com/tl/resized/2023/03/w1280/DSC0690.jpg',
    description: 'Dine-in spots'
  },
  { 
    label: 'Cafes', 
    icon: Coffee,
    image: 'https://media.blogto.com/uploads/2024/07/26/1722027463-20240726-Rooms17Baldwin-6.jpg?w=1400&cmd=resize&height=2500&quality=70',
    description: 'Coffee & snacks'
  },
  { 
    label: 'Dessert', 
    icon: IceCreamCone,
    image: 'https://blogto-production2-baselayer-display.blogto.com/listings/20230922-Kream-12.jpg?w=2048&cmd=resize_then_crop&height=1365&format=auto',
    description: 'Sweet treats'
  },
  { 
    label: 'On Campus', 
    icon: University,
    image: 'https://harthouse.ca/assets/images/uploads/spaces/IMG_4601.jpg',
    description: 'Convenient eats'
  },
  { 
    label: 'Food Trucks', 
    icon: Van,
    image: 'https://preview.redd.it/does-anyone-know-what-has-happened-to-this-specific-food-v0-ighy41ym0rg81.jpg?width=640&crop=smart&auto=webp&s=25d4dc8d4431fc6cc5f4d2b7316e39c324472421',
    description: 'Street eats'
  },
]
const categoryIdCache: Record<string, string> = {}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Restaurant[]>([])
  const [filteredResults, setFilteredResults] = useState<Restaurant[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [showCategoryView, setShowCategoryView] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 24 })
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 })
  
  const supabase = useMemo(() => createClient(), [])
  
  const setSelectedSpot = useMapStore((state) => state.setSelectedSpot)
  const activeFilter = useMapStore((state) => state.activeFilter)
  const setActiveFilter = useMapStore((state) => state.setActiveFilter)
  const setFilteredSpots = useMapStore((state) => state.setFilteredSpots)

  // fetch photos
  const fetchPhotosForRestaurants = async (restaurants: Restaurant[]): Promise<Restaurant[]> => {
    const restaurantsWithPhotos = await Promise.all(
      restaurants.map(async (restaurant) => {
        if (!restaurant.google_place_id) {
          return { ...restaurant, photoUrl: null }
        }
        try {
          const response = await fetch(`/api/google/places?place_id=${restaurant.google_place_id}`)
          const data = await response.json()
          return { 
            ...restaurant, 
            photoUrl: data.google_photo_reference 
              ? `/api/google/photo?reference=${encodeURIComponent(data.google_photo_reference)}&maxwidth=800` 
              : null 
          }
        } catch {
          return { ...restaurant, photoUrl: null }
        }
      })
    )
    return restaurantsWithPhotos
  }

  const getPhotoUrl = (restaurant: Restaurant) => {
    return restaurant.photoUrl || null
  }

  // handle card category click
  const handleCardClick = (categoryLabel: string) => {
    setActiveFilter(activeFilter === categoryLabel ? null : categoryLabel)
    setShowCategoryView(true)
    setIsOpen(false)
  }

  const handleBackFromCategoryView = () => {
    setShowCategoryView(false)
    setActiveFilter(null)
  }
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
        .select('id, name, address, latitude, longitude, google_rating, google_ratings_count, google_place_id')
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
      
      // fetch photos
      const restaurantsWithPhotos = await fetchPhotosForRestaurants(restaurants || [])
      setFilteredResults(restaurantsWithPhotos)
      setFilterLoading(false)
    }

    fetchFilteredRestaurants()
  }, [activeFilter, supabase, setFilteredSpots])

  // heuristic scoring for search res
  const calcHeuristicScore = (restaurant: Restaurant, searchQuery: string): number => {
    const normalizedQuery = searchQuery.toLowerCase().trim()
    const normalizedName = restaurant.name.toLowerCase()
    const normalizedAddress = (restaurant.address || '').toLowerCase()
    
    let score = 0
    
    // name matching 
    if (normalizedName === normalizedQuery) score += 100
    else if (normalizedName.startsWith(normalizedQuery)) score += 20
    else if (normalizedName.includes(normalizedQuery)) score += 10
    else {
      const queryWords = normalizedQuery.split(/\s+/)
      const nameWords = normalizedName.split(/\s+/)
      
      let wordMatchCount = 0
      for (const qWord of queryWords) {
        if (qWord.length < 2) continue
        for (const nWord of nameWords) {
          if (nWord.startsWith(qWord) || nWord.includes(qWord)) {
            wordMatchCount++
            break
          }
        }
      }
      
      // proportion of query words matched
      if (queryWords.length > 0) {
        score += (wordMatchCount / queryWords.length) * 50
      }
      
      // in case of short queries check chaar matches
      if (normalizedQuery.length <= 2) {
        const minLen = Math.min(normalizedName.length, normalizedQuery.length)
        let matchingChars = 0
        for (let i = 0; i < minLen; i++) {
          if (normalizedName[i] === normalizedQuery[i]) matchingChars++
        }
        score += (matchingChars / normalizedQuery.length) * 5
      }
    }
    
    // address matching
    if (normalizedAddress.includes(normalizedQuery)) {
      score += 15
    } else {
      const queryWords = normalizedQuery.split(/\s+/)
      for (const word of queryWords) {
        if (word.length >= 3 && normalizedAddress.includes(word)) {
          score += 3
        }
      }
    }
    
    // popularity
    if (restaurant.google_rating) {
      score += restaurant.google_rating
        if (restaurant.google_rating >= 4.5) score *= 2.5
        else if (restaurant.google_rating >= 4.0) score *= 1.5
    }
    
    if (restaurant.google_ratings_count) {
      score += Math.log10(restaurant.google_ratings_count + 1)
    }
    
    return score
  }

  // restaurant search
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
        .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
        .limit(100)  // TODO adjust limit accordingly

      if (error) {
        console.error('Search error:', error)
        setResults([])
        setIsOpen(false)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setResults([])
        setIsOpen(true)
        setLoading(false)
        return
      }

      const scoredResults = data.map(restaurant => ({
        restaurant,
        score: calcHeuristicScore(restaurant, query)
      }))

      scoredResults.sort((a, b) => b.score - a.score)
      
      const minScoreThreshold = 10
      const rankedResults = scoredResults
        .filter(item => item.score >= minScoreThreshold)
        .slice(0, 10)
        .map(item => item.restaurant)

      setResults(rankedResults)
      setIsOpen(true)
      setLoading(false)
    }

    const timeoutId = setTimeout(searchRestaurants, 300)
    return () => clearTimeout(timeoutId)
  }, [query, supabase])

// end of search

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragRef.current.startX
      const deltaY = e.clientY - dragRef.current.startY

      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

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

  const getFilterIcon = (label: string) => {
    const tag = filterTags.find(t => t.label === label)
    return tag?.icon || Utensils
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true)
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y
      }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - dragRef.current.startX
      const deltaY = e.clientY - dragRef.current.startY
      setPosition({
        x: dragRef.current.initialX + deltaX,
        y: dragRef.current.initialY + deltaY
      })
    }
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    setIsOpen(false)
    setShowCategoryView(false)
  }

  return (
    <div 
    className={`absolute bottom-4 z-10 flex flex-col ${isDragging ? 'cursor-grabbing' : ''}`}
    style={{
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: isCollapsed ? '56px' : 'auto',
      maxWidth: isCollapsed ? '56px' : '64rem'
    }}
    ref={searchRef}
    onMouseDown={handleMouseDown}
  >
    {isCollapsed ? (
      <button
        onClick={toggleCollapse}
        className="w-14 h-14 backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-900/10 transition"
      >
        <Search className="w-6 h-6 text-white" />
      </button>
    ) : (
      <div className="w-full max-w-4xl flex flex-col min-h-0 max-h-full">
        <div className="backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-2xl shadow-2xl p-1">
          <div className="flex items-center px-4 py-5">
            <div className="drag-handle cursor-grab active:cursor-grabbing mr-2">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
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

            <button 
            onClick={toggleCollapse}
            className="ml-2 p-2 rounded-full hover:bg-white/10 transition"
            title="Minimize"
          >
            <ChevronLeft className="w-6 h-6 text-gray-300" />
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
                onClick={() => {
                  if (activeFilter === tag.label) {
                    setActiveFilter(null)
                    setShowCategoryView(false)
                  } else {
                    setActiveFilter(tag.label)
                    setShowCategoryView(true)
                  }
                }}
                className={`flex items-center gap-1.5 px-4.5 py-3 bg-white/10 border border-white/10 rounded-full text-sm whitespace-nowrap transition${
                  activeFilter === tag.label
                    ? 'bg-white text-gray-900 bg-white/90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tag.icon className="w-6 h-6" />
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Dropdown */}
        {isOpen && (
          <div className="mt-2 backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto scrollbar-hide">
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
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                No restaurants found for "{query}"
              </div>
            ) : null}
          </div>
        )}

        {/* Category Results View Cards */}
        {showCategoryView && activeFilter ? (
          <div className="mt-4 backdrop-blur-xl bg-gray-900/10 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-0 flex-1">
            {/* header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <button 
                onClick={handleBackFromCategoryView}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              {(() => {
                const IconComponent = getFilterIcon(activeFilter)
                return <IconComponent className="w-6 h-6 text-white" />
              })()}
              <h2 className="text-xl font-bold text-white">{activeFilter}</h2>
              <span className="text-sm text-gray-400 ml-auto">
                {filteredResults.length} spot{filteredResults.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Category Cards */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {filterLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    className="w-full group relative overflow-hidden rounded-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {/* Background Image */}
                    <div className="relative h-70 w-full">
                      {getPhotoUrl(restaurant) ? (
                        <img 
                          src={getPhotoUrl(restaurant)!} 
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <Utensils className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </div>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 ">
                      <div className="flex items-end justify-between">
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-white text-lg leading-tight">
                            {restaurant.name}
                          </h3>
                          {restaurant.address && (
                            <p className="text-sm text-gray-300 mt-1 line-clamp-1">
                              {restaurant.address}
                            </p>
                          )}
                        </div>
                        {restaurant.google_rating && (
                          <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg ml-2">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-white">
                              {restaurant.google_rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No spots found for "{activeFilter}"
                </div>
              )}
            </div>
          </div>
        ) : !isOpen && !showCategoryView ? (
          /* cards shown when no search or category view is active */
          <div className="mt-4 space-y-3 backdrop-blur-xl bg-gray-900/10 border border-white/10 shadow-2xl z-50 overflow-y-auto scrollbar-hide rounded-2xl p-4 flex-1 min-h-0">
            {heroCategories.map((category) => (
              <button
                key={category.label}
                onClick={() => handleCardClick(category.label)}
                className="relative w-full group overflow-hidden rounded-2xl h-70 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* background */}
                <img 
                  src={category.image} 
                  alt={category.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                
                {/* content */}
                <div className="relative h-full flex items-center p-5">
                  <category.icon className="w-8 h-8 text-white mr-4" />
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">{category.label}</h3>
                    <p className="text-sm text-gray-300">{category.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Small category  buttons */}
        {!showCategoryView && activeFilter && filteredResults.length > 0 && !isOpen && (
          <div className="mt-2 backdrop-blur-xl bg-gray-900/5 border border-white/10 rounded-2xl shadow-2xl max-h-96 overflow-y-auto scrollbar-hide">
            {filterLoading ? (
              <div className="p-4 text-center text-gray-400">Loading...</div>
            ) : (
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
            )}
          </div>
       )}
      </div>
    )}
  </div>
)
}