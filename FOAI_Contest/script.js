/* ============================================================
   SMART CITY CITIZEN DASHBOARD — SCRIPT.JS
   All API fetching, global state, rendering, chatbot logic
   ============================================================ */

'use strict';

// ==============================================================
// SECTION 1: GLOBAL STATE
// These variables hold the live API data so the chatbot can
// access current dashboard information without extra requests.
// ==============================================================

let weatherData  = null;   // Open-Meteo response
let currencyData = null;   // ExchangeRate-API response
let citizenData  = null;   // RandomUser.me response
let factData     = null;   // UselessFacts response

let chatbotOpen = false;   // Chatbot visibility toggle state

// ==============================================================
// SECTION 2: API ENDPOINTS
// ==============================================================

const API_URLS = {
  weather:  'https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&current=temperature_2m,wind_speed_10m,weather_code',
  currency: 'https://open.er-api.com/v6/latest/USD',
  citizen:  'https://randomuser.me/api/',
  fact:     'https://uselessfacts.jsph.pl/api/v2/facts/random?language=en',
};

// ==============================================================
// SECTION 3: WEATHER CODE INTERPRETATION
// Maps WMO weather codes to human-readable descriptions + emoji
// ==============================================================

function interpretWeatherCode(code) {
  const codes = {
    0:  { label: 'Clear Sky',              emoji: '☀️' },
    1:  { label: 'Mainly Clear',           emoji: '🌤️' },
    2:  { label: 'Partly Cloudy',          emoji: '⛅' },
    3:  { label: 'Overcast',               emoji: '☁️' },
    45: { label: 'Foggy',                  emoji: '🌫️' },
    48: { label: 'Icy Fog',                emoji: '🌫️' },
    51: { label: 'Light Drizzle',          emoji: '🌦️' },
    53: { label: 'Drizzle',                emoji: '🌦️' },
    55: { label: 'Heavy Drizzle',          emoji: '🌧️' },
    61: { label: 'Light Rain',             emoji: '🌧️' },
    63: { label: 'Rain',                   emoji: '🌧️' },
    65: { label: 'Heavy Rain',             emoji: '🌧️' },
    71: { label: 'Light Snow',             emoji: '🌨️' },
    73: { label: 'Snow',                   emoji: '❄️' },
    75: { label: 'Heavy Snow',             emoji: '❄️' },
    77: { label: 'Snow Grains',            emoji: '🌨️' },
    80: { label: 'Light Showers',          emoji: '🌦️' },
    81: { label: 'Showers',               emoji: '🌧️' },
    82: { label: 'Violent Showers',        emoji: '⛈️' },
    85: { label: 'Snow Showers',           emoji: '🌨️' },
    86: { label: 'Heavy Snow Showers',     emoji: '❄️' },
    95: { label: 'Thunderstorm',           emoji: '⛈️' },
    96: { label: 'Thunderstorm w/ Hail',   emoji: '⛈️' },
    99: { label: 'Thunderstorm w/ Hail',   emoji: '⛈️' },
  };
  return codes[code] || { label: `Code ${code}`, emoji: '🌡️' };
}

// ==============================================================
// SECTION 4: UTILITY — TIME STAMP
// ==============================================================

function nowTimestamp() {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function setLastUpdated(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = `Updated ${nowTimestamp()}`;
}

// ==============================================================
// SECTION 5: LIVE CLOCK IN HEADER
// ==============================================================

function startClock() {
  const el = document.getElementById('header-time');
  function tick() {
    if (el) {
      el.textContent = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      });
    }
    requestAnimationFrame(() => setTimeout(tick, 1000));
  }
  tick();
}

// ==============================================================
// SECTION 6: SHOW LOADING STATE IN A CARD
// ==============================================================

function showLoadingState(contentId, label = 'Loading data…') {
  const el = document.getElementById(contentId);
  if (!el) return;
  el.innerHTML = `
    <div class="skeleton-loader" aria-label="${label}">
      <div class="skeleton skeleton--large"></div>
      <div class="skeleton skeleton--medium"></div>
      <div class="skeleton skeleton--small"></div>
    </div>`;
}

// ==============================================================
// SECTION 7: SHOW ERROR STATE IN A CARD
// ==============================================================

function showErrorState(contentId, message = 'Could not fetch data. Please refresh.') {
  const el = document.getElementById(contentId);
  if (!el) return;
  // Safely set via textContent to avoid XSS
  el.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'error-state';

  const icon = document.createElement('div');
  icon.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`;

  const p = document.createElement('p');
  p.textContent = message;

  wrapper.appendChild(icon);
  wrapper.appendChild(p);
  el.appendChild(wrapper);
}

// ==============================================================
// SECTION 8: SAFE HTML RENDERING HELPER
// Uses textContent so no raw HTML injection from API
// ==============================================================

function safeText(str) {
  const d = document.createElement('div');
  d.textContent = String(str ?? '');
  return d.innerHTML;
}

// ==============================================================
// SECTION 9: DISABLE / ENABLE REFRESH BUTTON
// ==============================================================

function setRefreshState(btnId, spinning) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = spinning;
  if (spinning) btn.classList.add('spinning');
  else btn.classList.remove('spinning');
}

// ==============================================================
// SECTION 10: WEATHER — FETCH & RENDER
// ==============================================================

async function fetchWeather() {
  setRefreshState('refresh-weather', true);
  showLoadingState('weather-content', 'Loading weather data…');

  try {
    const res = await fetch(API_URLS.weather);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    weatherData = await res.json();
    renderWeather();
    setLastUpdated('weather-updated');
  } catch (err) {
    console.error('[Weather] Fetch failed:', err);
    weatherData = null;
    showErrorState('weather-content', 'Weather data unavailable right now. Try refreshing in a moment.');
  } finally {
    setRefreshState('refresh-weather', false);
  }
}

function renderWeather() {
  const el = document.getElementById('weather-content');

  if (!el || !weatherData?.current) {
    console.log('Weather response:', weatherData);
    showErrorState('weather-content', 'Weather data is incomplete.');
    return;
  }

  const cw   = weatherData.current;
  const temp = cw.temperature_2m;
  const wind = cw.wind_speed_10m;
  const code = cw.weather_code;
  const time = new Date().toLocaleString('en-IN');
  const { label, emoji } = interpretWeatherCode(code);

  el.innerHTML = '';

  const body = document.createElement('div');

  // Main row: emoji + temperature
  const mainRow = document.createElement('div');
  mainRow.className = 'weather-main';

  const emojiEl = document.createElement('div');
  emojiEl.className = 'weather-emoji';
  emojiEl.setAttribute('aria-label', label);
  emojiEl.textContent = emoji;

  const tempBlock = document.createElement('div');
  tempBlock.className = 'weather-temp-block';

  const tempEl = document.createElement('div');
  tempEl.className = 'weather-temperature';
  tempEl.textContent = `${temp}°C`;

  const descEl = document.createElement('div');
  descEl.className = 'weather-description';
  descEl.textContent = label;

  tempBlock.appendChild(tempEl);
  tempBlock.appendChild(descEl);
  mainRow.appendChild(emojiEl);
  mainRow.appendChild(tempBlock);

  // Stats grid
  const stats = document.createElement('div');
  stats.className = 'weather-stats';

  stats.innerHTML = `
    <div class="weather-stat">
      <div class="stat-label">Wind Speed</div>
      <div class="stat-value">${safeText(wind)} km/h</div>
    </div>
    <div class="weather-stat">
      <div class="stat-label">Weather Code</div>
      <div class="stat-value">WMO ${safeText(code)}</div>
    </div>
    <div class="weather-stat">
      <div class="stat-label">Location</div>
      <div class="stat-value">Pune, IN</div>
    </div>
    <div class="weather-stat">
      <div class="stat-label">Observed At</div>
      <div class="stat-value">${safeText(time)}</div>
    </div>
  `;

  body.appendChild(mainRow);
  body.appendChild(stats);
  el.appendChild(body);
}

// ==============================================================
// SECTION 11: CURRENCY — FETCH & RENDER
// ==============================================================

async function fetchCurrency() {
  setRefreshState('refresh-currency', true);
  showLoadingState('currency-content', 'Loading exchange rates…');

  try {
    const res = await fetch(API_URLS.currency);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currencyData = await res.json();
    renderCurrency();
    setLastUpdated('currency-updated');
  } catch (err) {
    console.error('[Currency] Fetch failed:', err);
    currencyData = null;
    showErrorState('currency-content', 'Exchange rates unavailable right now. Try refreshing.');
  } finally {
    setRefreshState('refresh-currency', false);
  }
}

function renderCurrency() {
  const el = document.getElementById('currency-content');
  if (!el || !currencyData?.rates) {
    showErrorState('currency-content', 'Currency data is incomplete.');
    return;
  }

  const rates = currencyData.rates;
  const inr   = rates.INR?.toFixed(2)  ?? '--';
  const eur   = rates.EUR?.toFixed(4)  ?? '--';
  const gbp   = rates.GBP?.toFixed(4)  ?? '--';

  el.innerHTML = `
    <div class="currency-list">
      <div class="currency-row">
        <div class="currency-pair">
          <span class="currency-flags">🇺🇸 → 🇮🇳</span>
          <span class="currency-label">USD to INR</span>
        </div>
        <span class="currency-rate">₹ ${safeText(inr)}</span>
      </div>
      <div class="currency-row">
        <div class="currency-pair">
          <span class="currency-flags">🇺🇸 → 🇪🇺</span>
          <span class="currency-label">USD to EUR</span>
        </div>
        <span class="currency-rate">€ ${safeText(eur)}</span>
      </div>
      <div class="currency-row">
        <div class="currency-pair">
          <span class="currency-flags">🇺🇸 → 🇬🇧</span>
          <span class="currency-label">USD to GBP</span>
        </div>
        <span class="currency-rate">£ ${safeText(gbp)}</span>
      </div>
    </div>
    <p class="currency-note">📊 Live rates from ExchangeRate-API · Base currency: USD</p>
  `;
}

// ==============================================================
// SECTION 12: CITIZEN PROFILE — FETCH & RENDER
// ==============================================================

async function fetchCitizen() {
  setRefreshState('refresh-citizen', true);
  showLoadingState('citizen-content', 'Loading citizen profile…');

  try {
    const res = await fetch(API_URLS.citizen);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    citizenData = await res.json();
    renderCitizen();
    setLastUpdated('citizen-updated');
  } catch (err) {
    console.error('[Citizen] Fetch failed:', err);
    citizenData = null;
    showErrorState('citizen-content', 'Could not load citizen profile. Try refreshing.');
  } finally {
    setRefreshState('refresh-citizen', false);
  }
}

function renderCitizen() {
  const el = document.getElementById('citizen-content');
  if (!el || !citizenData?.results?.[0]) {
    showErrorState('citizen-content', 'Citizen data is incomplete.');
    return;
  }

  const person  = citizenData.results[0];
  const name    = `${person.name.first} ${person.name.last}`;
  const email   = person.email;
  const city    = person.location.city;
  const country = person.location.country;
  const pic     = person.picture.large;

  // Build DOM safely
  el.innerHTML = '';

  const profile = document.createElement('div');
  profile.className = 'citizen-profile';

  // Avatar
  const avatarWrap = document.createElement('div');
  avatarWrap.className = 'citizen-avatar-wrap';

  const img = document.createElement('img');
  img.src    = pic;
  img.alt    = `Profile photo of ${name}`;
  img.className = 'citizen-avatar';
  img.loading   = 'lazy';
  img.onerror   = () => { img.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(name); };

  const badge = document.createElement('div');
  badge.className = 'citizen-badge';
  badge.setAttribute('aria-label', 'Verified citizen');
  badge.textContent = '✓';

  avatarWrap.appendChild(img);
  avatarWrap.appendChild(badge);

  // Name
  const nameEl = document.createElement('div');
  nameEl.className  = 'citizen-name';
  nameEl.textContent = name;

  // Details
  const details = document.createElement('div');
  details.className = 'citizen-details';
  details.innerHTML = `
    <div class="citizen-detail-row"><span class="citizen-detail-icon">✉️</span><span>${safeText(email)}</span></div>
    <div class="citizen-detail-row"><span class="citizen-detail-icon">🏙️</span><span>${safeText(city)}</span></div>
    <div class="citizen-detail-row"><span class="citizen-detail-icon">🌍</span><span>${safeText(country)}</span></div>
  `;

  profile.appendChild(avatarWrap);
  profile.appendChild(nameEl);
  profile.appendChild(details);
  el.appendChild(profile);
}

// ==============================================================
// SECTION 13: CITY FACT — FETCH & RENDER
// ==============================================================

async function fetchFact() {
  setRefreshState('refresh-fact', true);
  showLoadingState('fact-content', 'Loading city fact…');

  try {
    const res = await fetch(API_URLS.fact);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    factData = await res.json();
    renderFact();
    setLastUpdated('fact-updated');
  } catch (err) {
    console.error('[Fact] Fetch failed:', err);
    factData = null;
    showErrorState('fact-content', 'Could not load today\'s city fact. Try refreshing.');
  } finally {
    setRefreshState('refresh-fact', false);
  }
}

function renderFact() {
  const el = document.getElementById('fact-content');
  if (!el || !factData?.text) {
    showErrorState('fact-content', 'Fact data is incomplete.');
    return;
  }

  el.innerHTML = '';

  const quote = document.createElement('div');
  quote.className = 'fact-quote-mark';
  quote.setAttribute('aria-hidden', 'true');
  quote.textContent = '"';

  const text = document.createElement('p');
  text.className  = 'fact-text';
  text.textContent = factData.text;

  const source = document.createElement('div');
  source.className = 'fact-source';
  source.textContent = '💡 Did You Know?';

  el.appendChild(quote);
  el.appendChild(text);
  el.appendChild(source);
}

// ==============================================================
// SECTION 14: INIT — FETCH ALL APIS ON PAGE LOAD
// ==============================================================

async function initDashboard() {
  // Fire all four fetches in parallel for fastest load
  await Promise.allSettled([
    fetchWeather(),
    fetchCurrency(),
    fetchCitizen(),
    fetchFact(),
  ]);
  // Once loaded, show a greeting badge on chatbot
  showChatbotBadge();
}

// ==============================================================
// SECTION 15: WIRE REFRESH BUTTONS
// ==============================================================

function bindRefreshButtons() {
  document.getElementById('refresh-weather') ?.addEventListener('click', fetchWeather);
  document.getElementById('refresh-currency')?.addEventListener('click', fetchCurrency);
  document.getElementById('refresh-citizen') ?.addEventListener('click', fetchCitizen);
  document.getElementById('refresh-fact')    ?.addEventListener('click', fetchFact);
}

// ==============================================================
// SECTION 16: CHATBOT — OPEN / CLOSE
// ==============================================================

function showChatbotBadge() {
  const badge = document.getElementById('chatbot-badge');
  if (badge) badge.style.display = 'block';
}

function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const win    = document.getElementById('chatbot-window');
  const toggle = document.getElementById('chatbot-toggle');
  const chatIcon  = toggle?.querySelector('.chat-icon');
  const closeIcon = toggle?.querySelector('.close-icon');
  const badge  = document.getElementById('chatbot-badge');

  if (chatbotOpen) {
    win?.classList.add('open');
    win?.setAttribute('aria-hidden', 'false');
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.setAttribute('aria-label', 'Close Smart City Assistant');
    if (chatIcon)  chatIcon.style.display  = 'none';
    if (closeIcon) closeIcon.style.display = 'block';
    if (badge)     badge.style.display     = 'none';
    // Add greeting if first open
    ensureGreeting();
    document.getElementById('chatbot-input')?.focus();
    scrollChatToBottom();
  } else {
    win?.classList.remove('open');
    win?.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open Smart City Assistant');
    if (chatIcon)  chatIcon.style.display  = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
  }
}

let greetingShown = false;

function ensureGreeting() {
  if (greetingShown) return;
  greetingShown = true;
  appendMessage(
    'assistant',
    '👋 Hello! I\'m your Smart City Assistant. I can answer questions about the live weather, currency exchange rates, the featured citizen, and today\'s city fact — all based on what\'s currently shown on the dashboard. Try one of the suggestions below or type your question!'
  );
}

// ==============================================================
// SECTION 17: CHATBOT — MESSAGE RENDERING
// ==============================================================

function appendMessage(role, text, isTyping = false) {
  const container = document.getElementById('chatbot-messages');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = `message message--${role}`;

  if (isTyping) {
    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-indicator';
    typing.setAttribute('aria-label', 'City Assistant is thinking…');
    typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    wrapper.appendChild(typing);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    // Safely set text (no raw HTML injection — use textContent)
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = nowTimestamp();

    wrapper.appendChild(bubble);
    wrapper.appendChild(time);
  }

  container.appendChild(wrapper);
  scrollChatToBottom();
  return wrapper;
}

function removeTypingIndicator() {
  const ind = document.getElementById('typing-indicator');
  if (ind) ind.closest('.message')?.remove();
}

function scrollChatToBottom() {
  const container = document.getElementById('chatbot-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

// ==============================================================
// SECTION 18: BUILD LIVE CONTEXT FROM GLOBAL DATA
// This is the core of chatbot grounding — converts live API
// data into a structured text string the LLM reads as context.
// ==============================================================

function buildLiveContext() {
  // Weather
const cw      = weatherData?.current;
const temp    = cw?.temperature_2m ?? 'Not available';
const wind    = cw?.wind_speed_10m ?? 'Not available';
const wCode   = cw?.weather_code ?? 'Not available';
const wDesc   = cw ? interpretWeatherCode(cw.weather_code).label : 'Not available';

  // Currency
  const inr = currencyData?.rates?.INR?.toFixed(2)  ?? 'Not available';
  const eur = currencyData?.rates?.EUR?.toFixed(4)  ?? 'Not available';
  const gbp = currencyData?.rates?.GBP?.toFixed(4)  ?? 'Not available';

  // Citizen
  const person  = citizenData?.results?.[0];
  const cName   = person ? `${person.name.first} ${person.name.last}` : 'Not available';
  const cEmail  = person?.email              ?? 'Not available';
  const cCity   = person?.location?.city     ?? 'Not available';
  const cCountry= person?.location?.country  ?? 'Not available';

  // Fact
  const factText = factData?.text ?? 'Not available';

  const context = `
You are a helpful Smart City Assistant for a Citizen Information Dashboard.
Answer ONLY based on the following live data from the dashboard.
If the user asks something not covered by this data, clearly say:
"That information is not available in the current dashboard data."
Do not use outside knowledge, assumptions, internet, or general facts.
Keep responses conversational, friendly, and concise (2-4 sentences max).

LIVE DASHBOARD DATA:
=====================

WEATHER (Location: Pune, India — Live from Open-Meteo):
  Temperature  : ${temp}°C
  Wind Speed   : ${wind} km/h
  Weather Code : WMO ${wCode}
  Description  : ${wDesc}

CURRENCY EXCHANGE RATES (Live from ExchangeRate-API — Base: 1 USD):
  USD to INR : ${inr} Indian Rupees
  USD to EUR : ${eur} Euros
  USD to GBP : ${gbp} British Pounds
  (For reverse conversion: if user asks X INR to USD, divide X by the INR rate above)

FEATURED CITIZEN ON SCREEN (from RandomUser.me):
  Full Name : ${cName}
  Email     : ${cEmail}
  City      : ${cCity}
  Country   : ${cCountry}

CITY FACT OF THE DAY (from UselessFacts API):
  "${factText}"

=====================
Instructions:
- For currency conversions, use ONLY the rates listed above and show your calculation.
- For weather questions, interpret the data in practical, human terms.
- For citizen questions, describe only the data shown above.
- If asked about anything else, politely decline and explain your scope.
`.trim();

  return context;
}

// ==============================================================
// SECTION 19: CHATBOT — SEND MESSAGE TO BACKEND
// Calls /api/chat (Vercel serverless function) which securely
// calls OpenRouter with the live context + user question.
// ==============================================================

async function sendChatMessage(question) {
  const input    = document.getElementById('chatbot-input');
  const sendBtn  = document.getElementById('chatbot-send');

  if (!question.trim()) return;

  // Show user message
  appendMessage('user', question);

  // Disable input while waiting
  if (input)   input.disabled   = true;
  if (sendBtn) sendBtn.disabled = true;

  // Show typing indicator
  const typingEl = appendMessage('assistant', '', true);

  // Build the live context snapshot
  const liveContext = buildLiveContext();

  try {
    const response = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userQuestion: question, liveContext }),
    });

    removeTypingIndicator();

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg  = errData?.error || `Server error (HTTP ${response.status})`;
      appendMessage('assistant', `⚠️ Sorry, I ran into a problem: ${errMsg} Please try again in a moment.`);
      return;
    }

    const data = await response.json();
    const reply = data?.reply || 'I received a response but it appears to be empty. Please try again.';
    appendMessage('assistant', reply);

  } catch (err) {
    removeTypingIndicator();
    console.error('[Chatbot] Request failed:', err);
    appendMessage('assistant', '⚠️ I couldn\'t reach the city AI right now. Please check your connection and try again.');
  } finally {
    if (input)   { input.disabled = false; input.value = ''; input.focus(); }
    if (sendBtn)   sendBtn.disabled = false;
    scrollChatToBottom();
  }
}

// ==============================================================
// SECTION 20: CHATBOT — EVENT BINDINGS
// ==============================================================

function bindChatbotEvents() {
  // Toggle open/close
  document.getElementById('chatbot-toggle')?.addEventListener('click', toggleChatbot);
  document.getElementById('chatbot-close') ?.addEventListener('click', toggleChatbot);

  // Send button click
  document.getElementById('chatbot-send')?.addEventListener('click', () => {
    const input = document.getElementById('chatbot-input');
    const q = input?.value?.trim();
    if (q) sendChatMessage(q);
  });

  // Press Enter to send
  document.getElementById('chatbot-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const q = e.target.value.trim();
      if (q) sendChatMessage(q);
    }
  });

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      if (query) {
        if (!chatbotOpen) toggleChatbot();
        sendChatMessage(query);
      }
    });
  });
}

// ==============================================================
// SECTION 21: MAIN ENTRY POINT
// Runs when DOM is fully parsed
// ==============================================================

document.addEventListener('DOMContentLoaded', () => {
  startClock();       // Live clock in header
  bindRefreshButtons(); // Wire refresh buttons
  bindChatbotEvents();  // Wire chatbot UI
  initDashboard();      // Fetch all four APIs
});
