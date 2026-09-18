import React, { useState } from 'react';
import { Sun, MapPin, RefreshCw, Search, Navigation, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { LocationItem } from '../types';
import { VoiceForecastButton } from './VoiceForecastButton';

interface SeniorNavbarProps {
  currentLocation: string;
  onSelectLocation: (loc: LocationItem) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onDetectLocation: () => void;
  isGpsActive: boolean;
  isLargeText: boolean;
  onToggleLargeText: () => void;
  onSpeakForecast?: () => void;
  isSpeaking?: boolean;
}

const POPULAR_TOWNS: LocationItem[] = [
  { name: 'Seattle, WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Phoenix, AZ (Warm & Dry)', lat: 33.4484, lon: -112.074 },
  { name: 'Miami, FL (Warm & Sunny)', lat: 25.7617, lon: -80.1918 },
  { name: 'Denver, CO (Mile High)', lat: 39.7392, lon: -104.9903 },
  { name: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
  { name: 'New York, NY', lat: 40.7128, lon: -74.006 },
  { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  { name: 'Dallas, TX', lat: 32.7767, lon: -96.797 },
];

export const SeniorNavbar: React.FC<SeniorNavbarProps> = ({
  currentLocation,
  onSelectLocation,
  onRefresh,
  isLoading,
  onDetectLocation,
  isGpsActive,
  isLargeText,
  onToggleLargeText,
  onSpeakForecast,
  isSpeaking = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5 self-start md:self-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <h1 className={`font-bold text-slate-900 leading-tight ${isLargeText ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
                Weather & Joint Pain Guide
              </h1>
              <p className={`text-slate-600 font-medium ${isLargeText ? 'text-base' : 'text-sm'}`}>
                Easy-to-read daily weather & arthritis forecast
              </p>
            </div>
          </div>

          {/* Quick Action Controls for Seniors */}
          <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
            {/* Talk Daily Forecast Button */}
            {onSpeakForecast && (
              <VoiceForecastButton
                onSpeak={onSpeakForecast}
                isSpeaking={isSpeaking}
                compact={true}
              />
            )}

            {/* Current Town Pill & Change Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-800 font-bold text-base transition-colors shadow-sm"
              title="Click to choose a different town"
            >
              <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
              <span className="max-w-[200px] truncate text-left">{currentLocation}</span>
              <span className="bg-sky-600 text-white text-xs px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                Change
              </span>
            </button>

            {/* Use My Real Location (GPS) */}
            <button
              onClick={onDetectLocation}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-base transition-colors shadow-sm ${
                isGpsActive
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
              title="Find my exact town automatically using device location"
            >
              <Navigation className={`w-5 h-5 ${isGpsActive ? 'text-emerald-600' : 'text-sky-600'}`} />
              <span className="hidden sm:inline">Use My Town</span>
            </button>

            {/* Large Print Button */}
            <button
              onClick={onToggleLargeText}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 font-bold text-base transition-colors shadow-sm ${
                isLargeText
                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
              }`}
              title="Make text larger or smaller for easy reading"
            >
              {isLargeText ? <ZoomOut className="w-5 h-5 text-amber-700" /> : <ZoomIn className="w-5 h-5 text-slate-700" />}
              <span>{isLargeText ? 'Standard Text' : 'Large Print'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center justify-center p-2.5 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 transition-colors shadow-sm"
              title="Check latest weather"
            >
              <RefreshCw className={`w-5 h-5 text-slate-700 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Change Town Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-sky-600" />
                <h2 className="text-2xl font-bold text-slate-900">Choose Your Town</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="mb-5">
              <label htmlFor="town-search-input" className="block text-base font-semibold text-slate-800 mb-2">
                Type the name of your city or town:
              </label>
              <div className="flex gap-2">
                <input
                  id="town-search-input"
                  type="text"
                  placeholder="e.g. Tampa, Boise, London"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 text-slate-900 text-lg focus:outline-hidden focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-lg shadow-sm flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  <span>{isSearching ? 'Searching...' : 'Find'}</span>
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Search Results:</p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onSelectLocation(res);
                        setIsModalOpen(false);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-900 font-bold text-base transition-colors flex items-center justify-between"
                    >
                      <span>{res.name}</span>
                      <Check className="w-5 h-5 text-sky-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Towns */}
            <div>
              <p className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">Or Pick a Popular Town:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_TOWNS.map((town, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectLocation(town);
                      setIsModalOpen(false);
                    }}
                    className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-base text-left transition-colors flex items-center justify-between"
                  >
                    <span>{town.name}</span>
                    <span className="text-sky-600 font-bold text-sm">Select</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-base"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
