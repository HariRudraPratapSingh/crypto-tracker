/* =========================================================
   OrbitIQ — script.js
   Modules: Stars | ISS Tracker | News | Chatbot | Analytics
   ========================================================= */

// ── Global State ──────────────────────────────────────────
const state = {
  issData: null,
  crewData: [],
  newsArticles: [],
  newsOffset: 0,
  newsCategory: 'all',
  velocityHistory: [],
  altitudeHistory: [],
  issMap: null,
  issMarker: null,
  issTrail: null,
  trailPoints: [],
  charts: {},
  chatHistory: [],
  refreshInterval: null,
};

// ── INIT ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initStars();
  startUTCClock();
  simulateLoader(() => {
    document.getElementById('loadingScreen').classList.add('hidden');
    initMap();
    fetchISSData();
    fetchCrew();
    loadNews();
    loadCrewSection();
    startAutoRefresh();
    initCharts();
    showToast('✅ Live data connected', 'success');
  });
});

// ── LOADER ────────────────────────────────────────────────
function simulateLoader(cb) {
  setTimeout(cb, 2400);
}

// ── UTC CLOCK ─────────────────────────────────────────────
function startUTCClock() {
  const el = document.getElementById('utcClock');
  const tick = () => {
    const now = new Date();
    el.textContent = now.toUTCString().split(' ')[4];
  };
  tick();
  setInterval(tick, 1000);
}

// ── STAR CANVAS ───────────────────────────────────────────
function initStars() {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      o: Math.random(),
      s: Math.random() * 0.005 + 0.001,
    }));
  };
  resize();
  window.addEventListener('resize', resize);
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.o += s.s;
      if (s.o > 1 || s.o < 0) s.s *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

// ── SIDEBAR / NAV ─────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('open');
  sb.classList.toggle('collapsed');
}

function switchSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + id).classList.add('active');
  document.getElementById('nav-' + id).classList.add('active');
  if (id === 'analytics') refreshAnalyticsCharts();
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// ── MAP INIT ──────────────────────────────────────────────
function initMap() {
  const map = L.map('issMap', {
    center: [0, 0], zoom: 2, zoomControl: false, attributionControl: false,
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  // ISS Icon
  const issIcon = L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:24px;filter:drop-shadow(0 0 8px #00d4ff)">🛰️</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  const marker = L.marker([0, 0], { icon: issIcon }).addTo(map);
  const trail = L.polyline([], { color: '#00d4ff', weight: 1.5, opacity: 0.5, dashArray: '4 4' }).addTo(map);

  state.issMap = map;
  state.issMarker = marker;
  state.issTrail = trail;
}

// ── ISS DATA ──────────────────────────────────────────────
async function fetchISSData() {
  try {
    // Primary: wheretheiss.at
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) throw new Error('wheretheiss failed');
    const d = await res.json();
    updateISSDisplay({
      latitude: d.latitude,
      longitude: d.longitude,
      altitude: d.altitude,
      velocity: d.velocity,
      visibility: d.visibility,
    });
  } catch {
    // Fallback: open-notify
    try {
      const res = await fetch('https://api.open-notify.org/iss-now.json');
      const d = await res.json();
      updateISSDisplay({
        latitude: parseFloat(d.iss_position.latitude),
        longitude: parseFloat(d.iss_position.longitude),
        altitude: 408,
        velocity: 27600,
        visibility: 'N/A',
      });
    } catch (e) {
      showToast('⚠️ ISS data unavailable', 'error');
    }
  }
}

function updateISSDisplay(d) {
  state.issData = d;

  const lat = parseFloat(d.latitude).toFixed(4);
  const lon = parseFloat(d.longitude).toFixed(4);
  const alt = parseFloat(d.altitude).toFixed(1);
  const vel = parseFloat(d.velocity).toFixed(0);

  setText('issLat', lat + '°');
  setText('issLon', lon + '°');
  setText('issAlt', alt + ' km');
  setText('issVel', Number(vel).toLocaleString() + ' km/h');
  setText('issVis', d.visibility || 'Daylight');

  // Remove skeleton
  ['issLat','issLon','issAlt','issVel','issVis','issRegion'].forEach(id => {
    document.getElementById(id)?.classList.remove('skeleton');
  });

  // Region reverse geocode (simple)
  getRegion(lat, lon);

  // Move map marker
  if (state.issMap) {
    const pos = [lat, lon];
    state.issMarker.setLatLng(pos);
    state.trailPoints.push(pos);
    if (state.trailPoints.length > 120) state.trailPoints.shift();
    state.issTrail.setLatLngs(state.trailPoints);

    // Update popup
    state.issMarker.bindPopup(
      `<b>🛰️ ISS</b><br>Lat: ${lat}°<br>Lon: ${lon}°<br>Alt: ${alt} km<br>Vel: ${Number(vel).toLocaleString()} km/h`
    );
  }

  // Velocity history (for chart)
  state.velocityHistory.push(parseFloat(vel));
  state.altitudeHistory.push(parseFloat(alt));
  if (state.velocityHistory.length > 30) {
    state.velocityHistory.shift();
    state.altitudeHistory.shift();
  }
  updateMiniVelChart();

  // Map refresh badge
  const badge = document.getElementById('mapRefreshBadge');
  if (badge) badge.textContent = '↻ Updated ' + new Date().toLocaleTimeString();
}

async function getRegion(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await res.json();
    const region = d.address?.country || d.address?.ocean || d.display_name?.split(',').pop() || 'International Waters';
    setText('issRegion', region.trim().substring(0, 20));
    setText('mapRegionLabel', region.trim());
    document.getElementById('issRegion')?.classList.remove('skeleton');
  } catch {
    setText('issRegion', 'Int\'l Waters');
  }
}

// ── CREW ─────────────────────────────────────────────────
async function fetchCrew() {
  try {
    const res = await fetch('https://api.open-notify.org/astros.json');
    const d = await res.json();
    state.crewData = d.people;

    // Filter ISS
    const issCrew = d.people.filter(p => p.craft === 'ISS');
    setText('crewCountBadge', issCrew.length + ' aboard');
    setText('totalHumans', d.people.length);
    setText('issCrewCount', issCrew.length);

    // Render crew list (sidebar panel)
    const list = document.getElementById('crewList');
    list.innerHTML = issCrew.map((p, i) => `
      <div class="crew-item">
        <div class="crew-avatar">${['👨‍🚀','👩‍🚀'][i % 2]}</div>
        <div>
          <div class="crew-name">${p.name}</div>
          <div class="crew-craft">${p.craft}</div>
        </div>
      </div>
    `).join('');

    // Crew section
    loadCrewSection(d.people);
  } catch {
    document.getElementById('crewList').innerHTML = '<p style="color:var(--muted);font-size:.8rem;">Could not load crew data</p>';
  }
}

function loadCrewSection(people) {
  const grid = document.getElementById('crewSectionGrid');
  if (!grid) return;
  if (!people || people.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted)">Loading crew...</p>';
    return;
  }
  const avatars = ['👨‍🚀','👩‍🚀','🧑‍🚀'];
  grid.innerHTML = people.map((p, i) => `
    <div class="crew-section-card">
      <div class="crew-section-avatar">${avatars[i % 3]}</div>
      <div class="crew-section-name">${p.name}</div>
      <div class="crew-section-craft">${p.craft}</div>
      <div style="font-size:.75rem;color:var(--muted);margin-top:.3rem">Crew Member</div>
    </div>
  `).join('');
}

// ── NEXT PASS ─────────────────────────────────────────────
async function getNextPass() {
  const lat = document.getElementById('passLat').value;
  const lon = document.getElementById('passLon').value;
  const result = document.getElementById('passResult');
  if (!lat || !lon) { result.textContent = 'Please enter coordinates.'; return; }
  result.textContent = '⏳ Calculating...';
  try {
    const res = await fetch(`https://api.open-notify.org/iss-pass.json?lat=${lat}&lon=${lon}`);
    const d = await res.json();
    if (d.response && d.response.length > 0) {
      const pass = d.response[0];
      const t = new Date(pass.risetime * 1000);
      result.innerHTML = `🛰️ Next pass: <b>${t.toUTCString()}</b><br>Duration: ${pass.duration}s`;
    } else {
      result.textContent = 'No pass data returned.';
    }
  } catch {
    result.textContent = '⚠️ Pass API unavailable. Try: whattime.io/iss-pass';
  }
}

// ── NEWS ─────────────────────────────────────────────────
async function loadNews(reset = true) {
  if (reset) {
    state.newsOffset = 0;
    state.newsArticles = [];
  }
  const grid = document.getElementById('newsGrid');
  if (reset) grid.innerHTML = '<div class="skeleton-card"></div>'.repeat(6);

  try {
    const query = state.newsCategory === 'all' ? '' : `&search=${state.newsCategory}`;
    const res = await fetch(`https://api.spaceflightnewsapi.net/v4/articles/?limit=12&offset=${state.newsOffset}${query}`);
    const d = await res.json();
    const articles = d.results || [];
    state.newsArticles = reset ? articles : [...state.newsArticles, ...articles];
    state.newsOffset += articles.length;
    renderNews(state.newsArticles);
    updateTicker(articles);
    renderTrending(articles);
  } catch {
    grid.innerHTML = '<p style="color:var(--muted);padding:1rem">⚠️ Could not load news. Check connection.</p>';
    showToast('⚠️ News feed unavailable', 'error');
  }
}

function renderNews(articles) {
  const query = document.getElementById('newsSearch').value.toLowerCase();
  const filtered = query
    ? articles.filter(a => a.title.toLowerCase().includes(query) || a.summary?.toLowerCase().includes(query))
    : articles;
  const grid = document.getElementById('newsGrid');
  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);padding:1rem">No articles found.</p>';
    return;
  }
  grid.innerHTML = filtered.map(a => `
    <div class="news-card" onclick="window.open('${a.url}','_blank')">
      <img src="${a.image_url || 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&q=60'}"
           alt="${a.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&q=60'" />
      <div class="news-card-body">
        <div class="news-source">${a.news_site || 'Space News'}</div>
        <div class="news-title">${a.title}</div>
        <div class="news-summary">${a.summary || ''}</div>
        <div class="news-footer">
          <span class="news-date">${new Date(a.published_at).toLocaleDateString()}</span>
          <a class="news-read" href="${a.url}" target="_blank" onclick="event.stopPropagation()">Read →</a>
        </div>
      </div>
    </div>
  `).join('');
}

function filterNews() { renderNews(state.newsArticles); }

function setNewsCategory(cat, btn) {
  state.newsCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadNews();
}

function loadMoreNews() { loadNews(false); }

function updateTicker(articles) {
  if (!articles.length) return;
  const text = articles.slice(0, 5).map(a => a.title).join('  ●  ');
  document.getElementById('tickerText').textContent = text;
}

function renderTrending(articles) {
  const tags = document.getElementById('trendingTags');
  const keywords = ['ISS', 'SpaceX', 'NASA', 'Moon', 'Mars', 'Rocket', 'Starship', 'Crew'];
  tags.innerHTML = keywords.map(k => `<span class="trending-tag" onclick="setNewsCategory('${k}',document.createElement('button'))">${k}</span>`).join('');
}

// ── CHARTS ───────────────────────────────────────────────
function initCharts() {
  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

  // Mini velocity chart (tracker page)
  const velCtx = document.getElementById('velocityChart')?.getContext('2d');
  if (velCtx) {
    state.charts.vel = new Chart(velCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Velocity km/h',
          data: [],
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0,212,255,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { ticks: { color: '#64748b', font: { size: 10 } } },
        },
      },
    });
  }
}

function updateMiniVelChart() {
  const chart = state.charts.vel;
  if (!chart) return;
  chart.data.labels = state.velocityHistory.map((_, i) => i);
  chart.data.datasets[0].data = state.velocityHistory;
  chart.update('none');
}

function refreshAnalyticsCharts() {
  // Altitude chart
  const altCtx = document.getElementById('altitudeChart')?.getContext('2d');
  if (altCtx && !state.charts.alt) {
    state.charts.alt = new Chart(altCtx, {
      type: 'line',
      data: {
        labels: state.altitudeHistory.map((_, i) => i),
        datasets: [{
          label: 'Altitude km',
          data: state.altitudeHistory,
          borderColor: '#7b5ea7',
          backgroundColor: 'rgba(123,94,167,0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false } },
      },
    });
  } else if (state.charts.alt) {
    state.charts.alt.data.labels = state.altitudeHistory.map((_, i) => i);
    state.charts.alt.data.datasets[0].data = state.altitudeHistory;
    state.charts.alt.update('none');
  }

  // Orbit coverage pie
  const orbitCtx = document.getElementById('orbitChart')?.getContext('2d');
  if (orbitCtx && !state.charts.orbit) {
    state.charts.orbit = new Chart(orbitCtx, {
      type: 'doughnut',
      data: {
        labels: ['Daylight', 'Eclipse'],
        datasets: [{ data: [55, 45], backgroundColor: ['#00d4ff', '#7b5ea7'], borderWidth: 0 }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  }

  // Live velocity chart (analytics)
  const liveCtx = document.getElementById('liveVelChart')?.getContext('2d');
  if (liveCtx && !state.charts.liveVel) {
    state.charts.liveVel = new Chart(liveCtx, {
      type: 'bar',
      data: {
        labels: state.velocityHistory.map((_, i) => i),
        datasets: [{
          label: 'Velocity',
          data: state.velocityHistory,
          backgroundColor: 'rgba(0,212,255,0.3)',
          borderColor: '#00d4ff',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: false } },
      },
    });
  } else if (state.charts.liveVel) {
    state.charts.liveVel.data.labels = state.velocityHistory.map((_, i) => i);
    state.charts.liveVel.data.datasets[0].data = state.velocityHistory;
    state.charts.liveVel.update('none');
  }
}

// ── AI SUMMARY ────────────────────────────────────────────
async function generateSummary() {
  const box = document.getElementById('aiSummary');
  const btn = document.getElementById('summaryBtn');
  btn.disabled = true;
  btn.textContent = 'Generating...';
  box.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';

  const context = buildContext();
  const prompt = `Give a concise 3-sentence dashboard summary of the current ISS status and top space news:\n${context}`;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, context }),
    });
    const d = await res.json();
    box.innerHTML = `<p>${d.reply || 'Summary unavailable.'}</p>`;
  } catch {
    box.innerHTML = '<p style="color:var(--muted)">Summary unavailable — API not connected.</p>';
  }
  btn.disabled = false;
  btn.textContent = 'Generate Summary';
}

// ── CHATBOT ───────────────────────────────────────────────
function toggleChatbot() {
  document.getElementById('chatbotPanel').classList.toggle('open');
}

function handleChatKey(e) {
  if (e.key === 'Enter') sendChatMessage();
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendMessage('user', msg);
  hideSuggestions();

  // Typing indicator
  const typingId = appendTyping();
  const context = buildContext();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, context }),
    });
    const d = await res.json();
    removeTyping(typingId);
    appendMessage('bot', d.reply || 'I could not get a response. Please try again.');
  } catch {
    removeTyping(typingId);
    appendMessage('bot', '⚠️ Could not connect to OrbitAI. Ensure the API is deployed.');
  }
}

function buildContext() {
  const iss = state.issData;
  const issStr = iss
    ? `ISS Position: Lat ${parseFloat(iss.latitude).toFixed(2)}°, Lon ${parseFloat(iss.longitude).toFixed(2)}°, Altitude ${parseFloat(iss.altitude).toFixed(1)} km, Velocity ${parseFloat(iss.velocity).toFixed(0)} km/h, Visibility: ${iss.visibility || 'N/A'}`
    : 'ISS data not yet loaded.';

  const crewStr = state.crewData.length
    ? 'People in space: ' + state.crewData.map(p => `${p.name} (${p.craft})`).join(', ')
    : 'Crew data not loaded.';

  const newsStr = state.newsArticles.slice(0, 5).map((a, i) =>
    `${i + 1}. [${a.news_site}] ${a.title}`
  ).join('\n');

  return `${issStr}\n${crewStr}\nTop news:\n${newsStr || 'No news loaded.'}`;
}

function appendMessage(role, text) {
  const msgs = document.getElementById('chatMessages');
  const isBot = role === 'bot';
  const div = document.createElement('div');
  div.className = `chat-message ${isBot ? 'bot-message' : 'user-message'}`;
  div.innerHTML = `
    ${isBot ? '<div class="msg-avatar">🤖</div>' : ''}
    <div class="msg-bubble"><p>${escapeHtml(text)}</p></div>
    ${!isBot ? '<div class="msg-avatar">👤</div>' : ''}
  `;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  state.chatHistory.push({ role, text });
  return div;
}

function appendTyping() {
  const msgs = document.getElementById('chatMessages');
  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.id = id;
  div.className = 'chat-message bot-message';
  div.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-bubble"><span class="typing-dots"><span></span><span></span><span></span></span></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

function hideSuggestions() {
  const s = document.getElementById('chatSuggestions');
  if (s) s.style.display = 'none';
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── AUTO REFRESH ──────────────────────────────────────────
function startAutoRefresh() {
  // ISS every 5 seconds
  setInterval(fetchISSData, 5000);
  // News every 5 minutes
  setInterval(() => loadNews(), 300000);
}

// ── HELPERS ───────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}