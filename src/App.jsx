import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Header from './components/Header.jsx'
import SearchBar from './components/SearchBar.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import FiltersDrawer, { FilterButton } from './components/FiltersDrawer.jsx'
import MapListToggle from './components/MapListToggle.jsx'
import PropertyGrid from './components/PropertyGrid.jsx'
import MapPanel from './components/MapPanel.jsx'
import PropertyDetailModal from './components/PropertyDetailModal.jsx'
import ApplicationModal from './components/ApplicationModal.jsx'
import RequestCallModal from './components/RequestCallModal.jsx'
import SavedRoomsView from './components/SavedRoomsView.jsx'
import ApplicationsView from './components/ApplicationsView.jsx'
import MarketingSections from './components/MarketingSections.jsx'
import Footer from './components/Footer.jsx'
import MobileNavigation from './components/MobileNavigation.jsx'
import { properties } from './data/properties.js'
import { defaultFilters, initialSearch } from './data/uiDefaults.js'
import { usePersistentState } from './hooks/usePersistentState.js'
import { getRent } from './utils/pricing.js'

export default function App() {
  const [view, setView] = useState('browse')
  const [draftSearch, setDraftSearch] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch)
  const [category, setCategory] = useState('all')
  const [filters, setFilters] = useState(defaultFilters)
  const [sort, setSort] = useState('recommended')
  const [showMap, setShowMap] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [applicationContext, setApplicationContext] = useState(null)
  const [callContext, setCallContext] = useState(null)
  const [favorites, setFavorites] = usePersistentState('smartroomz:favorites', [])
  const [applications, setApplications] = usePersistentState('smartroomz:applications', [])
  const [, setCallRequests] = usePersistentState('smartroomz:call-requests', [])
  const searchRef = useRef(null)

  const toggleFavorite = (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const clearFilters = () => { setFilters(defaultFilters); setCategory('all'); setDraftSearch(initialSearch); setSearch(initialSearch) }
  const filterCount = filters.areas.length + ['minPrice', 'maxPrice'].filter((key) => filters[key] !== '').length + ['under200', 'fast'].filter((key) => filters[key]).length + ['roomType', 'paymentPlan'].filter((key) => filters[key] !== 'any').length

  const filteredProperties = useMemo(() => {
    const location = search.location.trim().toLowerCase()
    const plan = filters.paymentPlan === 'any' ? search.paymentPlan : filters.paymentPlan
    const min = Number(filters.minPrice || 0)
    const max = Number(filters.maxPrice || Infinity)
    const moveIn = search.moveInDate
    const roomType = filters.roomType === 'any' ? search.roomType : filters.roomType
    const results = properties.filter((property) => {
      const locationMatch = !location || ['atlanta', 'atlanta, ga', 'metro atlanta'].includes(location) || `${property.title} ${property.area} ${property.city} ${property.state} ${property.zip}`.toLowerCase().includes(location)
      const price = getRent(property, plan)
      const categoryMatch = category === 'all' || (category === 'featured' && property.featured) || (category === 'under200' && price < 200) || (category === 'fast' && /available now|fast|ready/i.test(property.availability)) || property.area === category
      return locationMatch && categoryMatch && (!filters.areas.length || filters.areas.includes(property.area)) && price >= min && price <= max && (!filters.under200 || price < 200) && (!filters.fast || /available now|fast|ready/i.test(property.availability)) && (roomType === 'any' || property.roomType === roomType) && (!moveIn || property.earliestMoveInDate <= moveIn)
    })
    return [...results].sort((a, b) => sort === 'price-low' ? getRent(a, plan) - getRent(b, plan) : sort === 'price-high' ? getRent(b, plan) - getRent(a, plan) : sort === 'rating' ? b.rating - a.rating : Number(b.featured) - Number(a.featured))
  }, [search, category, filters, sort])

  const plan = filters.paymentPlan === 'any' ? search.paymentPlan : filters.paymentPlan
  const openApply = (context) => { setSelectedProperty(null); setApplicationContext(context) }
  const openCall = (context = {}) => { setSelectedProperty(null); setCallContext(context) }
  const browse = () => { setView('browse'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <div className="app">
    <Header currentView={view} setView={setView} savedCount={favorites.length} onSearchFocus={() => { setView('browse'); setTimeout(() => searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0) }} onRequestCall={() => openCall()} />
    {view === 'browse' && <>
      <SearchBar draft={draftSearch} setDraft={setDraftSearch} searchRef={searchRef} onSearch={() => { setSearch(draftSearch); document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' }) }} />
      <CategoryNav selected={category} onSelect={setCategory} rightControls={<div className="category-controls"><FilterButton count={filterCount} onClick={() => setFiltersOpen(true)} /><label className="sort-control">Sort<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={14} /></label></div>} />
      <main className="listing-section" id="rooms"><div className="listing-heading"><div><p className="eyebrow">Furnished rooms · Flexible terms</p><h1>{search.location ? `Rooms near ${search.location}` : 'Find your next room'}</h1><p>{filteredProperties.length} {filteredProperties.length === 1 ? 'stay' : 'stays'} available</p></div><MapListToggle showMap={showMap} setShowMap={setShowMap} /></div><div className={showMap ? 'results-layout map-open' : 'results-layout'}><PropertyGrid properties={filteredProperties} plan={plan} favorites={favorites} onFavorite={toggleFavorite} onOpen={setSelectedProperty} onClear={clearFilters} />{showMap && <MapPanel properties={filteredProperties} onOpen={setSelectedProperty} />}</div></main>
      <MarketingSections onBrowse={browse} onRequestCall={() => openCall()} />
    </>}
    {view === 'saved' && <SavedRoomsView properties={properties.filter((item) => favorites.includes(item.id))} plan={plan} favorites={favorites} onFavorite={toggleFavorite} onOpen={setSelectedProperty} onBrowse={browse} />}
    {view === 'applications' && <ApplicationsView applications={applications} onBrowse={browse} />}
    <Footer setView={setView} onRequestCall={() => openCall()} />
    <MobileNavigation view={view} setView={setView} onRequestCall={() => openCall()} />
    <FiltersDrawer open={filtersOpen} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} onClear={() => setFilters(defaultFilters)} resultCount={filteredProperties.length} />
    {selectedProperty && <PropertyDetailModal property={selectedProperty} initialPlan={plan} initialDate={search.moveInDate} isFavorite={favorites.includes(selectedProperty.id)} onFavorite={() => toggleFavorite(selectedProperty.id)} onApply={openApply} onRequestCall={openCall} onClose={() => setSelectedProperty(null)} />}
    {applicationContext && <ApplicationModal context={applicationContext} onSubmit={(application) => setApplications((current) => [application, ...current])} onClose={() => setApplicationContext(null)} />}
    {callContext && <RequestCallModal property={callContext.property} moveInDate={callContext.moveInDate} properties={properties} onSubmit={(request) => setCallRequests((current) => [request, ...current])} onClose={() => setCallContext(null)} />}
  </div>
}
