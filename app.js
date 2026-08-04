/* ==========================================================================
   AETHER WEATHER - JAVASCRIPT APPLICATION CORE
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. WMO Weather Code Interpreter & Mapping Dictionary
  // --------------------------------------------------------------------------
  const WMO_WEATHER_MAP = {
    0: { desc: 'Clear Sky', icon: 'fa-sun', nightIcon: 'fa-moon', theme: 'clear', particles: 'sun/stars' },
    1: { desc: 'Mainly Clear', icon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon', theme: 'clear', particles: 'clouds' },
    2: { desc: 'Partly Cloudy', icon: 'fa-cloud-sun', nightIcon: 'fa-cloud-moon', theme: 'clear', particles: 'clouds' },
    3: { desc: 'Overcast', icon: 'fa-cloud', nightIcon: 'fa-cloud', theme: 'cloudy', particles: 'clouds' },
    45: { desc: 'Foggy', icon: 'fa-smog', nightIcon: 'fa-smog', theme: 'fog', particles: 'fog' },
    48: { desc: 'Rime Fog', icon: 'fa-smog', nightIcon: 'fa-smog', theme: 'fog', particles: 'fog' },
    51: { desc: 'Light Drizzle', icon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain', theme: 'rain', particles: 'drizzle' },
    53: { desc: 'Moderate Drizzle', icon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain', theme: 'rain', particles: 'rain' },
    55: { desc: 'Dense Drizzle', icon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy', theme: 'rain', particles: 'rain' },
    61: { desc: 'Slight Rain', icon: 'fa-cloud-rain', nightIcon: 'fa-cloud-rain', theme: 'rain', particles: 'rain' },
    63: { desc: 'Moderate Rain', icon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy', theme: 'rain', particles: 'rain' },
    65: { desc: 'Heavy Rain', icon: 'fa-cloud-showers-water', nightIcon: 'fa-cloud-showers-water', theme: 'rain', particles: 'heavy-rain' },
    66: { desc: 'Freezing Rain', icon: 'fa-cloud-meatball', nightIcon: 'fa-cloud-meatball', theme: 'snow', particles: 'snow' },
    67: { desc: 'Heavy Freezing Rain', icon: 'fa-cloud-meatball', nightIcon: 'fa-cloud-meatball', theme: 'snow', particles: 'snow' },
    71: { desc: 'Slight Snow', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'snow' },
    73: { desc: 'Moderate Snow', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'snow' },
    75: { desc: 'Heavy Snow', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'heavy-snow' },
    77: { desc: 'Snow Grains', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'snow' },
    80: { desc: 'Slight Rain Showers', icon: 'fa-cloud-sun-rain', nightIcon: 'fa-cloud-moon-rain', theme: 'rain', particles: 'rain' },
    81: { desc: 'Moderate Rain Showers', icon: 'fa-cloud-showers-heavy', nightIcon: 'fa-cloud-showers-heavy', theme: 'rain', particles: 'rain' },
    82: { desc: 'Violent Rain Showers', icon: 'fa-cloud-showers-water', nightIcon: 'fa-cloud-showers-water', theme: 'rain', particles: 'heavy-rain' },
    85: { desc: 'Slight Snow Showers', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'snow' },
    86: { desc: 'Heavy Snow Showers', icon: 'fa-snowflake', nightIcon: 'fa-snowflake', theme: 'snow', particles: 'heavy-snow' },
    95: { desc: 'Thunderstorm', icon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt', theme: 'thunder', particles: 'thunder' },
    96: { desc: 'Thunderstorm with Hail', icon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt', theme: 'thunder', particles: 'thunder' },
    99: { desc: 'Heavy Thunderstorm', icon: 'fa-cloud-bolt', nightIcon: 'fa-cloud-bolt', theme: 'thunder', particles: 'thunder' }
  };

  function getWeatherMeta(code, isDay = 1) {
    const meta = WMO_WEATHER_MAP[code] || { desc: 'Unknown Weather', icon: 'fa-cloud', nightIcon: 'fa-cloud', theme: 'clear', particles: 'clouds' };
    const iconClass = isDay ? meta.icon : (meta.nightIcon || meta.icon);
    return { ...meta, iconClass, isDay };
  }

  // --------------------------------------------------------------------------
  // 2. Application State Management
  // --------------------------------------------------------------------------
  const state = {
    unit: 'cmetric', // 'cmetric' (°C, km/h) or 'imperial' (°F, mph)
    currentLocation: {
      name: 'London',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278
    },
    weatherData: null,
    airQualityData: null,
    searchDebounceTimer: null,
    activeHourlyTab: 'cards' // 'cards' or 'chart'
  };

  // --------------------------------------------------------------------------
  // 3. DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    geoBtn: document.getElementById('geo-btn'),
    searchResults: document.getElementById('search-results'),
    unitBtns: document.querySelectorAll('.unit-btn'),
    
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    dashboard: document.getElementById('dashboard'),
    
    // Hero Card
    cityName: document.getElementById('city-name'),
    countryName: document.getElementById('country-name'),
    currentDate: document.getElementById('current-date'),
    currentTemp: document.getElementById('current-temp'),
    unitSymbol: document.getElementById('unit-symbol'),
    weatherText: document.getElementById('weather-text'),
    tempRange: document.getElementById('temp-range'),
    heroIcon: document.getElementById('hero-icon'),
    feelsLikeVal: document.getElementById('feels-like-val'),
    precipVal: document.getElementById('precip-val'),
    windQuickVal: document.getElementById('wind-quick-val'),
    uvQuickVal: document.getElementById('uv-quick-val'),
    
    // Detailed Metrics
    humidityVal: document.getElementById('humidity-val'),
    humidityBar: document.getElementById('humidity-bar'),
    dewPointText: document.getElementById('dew-point-text'),
    windSpeedVal: document.getElementById('wind-speed-val'),
    windUnitLabel: document.getElementById('wind-unit-label'),
    compassArrow: document.getElementById('compass-arrow'),
    windDirectionText: document.getElementById('wind-direction-text'),
    pressureVal: document.getElementById('pressure-val'),
    visibilityVal: document.getElementById('visibility-val'),
    visUnitLabel: document.getElementById('vis-unit-label'),
    uvIndexVal: document.getElementById('uv-index-val'),
    uvCategory: document.getElementById('uv-category'),
    uvBar: document.getElementById('uv-bar'),
    cloudCoverVal: document.getElementById('cloud-cover-val'),
    cloudBar: document.getElementById('cloud-bar'),
    cloudDesc: document.getElementById('cloud-desc'),
    
    // Hourly & Chart
    tabCardsBtn: document.getElementById('tab-cards-btn'),
    tabChartBtn: document.getElementById('tab-chart-btn'),
    hourlyCardsContainer: document.getElementById('hourly-cards-container'),
    hourlyChartWrapper: document.getElementById('hourly-chart-wrapper'),
    hourlyChartCanvas: document.getElementById('hourly-chart-canvas'),
    
    // Daily Forecast
    dailyForecastList: document.getElementById('daily-forecast-list'),
    
    // AQI Widget
    aqiScore: document.getElementById('aqi-score'),
    aqiStatus: document.getElementById('aqi-status'),
    aqiGaugeFill: document.getElementById('aqi-gauge-fill'),
    pm25Val: document.getElementById('pm25-val'),
    pm10Val: document.getElementById('pm10-val'),
    no2Val: document.getElementById('no2-val'),
    o3Val: document.getElementById('o3-val'),
    
    // Sun Tracker
    sunPositionDot: document.getElementById('sun-position-dot'),
    sunriseVal: document.getElementById('sunrise-val'),
    sunsetVal: document.getElementById('sunset-val'),
    daylightVal: document.getElementById('daylight-val'),
    
    // Background Canvas
    bgCanvas: document.getElementById('weather-bg-canvas'),
    ambientGlow: document.getElementById('ambient-glow')
  };

  // --------------------------------------------------------------------------
  // 4. Background Canvas Particle Engine
  // --------------------------------------------------------------------------
  const particleEngine = {
    canvas: DOM.bgCanvas,
    ctx: DOM.bgCanvas.getContext('2d'),
    particles: [],
    animationFrameId: null,
    currentParticleType: 'sun/stars',
    isDayTime: 1,

    init() {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.animate();
    },

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.createParticles(this.currentParticleType);
    },

    setParticleType(type, isDay = 1) {
      this.currentParticleType = type;
      this.isDayTime = isDay;
      this.createParticles(type);
    },

    createParticles(type) {
      this.particles = [];
      const w = this.canvas.width;
      const h = this.canvas.height;
      
      let count = 60;
      if (type.includes('rain')) count = 150;
      if (type.includes('heavy')) count = 280;
      if (type.includes('snow')) count = 90;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 3 + 1,
          speedY: type.includes('rain') ? Math.random() * 8 + 12 : (type.includes('snow') ? Math.random() * 1.5 + 0.5 : Math.random() * 0.5 + 0.1),
          speedX: type.includes('snow') ? Math.sin(i) * 1.2 : (type.includes('rain') ? -1.5 : (Math.random() - 0.5) * 0.3),
          opacity: Math.random() * 0.7 + 0.3,
          pulse: Math.random() * 0.05
        });
      }
    },

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const w = this.canvas.width;
      const h = this.canvas.height;

      this.particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > h) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;

        this.ctx.beginPath();
        if (this.currentParticleType.includes('rain')) {
          this.ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.6})`;
          this.ctx.lineWidth = p.size * 0.6;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.speedY * 1.5);
          this.ctx.stroke();
        } else if (this.currentParticleType.includes('snow')) {
          this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.8})`;
          this.ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Stars (night) or subtle sunny floaters (day)
          this.ctx.fillStyle = this.isDayTime ? `rgba(251, 191, 36, ${p.opacity * 0.3})` : `rgba(255, 255, 255, ${p.opacity * 0.7})`;
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
      });

      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  };

  // --------------------------------------------------------------------------
  // 5. Open-Meteo API Service
  // --------------------------------------------------------------------------
  async function fetchGeocoding(query) {
    let results = [];

    // 1. Primary: OpenStreetMap Nominatim API (Every street, road, hamlet, village, town, borough, landmark, postal code)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=8`;
      const res = await fetch(nominatimUrl, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        results = data.map(item => {
          const addr = item.address || {};
          const mainName = addr.road || addr.village || addr.town || addr.suburb || addr.neighbourhood || addr.city || item.name || query;
          
          const subParts = [
            addr.suburb || addr.neighbourhood || addr.village || addr.town,
            addr.city || addr.county || addr.district,
            addr.state || addr.region,
            addr.country
          ].filter((part, i, arr) => part && part !== mainName && arr.indexOf(part) === i);

          return {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            name: mainName,
            subText: subParts.join(', '),
            country: addr.country || '',
            fullAddress: item.display_name,
            type: item.type || item.class || 'location'
          };
        });
      }
    } catch (e) {
      console.warn('Nominatim search fallback to Open-Meteo', e);
    }

    // 2. Secondary Fallback: Open-Meteo Geocoding API if Nominatim returns nothing
    if (results.length === 0) {
      try {
        const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
        const res = await fetch(openMeteoUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            results = data.results.map(item => ({
              latitude: item.latitude,
              longitude: item.longitude,
              name: item.name,
              subText: [item.admin2, item.admin1, item.country].filter(Boolean).join(', '),
              country: item.country || '',
              fullAddress: `${item.name}, ${item.admin1 || ''} ${item.country || ''}`,
              type: 'city'
            }));
          }
        }
      } catch (e) {
        console.error('Geocoding error', e);
      }
    }

    return results;
  }

  async function fetchReverseGeocode(lat, lon) {
    // Reverse Geocoding with Nominatim to resolve exact street/town
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const mainName = addr.road || addr.neighbourhood || addr.suburb || addr.village || addr.town || addr.city || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
        const subParts = [
          addr.suburb || addr.village || addr.town,
          addr.city || addr.county,
          addr.state,
          addr.country
        ].filter((part, i, arr) => part && part !== mainName && arr.indexOf(part) === i);

        return {
          name: mainName,
          country: subParts.join(', ') || addr.country || ''
        };
      }
    } catch (e) {
      console.warn('Reverse geocode fallback', e);
    }

    // Fallback to Open-Meteo
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return {
            name: data.results[0].name,
            country: data.results[0].country || ''
          };
        }
      }
    } catch (e) {}

    return { name: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, country: '' };
  }

  async function fetchWeatherData(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,weather_code,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone`;

    const [wRes, aRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(aqiUrl).catch(() => null)
    ]);

    if (!wRes.ok) throw new Error('Failed to retrieve weather data');
    
    const weather = await wRes.json();
    let airQuality = null;
    if (aRes && aRes.ok) {
      airQuality = await aRes.json();
    }

    return { weather, airQuality };
  }

  // --------------------------------------------------------------------------
  // 6. Temperature & Speed Unit Conversion Helpers
  // --------------------------------------------------------------------------
  function formatTemp(tempC) {
    if (tempC === null || tempC === undefined) return '--';
    if (state.unit === 'imperial') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  }

  function formatSpeed(speedKmh) {
    if (speedKmh === null || speedKmh === undefined) return '--';
    if (state.unit === 'imperial') {
      return Math.round(speedKmh * 0.621371);
    }
    return Math.round(speedKmh);
  }

  function getUnitSymbols() {
    return {
      temp: state.unit === 'imperial' ? '°F' : '°C',
      speed: state.unit === 'imperial' ? 'mph' : 'km/h',
      vis: state.unit === 'imperial' ? 'mi' : 'km'
    };
  }

  // --------------------------------------------------------------------------
  // 7. Render UI Components
  // --------------------------------------------------------------------------
  function renderAll() {
    if (!state.weatherData) return;
    
    const { weather, airQuality } = state.weatherData;
    const current = weather.current;
    const daily = weather.daily;
    const hourly = weather.hourly;
    const units = getUnitSymbols();

    const meta = getWeatherMeta(current.weather_code, current.is_day);

    // Update Theme & Background
    document.body.className = `theme-${meta.theme}`;
    particleEngine.setParticleType(meta.particles, current.is_day);

    // 1. Hero Card
    DOM.cityName.textContent = state.currentLocation.name;
    DOM.countryName.textContent = state.currentLocation.country || '';
    
    const now = new Date();
    DOM.currentDate.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    DOM.currentTemp.textContent = formatTemp(current.temperature_2m);
    DOM.unitSymbol.textContent = units.temp;
    DOM.weatherText.textContent = meta.desc;
    
    const maxToday = formatTemp(daily.temperature_2m_max[0]);
    const minToday = formatTemp(daily.temperature_2m_min[0]);
    DOM.tempRange.textContent = `High: ${maxToday}${units.temp} • Low: ${minToday}${units.temp}`;
    
    DOM.heroIcon.className = `fa-solid ${meta.iconClass} weather-hero-icon`;

    // Hero Footer Quick Metrics
    DOM.feelsLikeVal.textContent = `${formatTemp(current.apparent_temperature)}${units.temp}`;
    DOM.precipVal.textContent = `${daily.precipitation_probability_max[0] || 0}%`;
    DOM.windQuickVal.textContent = `${formatSpeed(current.wind_speed_10m)} ${units.speed}`;
    
    const uvNow = hourly.uv_index ? Math.round(hourly.uv_index[now.getHours()] || 0) : 0;
    DOM.uvQuickVal.textContent = uvNow;

    // 2. Metrics Grid
    DOM.humidityVal.textContent = `${current.relative_humidity_2m}%`;
    DOM.humidityBar.style.width = `${current.relative_humidity_2m}%`;
    const dewC = hourly.dew_point_2m ? hourly.dew_point_2m[now.getHours()] : null;
    DOM.dewPointText.textContent = `Dew point: ${formatTemp(dewC)}${units.temp}`;

    DOM.windSpeedVal.innerHTML = `${formatSpeed(current.wind_speed_10m)} <small>${units.speed}</small>`;
    DOM.windUnitLabel.textContent = units.speed;
    DOM.compassArrow.style.transform = `rotate(${current.wind_direction_10m}deg)`;
    DOM.windDirectionText.textContent = `Direction: ${current.wind_direction_10m}°`;

    DOM.pressureVal.innerHTML = `${Math.round(current.surface_pressure)} <small>hPa</small>`;
    
    const visMeters = hourly.visibility ? hourly.visibility[now.getHours()] : 10000;
    const visConverted = state.unit === 'imperial' ? (visMeters / 1609.34).toFixed(1) : (visMeters / 1000).toFixed(1);
    DOM.visibilityVal.innerHTML = `${visConverted} <small>${units.vis}</small>`;
    DOM.visUnitLabel.textContent = units.vis;

    // UV Card
    DOM.uvIndexVal.textContent = uvNow;
    DOM.uvBar.style.width = `${Math.min((uvNow / 11) * 100, 100)}%`;
    let uvCat = 'Low';
    if (uvNow >= 3) uvCat = 'Moderate';
    if (uvNow >= 6) uvCat = 'High';
    if (uvNow >= 8) uvCat = 'Very High';
    if (uvNow >= 11) uvCat = 'Extreme';
    DOM.uvCategory.textContent = uvCat;

    // Cloud Cover
    DOM.cloudCoverVal.textContent = `${current.cloud_cover}%`;
    DOM.cloudBar.style.width = `${current.cloud_cover}%`;
    DOM.cloudDesc.textContent = current.cloud_cover > 70 ? 'Cloudy sky' : (current.cloud_cover > 30 ? 'Partly cloudy' : 'Clear sky');

    // 3. Hourly Forecast Scroll Cards
    renderHourlyCards(hourly, now.getHours());
    renderHourlyChart(hourly, now.getHours());

    // 4. 7-Day Forecast List
    renderDailyForecast(daily);

    // 5. AQI Widget
    if (airQuality && airQuality.current) {
      const aqi = airQuality.current.us_aqi || 25;
      DOM.aqiScore.textContent = Math.round(aqi);
      
      let status = 'Good';
      let offset = 157 - (Math.min(aqi, 300) / 300) * 157;
      if (aqi > 50) status = 'Moderate';
      if (aqi > 100) status = 'Unhealthy (SG)';
      if (aqi > 150) status = 'Unhealthy';
      if (aqi > 200) status = 'Very Unhealthy';
      DOM.aqiStatus.textContent = status;
      DOM.aqiGaugeFill.style.strokeDashoffset = offset;

      DOM.pm25Val.textContent = Math.round(airQuality.current.pm2_5 || 0);
      DOM.pm10Val.textContent = Math.round(airQuality.current.pm10 || 0);
      DOM.no2Val.textContent = Math.round(airQuality.current.nitrogen_dioxide || 0);
      DOM.o3Val.textContent = Math.round(airQuality.current.ozone || 0);
    }

    // 6. Sun Arc Tracker
    renderSunTracker(daily.sunrise[0], daily.sunset[0]);
  }

  function renderHourlyCards(hourly, currentHour) {
    DOM.hourlyCardsContainer.innerHTML = '';
    const units = getUnitSymbols();

    // Render next 24 hours
    for (let i = currentHour; i < currentHour + 24; i++) {
      if (!hourly.time[i]) break;
      const dateObj = new Date(hourly.time[i]);
      const hourStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      const tempVal = formatTemp(hourly.temperature_2m[i]);
      const popVal = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
      const code = hourly.weather_code[i];
      const isDay = dateObj.getHours() >= 6 && dateObj.getHours() <= 19 ? 1 : 0;
      const meta = getWeatherMeta(code, isDay);

      const cardHtml = `
        <div class="hourly-item-card">
          <span class="hourly-time">${hourStr}</span>
          <i class="fa-solid ${meta.iconClass} hourly-icon"></i>
          <span class="hourly-temp">${tempVal}${units.temp}</span>
          <span class="hourly-pop"><i class="fa-solid fa-droplet"></i> ${popVal}%</span>
        </div>
      `;
      DOM.hourlyCardsContainer.insertAdjacentHTML('beforeend', cardHtml);
    }
  }

  function renderHourlyChart(hourly, currentHour) {
    const canvas = DOM.hourlyChartCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Collect next 12 hours data points
    const points = [];
    const labels = [];
    for (let i = currentHour; i < currentHour + 12; i++) {
      if (!hourly.time[i]) break;
      points.push(formatTemp(hourly.temperature_2m[i]));
      const dateObj = new Date(hourly.time[i]);
      labels.push(dateObj.toLocaleTimeString('en-US', { hour: 'numeric' }));
    }

    if (points.length === 0) return;

    const maxTemp = Math.max(...points) + 3;
    const minTemp = Math.min(...points) - 3;
    const padding = 30;
    const stepX = (width - padding * 2) / (points.length - 1);

    const coords = points.map((val, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - ((val - minTemp) / (maxTemp - minTemp)) * (height - padding * 2);
      return { x, y, val, label: labels[idx] };
    });

    // Draw Gradient Area under curve
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.lineTo(coords[coords.length - 1].x, height - 15);
    ctx.lineTo(coords[0].x, height - 15);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Draw Smooth Line
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Points & Labels
    const units = getUnitSymbols();
    coords.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text Values
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 12px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.val}${units.temp}`, pt.x, pt.y - 12);

      // Hour Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px Plus Jakarta Sans';
      ctx.fillText(pt.label, pt.x, height - 2);
    });
  }

  function renderDailyForecast(daily) {
    DOM.dailyForecastList.innerHTML = '';
    const units = getUnitSymbols();

    // Calculate week overall min & max for normalized bar width
    const allMax = Math.max(...daily.temperature_2m_max);
    const allMin = Math.min(...daily.temperature_2m_min);
    const totalRange = allMax - allMin || 1;

    daily.time.forEach((dateStr, idx) => {
      const dateObj = new Date(dateStr);
      const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const maxVal = formatTemp(daily.temperature_2m_max[idx]);
      const minVal = formatTemp(daily.temperature_2m_min[idx]);
      const pop = daily.precipitation_probability_max[idx] || 0;
      const meta = getWeatherMeta(daily.weather_code[idx], 1);

      // Bar percentage
      const leftPct = ((daily.temperature_2m_min[idx] - allMin) / totalRange) * 100;
      const widthPct = ((daily.temperature_2m_max[idx] - daily.temperature_2m_min[idx]) / totalRange) * 100;

      const rowHtml = `
        <div class="daily-row">
          <span class="day-name">${dayName}</span>
          <div class="day-condition">
            <i class="fa-solid ${meta.iconClass} day-icon"></i>
            <span class="day-desc">${meta.desc}</span>
          </div>
          <span class="day-pop"><i class="fa-solid fa-droplet"></i> ${pop}%</span>
          <div class="day-temp-range">
            <span class="temp-min">${minVal}°</span>
            <div class="temp-bar-bg">
              <div class="temp-bar-fill" style="left: ${leftPct}%; width: ${Math.max(widthPct, 10)}%"></div>
            </div>
            <span class="temp-max">${maxVal}°</span>
          </div>
        </div>
      `;
      DOM.dailyForecastList.insertAdjacentHTML('beforeend', rowHtml);
    });
  }

  function renderSunTracker(sunriseStr, sunsetStr) {
    if (!sunriseStr || !sunsetStr) return;

    const sunrise = new Date(sunriseStr);
    const sunset = new Date(sunsetStr);
    const now = new Date();

    DOM.sunriseVal.textContent = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    DOM.sunsetVal.textContent = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const totalMs = sunset - sunrise;
    const elapsedMs = now - sunrise;
    const pct = Math.min(Math.max(elapsedMs / totalMs, 0), 1);

    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const mins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    DOM.daylightVal.textContent = `${hours}h ${mins}m`;

    // Compute point on Arc (SVG Path: M 20 90 A 80 80 0 0 1 180 90)
    const angle = Math.PI - pct * Math.PI;
    const cx = 100;
    const cy = 90;
    const r = 80;
    const dotX = cx + r * Math.cos(angle);
    const dotY = cy - r * Math.sin(angle);

    DOM.sunPositionDot.setAttribute('cx', dotX);
    DOM.sunPositionDot.setAttribute('cy', dotY);
  }

  // --------------------------------------------------------------------------
  // 8. Event Handlers & Controller Actions
  // --------------------------------------------------------------------------
  async function loadLocationWeather(lat, lon, name, country) {
    showLoading();
    try {
      state.currentLocation = { lat, lon, name, country };
      const data = await fetchWeatherData(lat, lon);
      state.weatherData = data;
      renderAll();
      showDashboard();
      saveLastLocation(state.currentLocation);
    } catch (err) {
      console.error(err);
      showError('Weather Fetch Failed', 'Could not load data for this location. Please check your network or try again.');
    }
  }

  function handleSearchInput() {
    const query = DOM.searchInput.value.trim();
    if (query.length > 0) {
      DOM.clearSearchBtn.classList.remove('hidden');
    } else {
      DOM.clearSearchBtn.classList.add('hidden');
      DOM.searchResults.classList.add('hidden');
      return;
    }

    clearTimeout(state.searchDebounceTimer);
    state.searchDebounceTimer = setTimeout(async () => {
      try {
        const results = await fetchGeocoding(query);
        renderSearchResults(results);
      } catch (e) {
        console.warn('Geocoding error', e);
      }
    }, 300);
  }

  function renderSearchResults(results) {
    DOM.searchResults.innerHTML = '';
    if (results.length === 0) {
      DOM.searchResults.innerHTML = '<div class="result-item"><span class="result-main">No locations found</span></div>';
      DOM.searchResults.classList.remove('hidden');
      return;
    }

    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'result-item';
      
      let typeIcon = 'fa-location-dot';
      if (res.type === 'road' || res.type === 'highway' || res.type === 'street') typeIcon = 'fa-road';
      else if (res.type === 'residential' || res.type === 'house' || res.type === 'building') typeIcon = 'fa-house';
      else if (res.type === 'village' || res.type === 'hamlet' || res.type === 'town') typeIcon = 'fa-tree-city';
      else if (res.type === 'city' || res.type === 'administrative') typeIcon = 'fa-city';

      const subDisplay = res.subText || res.country || '';

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <i class="fa-solid ${typeIcon}" style="color:var(--accent-secondary); font-size:1.1rem; width:20px; text-align:center;"></i>
          <div>
            <div class="result-main">${res.name}</div>
            <div class="result-sub">${subDisplay}</div>
          </div>
        </div>
        <i class="fa-solid fa-chevron-right" style="font-size:0.8rem; color:var(--text-muted)"></i>
      `;
      item.addEventListener('click', () => {
        DOM.searchInput.value = `${res.name}${subDisplay ? ', ' + subDisplay : ''}`;
        DOM.searchResults.classList.add('hidden');
        loadLocationWeather(res.latitude, res.longitude, res.name, subDisplay);
      });
      DOM.searchResults.appendChild(item);
    });

    DOM.searchResults.classList.remove('hidden');
  }

  function handleGeolocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    showLoading();
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoInfo = await fetchReverseGeocode(latitude, longitude);
        loadLocationWeather(latitude, longitude, geoInfo.name, geoInfo.country);
      },
      (err) => {
        console.warn('Geolocation denied or failed', err);
        // Fallback to London
        loadLocationWeather(51.5074, -0.1278, 'London', 'United Kingdom');
      }
    );
  }

  function saveLastLocation(loc) {
    try {
      localStorage.setItem('aether_last_loc', JSON.stringify(loc));
    } catch (e) {}
  }

  function loadSavedLocation() {
    try {
      const saved = localStorage.getItem('aether_last_loc');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  // UI State toggles
  function showLoading() {
    DOM.loadingState.classList.remove('hidden');
    DOM.errorState.classList.add('hidden');
    DOM.dashboard.classList.add('hidden');
  }

  function showDashboard() {
    DOM.loadingState.classList.add('hidden');
    DOM.errorState.classList.add('hidden');
    DOM.dashboard.classList.remove('hidden');
  }

  function showError(title, msg) {
    DOM.loadingState.classList.add('hidden');
    DOM.dashboard.classList.add('hidden');
    DOM.errorTitle.textContent = title;
    DOM.errorMessage.textContent = msg;
    DOM.errorState.classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // 9. Initializer & Event Listeners Attachment
  // --------------------------------------------------------------------------
  function init() {
    particleEngine.init();

    // Event Listeners
    DOM.searchInput.addEventListener('input', handleSearchInput);
    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      DOM.clearSearchBtn.classList.add('hidden');
      DOM.searchResults.classList.add('hidden');
    });

    DOM.geoBtn.addEventListener('click', handleGeolocation);
    DOM.retryBtn.addEventListener('click', () => {
      loadLocationWeather(state.currentLocation.lat, state.currentLocation.lon, state.currentLocation.name, state.currentLocation.country);
    });

    document.addEventListener('click', (e) => {
      if (!DOM.searchResults.contains(e.target) && e.target !== DOM.searchInput) {
        DOM.searchResults.classList.add('hidden');
      }
    });

    // Unit toggle buttons
    DOM.unitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.unitBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.unit = btn.dataset.unit;
        renderAll();
      });
    });

    // Hourly tabs
    DOM.tabCardsBtn.addEventListener('click', () => {
      DOM.tabCardsBtn.classList.add('active');
      DOM.tabChartBtn.classList.remove('active');
      DOM.hourlyCardsContainer.classList.remove('hidden');
      DOM.hourlyChartWrapper.classList.add('hidden');
    });

    DOM.tabChartBtn.addEventListener('click', () => {
      DOM.tabChartBtn.classList.add('active');
      DOM.tabCardsBtn.classList.remove('active');
      DOM.hourlyCardsContainer.classList.add('hidden');
      DOM.hourlyChartWrapper.classList.remove('hidden');
      if (state.weatherData) {
        const now = new Date();
        renderHourlyChart(state.weatherData.weather.hourly, now.getHours());
      }
    });

    // Load initial weather
    const saved = loadSavedLocation();
    if (saved) {
      loadLocationWeather(saved.lat, saved.lon, saved.name, saved.country);
    } else {
      handleGeolocation();
    }
  }

  // Run on DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
