import React, { useState, useEffect, useRef } from 'react';
import { SeniorNavbar } from './components/SeniorNavbar';
import { SeniorMainRisk } from './components/SeniorMainRisk';
import { SeniorBodyAreas } from './components/SeniorBodyAreas';
import { SeniorBarometerExplainer } from './components/SeniorBarometerExplainer';
import { SeniorCheckIn } from './components/SeniorCheckIn';
import { SeniorAiDoctorTip } from './components/SeniorAiDoctorTip';
import { SeniorAdvancedSection } from './components/SeniorAdvancedSection';
import { PainCalculator, DbHelper, voiceService } from './services';
import { WeatherMetrics, PainScores, PainLogEntry, LocationItem } from './types';
import { AlertCircle, Loader2 } from 'lucide-react';

const DEFAULT_LOCATION: LocationItem = {
  name: 'Seattle, WA',
  lat: 47.6062,
  lon: -122.3321,
};

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(() => {
    try {
      const saved = localStorage.getItem('user_real_location');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LOCATION;
  });

  const [weather, setWeather] = useState<WeatherMetrics | null>(null);
  const [painScores, setPainScores] = useState<PainScores | null>(null);
  const [logs, setLogs] = useState<PainLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    return localStorage.getItem('senior_large_text') === 'true';
  });

  const [isGpsActive, setIsGpsActive] = useState<boolean>(() => {
    return !!localStorage.getItem('user_real_location');
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const unsub = voiceService.subscribe((state) => {
      setIsSpeaking(state.isSpeaking);
    });
    return () => {
      unsub();
      voiceService.stop();
    };
  }, []);

  const locRef = useRef<LocationItem>(currentLocation);
  locRef.current = currentLocation;

  // Toggle large text size
  const toggleLargeText = () => {
    setIsLargeText((prev) => {
      const next = !prev;
      localStorage.setItem('senior_large_text', next ? 'true' : 'false');
      return next;
    });
  };

  // Fetch real weather data
  const fetchWeatherData = async (loc: LocationItem, isReal = false, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);
    try {
      const query = new URLSearchParams({
        lat: loc.lat.toString(),
        lon: loc.lon.toString(),
        location: loc.name,
        isRealLocation: isReal ? 'true' : 'false',
      });

      const res = await fetch(`/api/weather?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Weather server returned HTTP ${res.status}`);
      }

      const data: WeatherMetrics = await res.json();
      setWeather(data);

      const scores = PainCalculator.calculateGranularPain(data);
      setPainScores(scores);

      // Prepare daily spoken forecast on load
      if (!isBackground) {
        voiceService.readForecastOnLoad(loc.name, data, scores);
      }
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setError('Unable to load current weather. Please check your connection or try again.');
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  // Device GPS detection
  const detectRealLocation = (isInitial = false) => {
    if (!navigator.geolocation) {
      if (isInitial) attemptIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const revRes = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
          let locName = `My Town (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`;
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData.name) {
              locName = revData.name;
            }
          }

          const gpsLoc: LocationItem = { name: locName, lat, lon };
          localStorage.setItem('user_real_location', JSON.stringify(gpsLoc));
          setCurrentLocation(gpsLoc);
          setIsGpsActive(true);
          fetchWeatherData(gpsLoc, true);
        } catch {
          const fallbackGpsLoc: LocationItem = {
            name: `My Town (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
            lat,
            lon,
          };
          localStorage.setItem('user_real_location', JSON.stringify(fallbackGpsLoc));
          setCurrentLocation(fallbackGpsLoc);
          setIsGpsActive(true);
          fetchWeatherData(fallbackGpsLoc, true);
        }
      },
      async () => {
        if (isInitial) {
          const saved = localStorage.getItem('user_real_location');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setCurrentLocation(parsed);
              setIsGpsActive(true);
              fetchWeatherData(parsed, true);
              return;
            } catch {}
          }
          await attemptIpLocation();
        } else {
          setLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Fallback IP location
  const attemptIpLocation = async () => {
    try {
      const res = await fetch('/api/ip-location');
      if (res.ok) {
        const data = await res.json();
        if (data.name && data.lat && data.lon) {
          const ipLoc: LocationItem = {
            name: data.name,
            lat: data.lat,
            lon: data.lon,
          };
          setCurrentLocation(ipLoc);
          fetchWeatherData(ipLoc, true);
          return;
        }
      }
    } catch {}
    fetchWeatherData(locRef.current, false);
  };

  // Initial load
  useEffect(() => {
    setLogs(DbHelper.getHistoryMatrix());

    const saved = localStorage.getItem('user_real_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentLocation(parsed);
        setIsGpsActive(true);
        fetchWeatherData(parsed, true);
      } catch {
        fetchWeatherData(DEFAULT_LOCATION, false);
      }
    } else {
      detectRealLocation(true);
    }
  }, []);

  // Background refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchWeatherData(locRef.current, isGpsActive, true);
    }, 60000);
    return () => clearInterval(timer);
  }, [isGpsActive]);

  // Handle location change
  const handleSelectLocation = (loc: LocationItem) => {
    setCurrentLocation(loc);
    setIsGpsActive(false);
    fetchWeatherData(loc, false);
  };

  // Manual GPS button
  const handleDetectLocation = () => {
    detectRealLocation(false);
  };

  const handleRefresh = () => {
    fetchWeatherData(currentLocation, isGpsActive);
    setLogs(DbHelper.getHistoryMatrix());
  };

  const handleLogsChanged = () => {
    setLogs(DbHelper.getHistoryMatrix());
  };

  const handleSpeakForecast = () => {
    if (isSpeaking) {
      voiceService.stop();
    } else if (weather) {
      const script = voiceService.generateForecastText(currentLocation.name, weather, painScores);
      voiceService.speak(script);
    }
  };

  return (
    <div className={`baro-shell min-h-screen flex flex-col antialiased ${isLargeText ? 'text-lg' : 'text-base'}`}>
      {/* Top Friendly Header */}
      <SeniorNavbar
        currentLocation={currentLocation.name}
        onSelectLocation={handleSelectLocation}
        onRefresh={handleRefresh}
        isLoading={loading}
        onDetectLocation={handleDetectLocation}
        isGpsActive={isGpsActive}
        isLargeText={isLargeText}
        onToggleLargeText={toggleLargeText}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-7">
        {/* Loading State */}
        {loading && !weather && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-12 text-center shadow-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-sky-100 border-2 border-sky-300 flex items-center justify-center text-sky-600 mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className={`font-bold text-slate-900 ${isLargeText ? 'text-3xl' : 'text-2xl'}`}>
              Checking Today's Weather & Barometer...
            </h2>
            <p className="text-slate-600 text-lg">
              Gathering live temperature, breeze, and air pressure readings for {currentLocation.name}.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-lg font-semibold">
              <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {weather && painScores && (
          <>
            {/* Prominent Voice Auto-Read & Status Banner */}
            {/* 1. Main Traffic-Light Status: Today's Overall Ache Risk */}
            <SeniorMainRisk
              weather={weather}
              painScores={painScores}
              isLargeText={isLargeText}
              locationName={currentLocation.name}
              isGpsActive={isGpsActive}
              onDetectLocation={handleDetectLocation}
              onSpeakForecast={handleSpeakForecast}
              isSpeaking={isSpeaking}
            />

            {/* 2. Three Common Body Areas: Knees/Joints, Head/Sinuses, Back/Neck */}
            <SeniorBodyAreas scores={painScores} isLargeText={isLargeText} />

            {/* 3. Barometer Explained in Simple Everyday Terms */}
            <SeniorBarometerExplainer weather={weather} isLargeText={isLargeText} />

            {/* 4. Super Simple Daily Joint Check-In (Big Tap Targets) */}
            <SeniorCheckIn
              weather={weather}
              logs={logs}
              onLogsChanged={handleLogsChanged}
              isLargeText={isLargeText}
            />

            {/* 5. Daily Comfort Advice from Dr. Weather Helper (AI Nurse/Doctor) */}
            <SeniorAiDoctorTip
              logs={logs}
              weather={weather}
              isLargeText={isLargeText}
              onLogsUpdated={handleLogsChanged}
            />

            {/* 6. Optional: 24-Hour Barometer Graph & Advanced Technical Numbers */}
            <SeniorAdvancedSection weather={weather} isLargeText={isLargeText} />
          </>
        )}
      </main>

      {/* Simple, Comforting Footer */}
      <footer className="baro-footer border-t-2 py-6 px-4 text-center text-slate-500 font-medium text-base space-y-1">
        <p className="text-slate-800 font-bold">
          BaroPain • Designed for easy daily reading
        </p>
        <p className="text-sm text-slate-500">
          Always consult with your family doctor or healthcare provider for medical decisions.
        </p>
      </footer>
    </div>
  );
}
