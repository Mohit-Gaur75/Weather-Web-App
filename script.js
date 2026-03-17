const API_KEY = '087acaeaaebc46048e153115261601';
const BASE = 'https://api.weatherapi.com/v1';

let isFahrenheit = false;
let hourlyChart = null;
let rawData = null;

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const unitToggle = document.getElementById('unitToggle');
const recentList = document.getElementById('recentList');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMsg = document.getElementById('errorMsg');


const cToF = c => Math.round(c * 9 / 5 + 32);
const formatTemp = c => isFahrenheit ? `${cToF(c)}` : `${Math.round(c)}`;
const unitLabel = () => isFahrenheit ? '°F' : '°C';

function showLoading() {
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
}
function hideLoading() { loadingState.classList.add('hidden'); }
function showError(msg) {
  hideLoading();
  errorState.classList.remove('hidden');
  errorMsg.textContent = msg;
  setTimeout(() => errorState.classList.add('hidden'), 3500);
}


function weatherEmoji(code, isDay) {
  if (code === 1000) return isDay ? '☀️' : '🌙';
  if (code === 1003) return '🌤️';
  if ([1006, 1009].includes(code)) return '☁️';
  if ([1030, 1135, 1147].includes(code)) return '🌫️';
  if ([1063, 1150, 1153, 1180, 1183].includes(code)) return '🌦️';
  if ([1066, 1114, 1117, 1210, 1213, 1216,
    1219, 1222, 1225, 1255, 1258].includes(code)) return '❄️';
  if ([1072, 1168, 1171, 1198, 1201,
    1204, 1207, 1237, 1249, 1252].includes(code)) return '🌨️';
  if ([1186, 1189, 1192, 1195,
    1243, 1246].includes(code)) return '🌧️';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '⛈️';
  return '🌡️';
}


function uviLabel(uvi) {
  if (uvi <= 2) return { label: 'Low', color: '#3dd68c' };
  if (uvi <= 5) return { label: 'Moderate', color: '#f5d020' };
  if (uvi <= 7) return { label: 'High', color: '#f5a623' };
  if (uvi <= 10) return { label: 'Very High', color: '#f06060' };
  return { label: 'Extreme', color: '#c050f0' };
}


function todayFormatted() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}
function formatHour12(timeStr) {
  const h = parseInt(timeStr.split(' ')[1].split(':')[0]);
  return `${h % 12 || 12}${h >= 12 ? 'PM' : 'AM'}`;
}
function dayNameFromDate(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
}
function parseTime12(str) {
  const [time, ampm] = str.trim().split(' ');
  let [h, m] = time.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime() / 1000;
}

function getRecent() {
  return JSON.parse(localStorage.getItem('wxRecent') || '[]');
}
function saveRecent(city) {
  let arr = getRecent().filter(c => c.toLowerCase() !== city.toLowerCase());
  arr.unshift(city);
  localStorage.setItem('wxRecent', JSON.stringify(arr.slice(0, 6)));
  renderRecent();
}
function renderRecent() {
  recentList.innerHTML = '';
  getRecent().forEach(city => {
    const li = document.createElement('li');
    li.className = 'recent-item';
    li.innerHTML = `<span>${city}</span><button class="remove-btn">×</button>`;
    li.querySelector('span').addEventListener('click', () => fetchWeather(city));
    li.querySelector('.remove-btn').addEventListener('click', e => {
      e.stopPropagation();
      localStorage.setItem('wxRecent',
        JSON.stringify(getRecent().filter(c => c !== city)));
      renderRecent();
    });
    recentList.appendChild(li);
  });
}
async function fetchWeather(query) {
  showLoading();
  try {
    const url = `${BASE}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`;
    const res = await fetch(url);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error ${res.status}`);
    }
    const data = await res.json();
    rawData = data;
    saveRecent(data.location.name);
    renderAll(data);
    hideLoading();
  } catch (err) {
    showError(err.message || 'Failed to fetch weather.');
  }
}

function fetchByCoords(lat, lon) {
  fetchWeather(`${lat},${lon}`);
}

function renderAll(data) {
  renderHero(data);
  renderHourly(data);
  renderForecast(data);
  renderDetails(data);
}

function renderHero(data) {
  const loc = data.location;
  const cur = data.current;
  const cond = cur.condition;

  document.getElementById('cityName').textContent = `${loc.name}, ${loc.country}`;
  document.getElementById('currentDate').textContent = todayFormatted();
  document.getElementById('currentTemp').textContent = formatTemp(cur.temp_c);
  document.getElementById('tempUnit').textContent = unitLabel();
  document.getElementById('weatherDesc').textContent = cond.text;
  document.getElementById('feelsLike').textContent = `Feels like ${formatTemp(cur.feelslike_c)}${unitLabel()}`;
  document.getElementById('weatherBadge').textContent = cond.text;
  document.getElementById('mainWeatherIcon').textContent = weatherEmoji(cond.code, cur.is_day);
  document.getElementById('humidity').textContent = `${cur.humidity}%`;
  document.getElementById('windSpeed').textContent = `${Math.round(cur.wind_kph)} km/h`;
  document.getElementById('visibility').textContent = `${cur.vis_km} km`;
  document.getElementById('pressure').textContent = `${cur.pressure_mb} hPa`;

  const astro = data.forecast.forecastday[0].astro;
  document.getElementById('sunriseTime').textContent = astro.sunrise;
  document.getElementById('sunsetTime').textContent = astro.sunset;
  animateSun(astro.sunrise, astro.sunset);
}
//sun arc
function animateSun(riseStr, setStr) {
  try {
    const rise = parseTime12(riseStr);
    const set = parseTime12(setStr);
    const t = Math.max(0, Math.min(1, (Date.now() / 1000 - rise) / (set - rise)));
    const x = Math.round((1 - t) * (1 - t) * 5 + 2 * (1 - t) * t * 50 + t * t * 95);
    const y = Math.round((1 - t) * (1 - t) * 45 + 2 * (1 - t) * t * (-10) + t * t * 45);
    const dot = document.getElementById('sunDot');
    if (dot) { dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
  } catch (e) { }
}

function renderHourly(data) {
  const now = Math.floor(Date.now() / 1000);
  const todayHrs = data.forecast.forecastday[0].hour;
  const tmrwHrs = data.forecast.forecastday[1]?.hour || [];
  const allHours = [...todayHrs, ...tmrwHrs];

  const upcoming = allHours.filter(h => h.time_epoch >= now - 1800).slice(0, 12);

  const labels = upcoming.map(h => formatHour12(h.time));
  const temps = upcoming.map(h => isFahrenheit ? cToF(h.temp_c) : Math.round(h.temp_c));
  const pops = upcoming.map(h => Math.round(h.chance_of_rain));

  const container = document.getElementById('hourlyCards');
  container.innerHTML = '';
  upcoming.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'hour-card' + (idx === 0 ? ' now' : '');
    card.innerHTML = `
      <span class="hour-time">${idx === 0 ? 'Now' : labels[idx]}</span>
      <span class="hour-icon">${weatherEmoji(item.condition.code, item.is_day)}</span>
      <span class="hour-temp">${temps[idx]}${unitLabel()}</span>
      ${pops[idx] > 0 ? `<span class="hour-pop">💧 ${pops[idx]}%</span>` : ''}
    `;
    container.appendChild(card);
  });

  if (hourlyChart) { hourlyChart.destroy(); hourlyChart = null; }
  const ctx = document.getElementById('hourlyChart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 130);
  grad.addColorStop(0, 'rgba(78,142,247,0.35)');
  grad.addColorStop(1, 'rgba(78,142,247,0)');

  hourlyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temp', data: temps,
          borderColor: '#4e8ef7', borderWidth: 2,
          backgroundColor: grad, fill: true, tension: 0.45,
          pointRadius: 3, pointBackgroundColor: '#4e8ef7',
          pointBorderColor: '#161b28', pointBorderWidth: 1.5,
          yAxisID: 'y'
        },
        {
          label: 'Rain %', data: pops,
          borderColor: 'rgba(108,180,245,0.5)', borderWidth: 1.5,
          backgroundColor: 'rgba(108,180,245,0.08)', fill: true,
          tension: 0.45, pointRadius: 0, borderDash: [4, 3],
          yAxisID: 'y2'
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1c2236', borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1, titleColor: '#8892aa', bodyColor: '#f0f4ff', padding: 10,
          callbacks: {
            label: ctx => ctx.datasetIndex === 0
              ? ` ${ctx.parsed.y}${unitLabel()}`
              : ` ${ctx.parsed.y}% rain`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: '#4a5368', font: { size: 11, family: "'Space Grotesk'" } }
        },
        y: {
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: {
            color: '#4a5368',
            font: { size: 11, family: "'DM Mono'" },
            callback: v => `${v}°`
          }
        },
        y2: {
          position: 'right', min: 0, max: 100,
          grid: { display: false },
          ticks: {
            color: 'rgba(108,180,245,0.5)',
            font: { size: 10, family: "'DM Mono'" },
            callback: v => `${v}%`
          }
        }
      }
    }
  });
}

function renderForecast(data) {
  const days = data.forecast.forecastday;
  const allHighs = days.map(d => d.day.maxtemp_c);
  const allLows = days.map(d => d.day.mintemp_c);
  const globalMin = Math.min(...allLows);
  const globalMax = Math.max(...allHighs);

  const grid = document.getElementById('forecastGrid');
  grid.innerHTML = '';

  days.forEach((day, i) => {
    const high = day.day.maxtemp_c;
    const low = day.day.mintemp_c;
    const pop = Math.round(day.day.daily_chance_of_rain);
    const icon = weatherEmoji(day.day.condition.code, 1);
    const name = i === 0 ? 'Today' : dayNameFromDate(day.date);
    const leftPct = ((low - globalMin) / (globalMax - globalMin) * 100).toFixed(1);
    const widthPct = ((high - low) / (globalMax - globalMin) * 100).toFixed(1);

    const row = document.createElement('div');
    row.className = 'forecast-row';
    row.innerHTML = `
      <span class="forecast-day">${name}</span>
      <span class="forecast-icon">${icon}</span>
      <div class="forecast-bar-wrap">
        <span class="forecast-low">${formatTemp(low)}°</span>
        <div class="forecast-bar-bg">
          <div class="forecast-bar-fill" style="margin-left:${leftPct}%;width:${widthPct}%;"></div>
        </div>
        <span class="forecast-high">${formatTemp(high)}°</span>
      </div>
      <span class="forecast-pop">${pop > 0 ? `💧 ${pop}%` : ''}</span>
    `;
    grid.appendChild(row);
  });
}

function renderDetails(data) {
  const cur = data.current;

  const uvi = Math.round(cur.uv);
  const uviInfo = uviLabel(uvi);
  document.getElementById('uviValue').textContent = uvi;
  const uviTagEl = document.getElementById('uviTag');
  uviTagEl.textContent = uviInfo.label;
  uviTagEl.style.background = uviInfo.color + '22';
  uviTagEl.style.color = uviInfo.color;
  document.getElementById('uviFill').style.width = `${(uvi / 12) * 100}%`;

  const clouds = cur.cloud;
  document.getElementById('cloudPct').textContent = `${clouds}%`;
  document.getElementById('cloudDesc').textContent =
    clouds < 20 ? 'Clear skies' :
      clouds < 50 ? 'Partly cloudy' :
        clouds < 80 ? 'Mostly cloudy' : 'Overcast';

  const dew = cur.dewpoint_c;
  document.getElementById('dewPoint').textContent = formatTemp(dew);
  document.getElementById('dewDesc').textContent =
    dew < 10 ? 'Comfortable & dry' :
      dew < 16 ? 'Pleasant' :
        dew < 21 ? 'Slightly humid' :
          dew < 24 ? 'Humid' : 'Very humid';
}


unitToggle.addEventListener('change', () => {
  isFahrenheit = unitToggle.checked;
  if (rawData) renderAll(rawData);
});
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});
cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) return showError('Geolocation not supported.');
  geoBtn.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    pos => {
      geoBtn.innerHTML = '⊕ Use my location';
      fetchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      geoBtn.innerHTML = '⊕ Use my location';
      showError('Location access denied.');
    }
  );
});


renderRecent();
fetchWeather(getRecent()[0] || 'London');