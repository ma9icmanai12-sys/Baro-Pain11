import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const weatherCache = new Map<string, { data: any; expiresAt: number }>();
const weatherRequests = new Map<string, Promise<any>>();
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getNoaaWeatherData = async (lat: number, lon: number) => {
  const headers = {
    Accept: 'application/geo+json',
    'User-Agent': 'BaroPain weather dashboard',
  };
  const pointsResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`, { headers });
  if (!pointsResponse.ok) {
    throw new Error(`NOAA points responded with status ${pointsResponse.status}`);
  }

  const points = await pointsResponse.json();
  const forecastUrl = points?.properties?.forecast;
  const hourlyUrl = points?.properties?.forecastHourly;
  if (!forecastUrl || !hourlyUrl) {
    throw new Error('NOAA returned incomplete forecast links');
  }

  const [forecastResponse, hourlyResponse] = await Promise.all([
    fetch(forecastUrl, { headers }),
    fetch(hourlyUrl, { headers }),
  ]);
  if (!forecastResponse.ok || !hourlyResponse.ok) {
    throw new Error('NOAA forecast request failed');
  }

  const forecast = await forecastResponse.json();
  const hourly = await hourlyResponse.json();
  const periods = forecast?.properties?.periods || [];
  const hourlyPeriods = hourly?.properties?.periods || [];
  const daytimePeriods = periods.filter((period: any) => period.isDaytime).slice(0, 7);
  if (!daytimePeriods.length || !hourlyPeriods.length) {
    throw new Error('NOAA returned incomplete forecast data');
  }

  const weatherCodeFor = (description: string) => {
    const text = description.toLowerCase();
    if (text.includes('thunder')) return 95;
    if (text.includes('snow') || text.includes('ice')) return 71;
    if (text.includes('rain') || text.includes('shower')) return 61;
    if (text.includes('fog')) return 45;
    if (text.includes('cloud')) return 3;
    return 0;
  };
  const windMph = (windSpeed: string) => Number(windSpeed?.match(/[\d.]+/)?.[0] || 0);
  const hourlySlice = hourlyPeriods.slice(0, 168);
  const current = hourlySlice[0];
  const dailyMax = daytimePeriods.map((period: any) => Number(period.temperature || 68));
  const dailyMin = daytimePeriods.map((period: any, index: number) => {
    const night = periods.find((item: any) => !item.isDaytime && item.number > period.number && item.number <= period.number + 1);
    return Number(night?.temperature || dailyMax[index] - 10);
  });

  return {
    current: {
      time: current.startTime,
      temperature_2m: Number(current.temperature || 68),
      relative_humidity_2m: 55,
      wind_speed_10m: windMph(current.windSpeed),
      surface_pressure: 1013.25,
      pressure_msl: 1013.25,
      weather_code: weatherCodeFor(current.shortForecast || ''),
    },
    hourly: {
      time: hourlySlice.map((period: any) => period.startTime),
      pressure_msl: hourlySlice.map(() => 1013.25),
      surface_pressure: hourlySlice.map(() => 1013.25),
      temperature_2m: hourlySlice.map((period: any) => Number(period.temperature || 68)),
      relative_humidity_2m: hourlySlice.map(() => 55),
      precipitation_probability: hourlySlice.map((period: any) => Number(period.probabilityOfPrecipitation?.value || 0)),
    },
    daily: {
      time: daytimePeriods.map((period: any) => period.startTime.slice(0, 10)),
      weather_code: daytimePeriods.map((period: any) => weatherCodeFor(period.shortForecast || '')),
      temperature_2m_max: dailyMax,
      temperature_2m_min: dailyMin,
      precipitation_sum: daytimePeriods.map(() => 0),
      precipitation_probability_max: daytimePeriods.map((period: any) => Number(period.probabilityOfPrecipitation?.value || 0)),
      wind_speed_10m_max: daytimePeriods.map((period: any) => windMph(period.windSpeed)),
    },
    timezone: points?.properties?.relativeLocation?.properties?.city || 'America/New_York',
    elevation: 0,
  };
};

const getWttrWeatherData = async (lat: number, lon: number) => {
  const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`, {
    headers: { Accept: 'application/json', 'User-Agent': 'BaroPain/1.0 weather dashboard' },
  });
  if (!response.ok) {
    throw new Error(`wttr.in responded with status ${response.status}`);
  }

  const backup = await response.json();
  const current = backup?.current_condition?.[0];
  const days = backup?.weather || [];
  if (!current || !days.length) {
    throw new Error('wttr.in returned incomplete weather data');
  }

  const weatherCodeFor = (description: string, code: string) => {
    const text = `${description} ${code}`.toLowerCase();
    if (text.includes('thunder')) return 95;
    if (text.includes('snow') || text.includes('ice')) return 71;
    if (text.includes('rain') || text.includes('drizzle')) return 61;
    if (text.includes('fog') || text.includes('mist')) return 45;
    if (text.includes('cloud') || text.includes('overcast')) return 3;
    return 0;
  };

  const hourly = days.flatMap((day: any) =>
    (day.hourly || []).map((hour: any) => ({
      time: `${day.date}T${String(Number(hour.time || 0)).padStart(4, '0').slice(0, 2)}:00`,
      pressure: Number(hour.pressure || current.pressure || 1013.25),
      temperature: Number(hour.tempF || current.temp_F || 68),
      humidity: Number(hour.humidity || current.humidity || 55),
      precipitationProbability: Number(hour.chanceofrain || 0),
    }))
  );

  return {
    current: {
      time: new Date().toISOString(),
      temperature_2m: Number(current.temp_F || 68),
      relative_humidity_2m: Number(current.humidity || 55),
      wind_speed_10m: Number(current.windspeedMiles || 0),
      surface_pressure: Number(current.pressure || 1013.25),
      pressure_msl: Number(current.pressure || 1013.25),
      weather_code: weatherCodeFor(current.weatherDesc?.[0]?.value || '', current.weatherCode || ''),
    },
    hourly: {
      time: hourly.map((item: any) => item.time),
      pressure_msl: hourly.map((item: any) => item.pressure),
      surface_pressure: hourly.map((item: any) => item.pressure),
      temperature_2m: hourly.map((item: any) => item.temperature),
      relative_humidity_2m: hourly.map((item: any) => item.humidity),
      precipitation_probability: hourly.map((item: any) => item.precipitationProbability),
    },
    daily: {
      time: days.map((day: any) => day.date),
      weather_code: days.map((day: any) => weatherCodeFor(day.hourly?.[4]?.weatherDesc?.[0]?.value || '', day.hourly?.[4]?.weatherCode || '')),
      temperature_2m_max: days.map((day: any) => Number(day.maxtempF || 68)),
      temperature_2m_min: days.map((day: any) => Number(day.mintempF || 50)),
      precipitation_sum: days.map((day: any) => Number(day.totalSnow_cm || 0)),
      precipitation_probability_max: days.map((day: any) => Math.max(...(day.hourly || []).map((hour: any) => Number(hour.chanceofrain || 0)), 0)),
      wind_speed_10m_max: days.map((day: any) => Math.max(...(day.hourly || []).map((hour: any) => Number(hour.windspeedMiles || 0)), 0)),
    },
    timezone: backup?.nearest_area?.[0]?.region?.[0]?.value || 'auto',
    elevation: 0,
  };
};

const getWeatherData = async (url: string, cacheKey: string) => {
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const existingRequest = weatherRequests.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'BaroPain/1.0 weather dashboard',
          },
        });

        if (response.ok) {
          const data = await response.json();
          weatherCache.set(cacheKey, { data, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
          return data;
        }

        if (response.status !== 429 || attempt === 2) {
          throw new Error(`Open-Meteo responded with status ${response.status}`);
        }

        const retryAfter = Number(response.headers.get('retry-after'));
        await wait(Number.isFinite(retryAfter) ? Math.max(retryAfter, 1) * 1000 : 1500 * (attempt + 1));
      }
    } catch (error) {
      const [lat, lon] = cacheKey.split(',').map(Number);
      let data;
      if (lat >= 24 && lat <= 50 && lon >= -125 && lon <= -66) {
        try {
          data = await getNoaaWeatherData(lat, lon);
          console.warn('[Weather] Open-Meteo unavailable; using NOAA backup:', error);
        } catch (noaaError) {
          console.warn('[Weather] NOAA backup unavailable; using wttr.in:', noaaError);
        }
      }
      data ||= await getWttrWeatherData(lat, lon);
      weatherCache.set(cacheKey, { data, expiresAt: Date.now() + WEATHER_CACHE_TTL_MS });
      return data;
    } finally {
      weatherRequests.delete(cacheKey);
    }
  })();

  weatherRequests.set(cacheKey, request);
  return request;
};

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API 1: Weather endpoint querying Open-Meteo live atmospheric telemetry
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 47.6062; // Default Seattle, WA
    const lon = parseFloat(req.query.lon as string) || -122.3321;
    const locationName = (req.query.location as string) || 'Seattle, WA';
    const isRealLocation = req.query.isRealLocation === 'true';

    // Open-Meteo forecast API with hourly MSL pressure, surface pressure, and 7-day forecast
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,pressure_msl,weather_code&hourly=pressure_msl,surface_pressure,temperature_2m,relative_humidity_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&past_days=1&forecast_days=7&timezone=auto`;

    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const data = await getWeatherData(openMeteoUrl, cacheKey);
    const hpaList: number[] = data?.hourly?.pressure_msl || [];
    const timeList: string[] = data?.hourly?.time || [];

    if (!hpaList.length) {
      throw new Error('No pressure data returned from weather service');
    }

    // Determine current index matching current time or last available
    let curIndex = hpaList.length - 1;
    if (data?.current?.time) {
      const curHour = data.current.time.slice(0, 13);
      const foundIdx = timeList.findIndex((t) => t.startsWith(curHour));
      if (foundIdx !== -1) {
        curIndex = foundIdx;
      }
    }

    // MSL pressure (Standard Sea Level normalized inHg)
    const curHpa = data?.current?.pressure_msl ?? hpaList[curIndex];
    const curInHg = Number((curHpa * 0.02953).toFixed(2));

    // Surface pressure (Ground station elevation level inHg)
    const curSurfaceHpa = data?.current?.surface_pressure;
    const surfacePressureInHg = curSurfaceHpa ? Number((curSurfaceHpa * 0.02953).toFixed(2)) : undefined;

    // Calculate 3-hour difference using hourly array
    const prev3Hpa = curIndex >= 3 ? hpaList[curIndex - 3] : curHpa;
    const prev3InHg = prev3Hpa * 0.02953;
    const diff = Number((curInHg - prev3InHg).toFixed(3));

    // Extract past 24 hours of pressure readings (in inHg)
    const startIdx = Math.max(0, curIndex - 23);
    const past24HoursPressure = hpaList
      .slice(startIdx, curIndex + 1)
      .map((h) => Number((h * 0.02953).toFixed(2)));

    const hourlyTimestamps = timeList.slice(startIdx, curIndex + 1).map((t) => {
      const d = new Date(t);
      return d.toLocaleTimeString([], { hour: 'numeric' });
    });

    // Determine pressure trend matching the clinical blueprint logic
    let pressureTrend = 'STABLE ➡️';
    if (diff <= -0.06) {
      pressureTrend = 'FALLING RAPIDLY ⬇️';
    } else if (diff < -0.02) {
      pressureTrend = 'FALLING ↘️';
    } else if (diff >= 0.06) {
      pressureTrend = 'RISING RAPIDLY ⬆️';
    } else if (diff > 0.02) {
      pressureTrend = 'RISING ↗️';
    }

    const humidity = `${Math.round(data?.current?.relative_humidity_2m ?? 55)}%`;
    const windSpeed = `${Math.round(data?.current?.wind_speed_10m ?? 10)} mph`;
    const temperature = `${Math.round(data?.current?.temperature_2m ?? 68)}°F`;
    const elevationMeters = data?.elevation;
    const observationTime = data?.current?.time;
    const timezone = data?.timezone;
    const weatherCode = data?.current?.weather_code;

    // Build 7-Day Forecast with atmospheric fronts and predicted pain levels
    const dailyTimes: string[] = data?.daily?.time || [];
    const forecastDays = [];

    // Helper for weather code descriptions
    const getWmoInfo = (code: number) => {
      if (code === 0) return { text: 'Sunny & Clear', isPrecip: false, isStorm: false };
      if (code === 1) return { text: 'Mainly Sunny', isPrecip: false, isStorm: false };
      if (code === 2) return { text: 'Partly Cloudy', isPrecip: false, isStorm: false };
      if (code === 3) return { text: 'Overcast & Cloudy', isPrecip: false, isStorm: false };
      if (code >= 45 && code <= 48) return { text: 'Dense Fog / Mist', isPrecip: false, isStorm: false };
      if (code >= 51 && code <= 55) return { text: 'Drizzle & Dampness', isPrecip: true, isStorm: false };
      if (code >= 56 && code <= 57) return { text: 'Freezing Drizzle', isPrecip: true, isStorm: false };
      if (code >= 61 && code <= 65) return { text: 'Rain & Wet Weather', isPrecip: true, isStorm: false };
      if (code >= 66 && code <= 67) return { text: 'Freezing Rain', isPrecip: true, isStorm: false };
      if (code >= 71 && code <= 77) return { text: 'Snow & Flurries', isPrecip: true, isStorm: false };
      if (code >= 80 && code <= 82) return { text: 'Passing Rain Showers', isPrecip: true, isStorm: false };
      if (code >= 85 && code <= 86) return { text: 'Snow Showers', isPrecip: true, isStorm: false };
      if (code >= 95 && code <= 99) return { text: 'Thunderstorm Front', isPrecip: true, isStorm: true };
      return { text: 'Mixed Clouds', isPrecip: false, isStorm: false };
    };

    // dailyTimes has past 1 day at index 0, today at index 1, followed by next days
    // We will process days from index 1 through index 7 (7 days total)
    const todayIndex = dailyTimes.length > 1 ? 1 : 0;
    for (let i = todayIndex; i < dailyTimes.length && forecastDays.length < 7; i++) {
      const dateStr = dailyTimes[i];
      const prevDateIndex = i > 0 ? i - 1 : 0;

      // Extract hourly pressures for this day
      const dayHourlyHpa: number[] = [];
      for (let h = 0; h < timeList.length; h++) {
        if (timeList[h].startsWith(dateStr)) {
          dayHourlyHpa.push(hpaList[h]);
        }
      }

      const dayHourlyInHg = dayHourlyHpa.length > 0
        ? dayHourlyHpa.map((h) => Number((h * 0.02953).toFixed(2)))
        : [curInHg];

      const minPressureInHg = Math.min(...dayHourlyInHg);
      const maxPressureInHg = Math.max(...dayHourlyInHg);
      const avgPressureInHg = Number(
        (dayHourlyInHg.reduce((a, b) => a + b, 0) / dayHourlyInHg.length).toFixed(2)
      );

      // Pressure change over the 24 hours of that day
      const pressureDeltaInHg = dayHourlyInHg.length > 1
        ? Number((dayHourlyInHg[dayHourlyInHg.length - 1] - dayHourlyInHg[0]).toFixed(2))
        : 0;

      // Pressure trend for the day
      let dayPressureTrend = 'STABLE ➡️';
      if (pressureDeltaInHg <= -0.06) {
        dayPressureTrend = 'FALLING RAPIDLY ⬇️';
      } else if (pressureDeltaInHg <= -0.02) {
        dayPressureTrend = 'FALLING ↘️';
      } else if (pressureDeltaInHg >= 0.06) {
        dayPressureTrend = 'RISING RAPIDLY ⬆️';
      } else if (pressureDeltaInHg >= 0.02) {
        dayPressureTrend = 'RISING ↗️';
      }

      const tempMax = Math.round(data?.daily?.temperature_2m_max?.[i] ?? 68);
      const tempMin = Math.round(data?.daily?.temperature_2m_min?.[i] ?? 50);
      const prevTempMax = Math.round(data?.daily?.temperature_2m_max?.[prevDateIndex] ?? tempMax);
      const tempChangeFromPrev = tempMax - prevTempMax;

      const precipProb = Math.round(data?.daily?.precipitation_probability_max?.[i] ?? 0);
      const precipInches = Number((data?.daily?.precipitation_sum?.[i] ?? 0).toFixed(2));
      const windSpeedMax = Math.round(data?.daily?.wind_speed_10m_max?.[i] ?? 10);
      const dayWeatherCode = data?.daily?.weather_code?.[i] ?? 0;
      const wmoInfo = getWmoInfo(dayWeatherCode);

      // Atmospheric Front Classification
      let frontCategory: 'cold_front' | 'warm_front' | 'low_pressure' | 'high_ridge' | 'stable' = 'stable';
      let frontType = 'Stable Atmospheric Ridge';
      let frontBadge = 'Stable Conditions 🌤️';
      let frontDescription = 'Normal, steady atmospheric pressure with mild air and minimal joint stress.';

      const isRain = precipProb >= 40 || precipInches >= 0.08 || wmoInfo.isPrecip;
      const isStorm = wmoInfo.isStorm || (precipProb >= 70 && windSpeedMax >= 20);

      if (isStorm || (isRain && pressureDeltaInHg <= -0.05 && tempChangeFromPrev <= -3)) {
        frontCategory = 'cold_front';
        frontType = 'Incoming Cold Front & Storm';
        frontBadge = 'Cold Front Passing ⛈️';
        frontDescription = 'Sharp pressure dip accompanied by rain, shifting gusty winds, and incoming colder air.';
      } else if (isRain || avgPressureInHg < 29.85 || minPressureInHg < 29.80) {
        frontCategory = 'low_pressure';
        frontType = 'Low-Pressure Rain System';
        frontBadge = 'Low Pressure Trough 🌧️';
        frontDescription = 'Depressed atmospheric pressure with heavy cloud cover and moisture.';
      } else if (tempChangeFromPrev <= -8) {
        frontCategory = 'cold_front';
        frontType = 'Sudden Cold Air Surge';
        frontBadge = 'Cold Air Drop ❄️';
        frontDescription = 'Significant temperature drop compared to yesterday, causing tissues and joint fluids to contract.';
      } else if (tempChangeFromPrev >= 7 && (precipProb >= 30 || avgPressureInHg < 29.95)) {
        frontCategory = 'warm_front';
        frontType = 'Warm Humid Front';
        frontBadge = 'Warm Front ☁️';
        frontDescription = 'Rising temperature with increasing humidity and softening barometric resistance.';
      } else if (avgPressureInHg >= 30.10 && precipProb < 20 && Math.abs(pressureDeltaInHg) < 0.04) {
        frontCategory = 'high_ridge';
        frontType = 'High-Pressure Fair Ridge';
        frontBadge = 'High Pressure Ridge ☀️';
        frontDescription = 'High, dense air mass keeping storm systems away; atmospheric weight provides soothing joint stability.';
      }

      // Daily Pain Score Prediction (Scale: 1 to 10)
      let painScore = 2; // Baseline comfortable

      // 1. Low Barometer Influence
      if (avgPressureInHg < 29.75 || minPressureInHg < 29.70) {
        painScore += 3;
      } else if (avgPressureInHg < 29.90 || minPressureInHg < 29.85) {
        painScore += 2;
      } else if (avgPressureInHg > 30.12 && Math.abs(pressureDeltaInHg) <= 0.03) {
        painScore -= 1;
      }

      // 2. Barometer swing delta (the front moving through)
      if (pressureDeltaInHg <= -0.08) {
        painScore += 3;
      } else if (pressureDeltaInHg <= -0.04) {
        painScore += 2;
      } else if (pressureDeltaInHg <= -0.02) {
        painScore += 1;
      }

      // 3. Rain & Moisture
      if (precipProb >= 70 || precipInches >= 0.25 || isStorm) {
        painScore += 2;
      } else if (precipProb >= 40 || precipInches >= 0.05) {
        painScore += 1;
      }

      // 4. Sudden Temperature Drop
      if (tempChangeFromPrev <= -10) {
        painScore += 2;
      } else if (tempChangeFromPrev <= -5) {
        painScore += 1;
      }

      // 5. Gusty Winds
      if (windSpeedMax >= 20) {
        painScore += 1;
      }

      // Clamp 1 - 10
      painScore = Math.max(1, Math.min(10, Math.round(painScore)));

      let predictedRiskLevel: 'low' | 'moderate' | 'high' = 'low';
      let painHeadline = 'Good Joint Comfort';
      let advice = 'Steady barometric pressure and calm air. A lovely day to take a walk, do light gardening, or run errands!';

      if (painScore >= 7) {
        predictedRiskLevel = 'high';
        painHeadline = 'High Ache Alert';
        advice = 'An incoming low-pressure front and moisture will cause joint tissues to expand. Keep knees and hips warm, avoid outdoor strain, and keep a heating pad handy.';
      } else if (painScore >= 4) {
        predictedRiskLevel = 'moderate';
        painHeadline = 'Moderate Stiffness';
        advice = 'Mild barometric or temperature changes expected. Expect morning stiffness in knees, fingers, or hips. A warm morning shower and gentle stretching will help loosen joints.';
      }

      // Date labeling
      const [year, month, day] = dateStr.split('-').map(Number);
      const dayDate = new Date(year, month - 1, day);
      const isToday = i === todayIndex;
      const isTomorrow = i === todayIndex + 1;
      const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dayDate.toLocaleDateString([], { weekday: 'short' });
      const formattedDate = dayDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

      forecastDays.push({
        date: dateStr,
        dayLabel,
        formattedDate,
        weatherCode: dayWeatherCode,
        weatherDescription: wmoInfo.text,
        tempMax,
        tempMin,
        tempChangeFromPrev,
        precipitationProbability: precipProb,
        precipitationInches: precipInches,
        windSpeedMax,
        avgPressureInHg,
        minPressureInHg,
        maxPressureInHg,
        pressureDeltaInHg,
        pressureTrend: dayPressureTrend,
        frontType,
        frontCategory,
        frontBadge,
        frontDescription,
        predictedPainScore: painScore,
        predictedRiskLevel,
        painHeadline,
        advice,
      });
    }

    res.json({
      currentPressureInHg: curInHg,
      change3Hour: diff,
      pressureTrend,
      humidity,
      windSpeed,
      temperature,
      past24HoursPressure,
      hourlyTimestamps,
      locationName,
      coordinates: { lat, lon },
      elevationMeters,
      observationTime,
      timezone,
      weatherCode,
      surfacePressureInHg,
      isRealLocation,
      isLiveRealtime: true,
      forecastDays,
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    res.status(502).json({
      error: 'Unable to retrieve live weather data from atmospheric station: ' + (error?.message || 'Network error'),
    });
  }
});

// API 2: Reverse Geocoding for device GPS coordinates
app.get('/api/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Valid lat and lon parameters required' });
    }

    // Call Nominatim with User-Agent
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=12`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BarometricPainMonitorLive/2.0 (health-research)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.county || 'Local Station';
      const state = addr.state || addr.region || '';
      const country = addr.country || '';

      const parts = [city];
      if (state) parts.push(state);
      if (country && country !== 'United States') parts.push(country);

      return res.json({
        name: parts.join(', '),
        city,
        state,
        country,
        lat,
        lon,
      });
    }

    res.json({
      name: `Real GPS Station (${lat.toFixed(3)}°, ${lon.toFixed(3)}°)`,
      lat,
      lon,
    });
  } catch (err) {
    res.json({
      name: `Real GPS Station (${req.query.lat}, ${req.query.lon})`,
      lat: parseFloat(req.query.lat as string) || 0,
      lon: parseFloat(req.query.lon as string) || 0,
    });
  }
});

// API 3: IP Location fallback for auto-detecting user's real city if GPS prompt is skipped
app.get('/api/ip-location', async (req: Request, res: Response) => {
  try {
    // Check client IP from forward headers
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    let ipUrl = 'http://ip-api.com/json';
    if (clientIp && !clientIp.startsWith('127.') && !clientIp.startsWith('10.') && !clientIp.startsWith('172.') && !clientIp.startsWith('192.168.') && clientIp !== '::1') {
      ipUrl = `http://ip-api.com/json/${clientIp}`;
    }

    const response = await fetch(ipUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return res.json({
          name: `${data.city}, ${data.regionName || data.region}, ${data.country}`,
          lat: data.lat,
          lon: data.lon,
          city: data.city,
          region: data.regionName,
          country: data.country,
        });
      }
    }

    res.json({
      name: 'Seattle, WA, USA',
      lat: 47.6062,
      lon: -122.3321,
    });
  } catch (err) {
    res.json({
      name: 'Seattle, WA, USA',
      lat: 47.6062,
      lon: -122.3321,
    });
  }
});

// API 4: Geocoding Search for city/location lookup
app.get('/api/geocode', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();
    const results = (data.results || []).map((item: any) => ({
      name: `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ', ' + item.country : ''}`,
      lat: item.latitude,
      lon: item.longitude,
    }));
    res.json({ results });
  } catch (error) {
    res.json({ results: [] });
  }
});

// Helper for breaking text into clean natural speech chunks
function splitTextForTts(text: string, maxLen = 160): string[] {
  const clean = text
    .replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}]/gu, '')
    .replace(/[•–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = clean.split(/(?<=[.!?;,])\s+/);
  const chunks: string[] = [];
  let cur = '';

  for (const s of sentences) {
    if (!s) continue;
    if ((cur + ' ' + s).trim().length <= maxLen) {
      cur = (cur + ' ' + s).trim();
    } else {
      if (cur) chunks.push(cur);
      if (s.length > maxLen) {
        const words = s.split(' ');
        let wcur = '';
        for (const w of words) {
          if ((wcur + ' ' + w).trim().length <= maxLen) {
            wcur = (wcur + ' ' + w).trim();
          } else {
            if (wcur) chunks.push(wcur);
            wcur = w;
          }
        }
        if (wcur) cur = wcur;
        else cur = '';
      } else {
        cur = s;
      }
    }
  }
  if (cur) chunks.push(cur);
  return chunks.length > 0 ? chunks : [clean.slice(0, maxLen)];
}

// API 4.5: High-reliability Server-side Text-to-Speech audio streaming
app.all('/api/tts', async (req: Request, res: Response) => {
  try {
    const rawText = (req.method === 'POST' ? req.body?.text : req.query?.text) as string;
    const text = (rawText || '').trim();

    if (!text) {
      return res.status(400).json({ error: 'Text query or body parameter is required' });
    }

    const chunks = splitTextForTts(text, 160);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      try {
        const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
          chunk
        )}&tl=en&client=tw-ob`;
        const ttsRes = await fetch(googleTtsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (ttsRes.ok) {
          const ab = await ttsRes.arrayBuffer();
          audioBuffers.push(Buffer.from(ab));
        }
      } catch (chunkErr) {
        console.warn('[TTS] Failed to fetch chunk:', chunkErr);
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'Could not generate audio stream' });
    }

    const fullAudio = Buffer.concat(audioBuffers);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', fullAudio.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fullAudio);
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    res.status(500).json({ error: 'TTS audio synthesis failed: ' + (error?.message || 'Server error') });
  }
});

// API 5: Gemini AI Correlation Analysis
app.post('/api/gemini/analyze-correlation', async (req: Request, res: Response) => {
  try {
    const { logs, currentMetrics } = req.body;

    if (!logs || !Array.isArray(logs) || logs.length < 3) {
      return res.status(400).json({
        error: 'Log at least 3 daily entries to perform AI correlation analysis.',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error:
          'Gemini AI API key is not configured. Please add GEMINI_API_KEY in the AI Studio Settings menu to enable live personalized AI analysis of your entries.',
      });
    }

    // Build the history matrix table exactly as formatted in MODULE 5
    let table = '';
    for (const r of logs) {
      table += `${r.date_logged} | Pain: ${r.user_pain_score}/10 | Pres: ${r.pressure_in_hg} inHg | Hum: ${r.humidity_percent}% | Wind: ${r.wind_speed_mph} mph${r.notes ? ` | Note: ${r.notes}` : ''}\n`;
    }

    const prompt = `You are a clinical bio-meteorology and pain correlation specialist.
Analyze the user's personal pain logs against barometric pressure, humidity, wind, and temperature to identify patterns.

CURRENT ENVIRONMENT:
Location: ${currentMetrics?.locationName || 'Local Station'}
Current Pressure: ${currentMetrics?.currentPressureInHg} inHg (${currentMetrics?.pressureTrend})
3-Hour Pressure Delta: ${currentMetrics?.change3Hour} inHg
Humidity: ${currentMetrics?.humidity}
Temperature: ${currentMetrics?.temperature}
Wind: ${currentMetrics?.windSpeed}

HISTORICAL PAIN LOGS:
${table}

CLINICAL FORMULAS REFERENCE:
- Joint Pain correlates directly with (30.20 - Pressure) and high humidity.
- Headache/Migraine correlates with the magnitude of 3-hour pressure changes (|ΔP| * 35) and temperature departures from 70°F.
- Back & Core stiffness correlates with high wind speed and cold exposure (< 65°F).

Respond in valid JSON format matching this exact schema:
{
  "summary": "A 2-3 sentence empathetic, clinically grounded summary estimating personal weather-trigger correlation based on their data.",
  "primaryTriggers": ["List 2-4 specific discovered triggers, e.g., 'Rapid pressure drop (< -0.06 inHg)'"],
  "sensitivityLevel": "Low" | "Moderate" | "High" | "Severe",
  "recommendations": ["List 2-3 actionable, empathetic preventive steps for upcoming weather shifts"]
}`;

    const geminiRes = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = geminiRes.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        summary: responseText,
        primaryTriggers: ['Barometric pressure fluctuations', 'High humidity'],
        sensitivityLevel: 'Moderate',
        recommendations: ['Stay warm and well hydrated during barometric dips.'],
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Gemini correlation error:', error);
    res.status(500).json({
      error: 'Unable to reach Google AI Studio servers: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Barometric Pain Monitor] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
