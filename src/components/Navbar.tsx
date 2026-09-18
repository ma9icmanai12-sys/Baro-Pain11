import React, { useState } from 'react';
import { Activity, MapPin, RefreshCw, Search, Compass, AlertCircle } from 'lucide-react';
import { LocationItem } from '../types';

interface NavbarProps {
  currentLocation: string;
  onSelectLocation: (loc: LocationItem) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onDetectLocation: () => void;
}

const PRESET_CITIES: LocationItem[] = [
  { name: 'Seattle, WA, USA', lat: 47.6062, lon: -122.3321 },
  { name: 'Denver, CO, USA (High Elevation)', lat: 39.7392, lon: -104.9903 },
  { name: 'New York, NY, USA', lat: 40.7128, lon: -74.006 },
  { name: 'Chicago, IL, USA (Windy City)', lat: 41.8781, lon: -87.6298 },
  { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  onRefresh,
  isLoading,
  onDetectLocation,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="border-b border-cyan-500/20 bg-[#040A18]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron font-bold text-lg md:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                BAROMETRIC PAIN MONITOR
              </h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                BIO-CLINICAL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight">
              Atmospheric Biometrics • Granular Pain Formula Engine
            </p>
          </div>
        </div>

        {/* Location & Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* Location Badge & Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono text-cyan-300 transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[140px] sm:max-w-[190px] truncate font-semibold">
                {currentLocation}
              </span>
              <span className="text-[10px] text-slate-400 ml-1">Change ▼</span>
            </button>

            {/* Location Selector Dropdown */}
            {isSearchOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#060D1E] border border-cyan-500/40 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    Select Target Station
                  </span>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <input
                      id="navbar-city-search"
                      aria-label="Search city or zip code"
                      type="text"
                      placeholder="Search city or zip..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold rounded-lg transition-colors font-mono"
                  >
                    {isSearching ? '...' : 'Find'}
                  </button>
                </form>

                {/* GPS Detector button */}
                <button
                  onClick={() => {
                    onDetectLocation();
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 px-3 mb-3 rounded-lg bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
                  Use Current GPS Device Location
                </button>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-3">
                    <div className="text-[11px] text-slate-400 font-mono mb-1">Search Results:</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {searchResults.map((res, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onSelectLocation(res);
                            setIsSearchOpen(false);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded bg-slate-900/80 hover:bg-cyan-950 border border-transparent hover:border-cyan-500/30 text-xs text-slate-200 transition-colors truncate"
                        >
                          {res.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preset Cities */}
                <div>
                  <div className="text-[11px] text-slate-400 font-mono mb-1">Popular Microclimates:</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_CITIES.map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectLocation(city);
                          setIsSearchOpen(false);
                        }}
                        className="text-left px-2 py-1.5 rounded bg-slate-950 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-colors truncate"
                      >
                        {city.name.split(',')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh weather sensor data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-cyan-400/60 text-xs text-slate-300 hover:text-cyan-300 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline font-mono">Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
