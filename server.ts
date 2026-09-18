import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

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

    const weatherRes = await fetch(openMeteoUrl);
    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo responded with status ${weatherRes.status}`);
    }

    const data = await weatherRes.json();
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
