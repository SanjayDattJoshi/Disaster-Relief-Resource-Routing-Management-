// API Base URL — matches backend server.js PORT
const API_URL = 'https://disaster-relief-resource-routing-management-production.up.railway.app/api';
// State
let centers = [];
let areas   = [];
let roads   = [];

// ══════════════════════════════════════════════════
//  NETWORK OVERVIEW MAP
// ══════════════════════════════════════════════════

let networkMap       = null;
let centerLayer      = null;
let areaLayer        = null;
let routeLayer       = null;
const mapLayerState  = { centers: true, areas: true, routes: true };

// Coordinate lookup keyed by MongoDB _id string
const locCoords = {};

function initMap() {
  if (networkMap) return;

  networkMap = L.map('networkMap', {
    center: [27.18, 78.00],
    zoom: 11,
    zoomControl: true,
    attributionControl: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(networkMap);

  centerLayer = L.layerGroup().addTo(networkMap);
  areaLayer   = L.layerGroup().addTo(networkMap);
  routeLayer  = L.layerGroup().addTo(networkMap);
}

// ── Custom SVG icon factory ────────────────────────────────────────────────
function makeMapIcon(fillColor, glowColor, pulse) {
  const sz = pulse ? 48 : 36;
  const pulseAnim = pulse ? `
    <circle cx="12" cy="12" r="9" fill="none" stroke="${glowColor}" stroke-width="1.5" opacity="0.6">
      <animate attributeName="r" values="9;20" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0" dur="1.8s" repeatCount="indefinite"/>
    </circle>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24">
    ${pulseAnim}
    <circle cx="12" cy="12" r="8" fill="${fillColor}" opacity="0.25"/>
    <circle cx="12" cy="12" r="5" fill="${fillColor}"/>
    <circle cx="12" cy="12" r="5" fill="none" stroke="${glowColor}" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
    popupAnchor: [0, -(sz / 2)]
  });
}

const MAP_ICONS = {
  center:      makeMapIcon('rgba(52,199,89,0.9)',   '#34c759', false),
  area_high:   makeMapIcon('rgba(255,45,85,0.9)',   '#ff2d55', true),
  area_medium: makeMapIcon('rgba(255,149,0,0.9)',   '#ff9500', false),
  area_low:    makeMapIcon('rgba(0,122,255,0.9)',    '#007aff', false),
};

function areaIcon(score) {
  if (score >= 0.7) return MAP_ICONS.area_high;
  if (score >= 0.4) return MAP_ICONS.area_medium;
  return MAP_ICONS.area_low;
}

function priorityBadgeClass(score) {
  if (score >= 0.7) return 'priority-high';
  if (score >= 0.4) return 'priority-medium';
  return 'priority-low';
}

// ── Render functions ───────────────────────────────────────────────────────
function renderMapCenters(data) {
  if (!centerLayer) return;
  centerLayer.clearLayers();
  data.forEach(c => {
    if (!c.latitude || !c.longitude) return;
    locCoords[c._id] = [c.latitude, c.longitude];
    const popup = `
      <div class="map-popup-title center-popup">⛺ ${c.name}</div>
      <div class="map-popup-row"><span>ID</span><strong>${c._id}</strong></div>
      <div class="map-popup-row"><span>🍱 Food</span><strong>${c.resources.food}</strong></div>
      <div class="map-popup-row"><span>💧 Water</span><strong>${c.resources.water}</strong></div>
      <div class="map-popup-row"><span>🏥 Medical</span><strong>${c.resources.medical}</strong></div>`;
    L.marker([c.latitude, c.longitude], { icon: MAP_ICONS.center })
      .bindPopup(popup, { maxWidth: 220 })
      .addTo(centerLayer);
  });
  document.getElementById('mapStatCenters').textContent = data.length;
}

function renderMapAreas(data) {
  if (!areaLayer) return;
  areaLayer.clearLayers();
  data.forEach(a => {
    if (!a.latitude || !a.longitude) return;
    locCoords[a._id] = [a.latitude, a.longitude];
    const score = a.priorityScore || 0;
    const badge = score > 0
      ? `<span class="priority-badge ${priorityBadgeClass(score)}">${score}</span>` : '';
    const popup = `
      <div class="map-popup-title area-popup">🚨 ${a.name}</div>
      <div class="map-popup-row"><span>ID</span><strong>${a._id}</strong></div>
      <div class="map-popup-row"><span>👥 People</span><strong>${a.peopleAffected.toLocaleString()}</strong></div>
      <div class="map-popup-row"><span>⚠️ Severity</span><strong>${a.severity}/5</strong></div>
      <div class="map-popup-row"><span>🚧 Access</span><strong>${a.accessDifficulty ? 'Difficult' : 'Easy'}</strong></div>
      ${badge ? `<div style="margin-top:8px">${badge}</div>` : ''}`;
    L.marker([a.latitude, a.longitude], { icon: areaIcon(score) })
      .bindPopup(popup, { maxWidth: 220 })
      .addTo(areaLayer);
  });
  document.getElementById('mapStatAreas').textContent = data.length;
}

function renderMapRoads(data) {
  if (!routeLayer) return;
  routeLayer.clearLayers();
  let open = 0, blocked = 0;

  data.forEach(r => {
    // fromLocation and toLocation are populated objects from Mongoose
    const fromId = r.fromLocation && r.fromLocation._id ? r.fromLocation._id : r.fromLocation;
    const toId   = r.toLocation   && r.toLocation._id   ? r.toLocation._id   : r.toLocation;
    const fromCoord = locCoords[fromId];
    const toCoord   = locCoords[toId];
    if (!fromCoord || !toCoord) return;

    if (r.isBlocked) {
      blocked++;
      L.polyline([fromCoord, toCoord], {
        color: '#ff2d55', weight: 2.5, opacity: 0.7, dashArray: '7 7'
      }).bindTooltip(`🚫 Road — BLOCKED`, { sticky: true })
        .addTo(routeLayer);
    } else {
      open++;
      L.polyline([fromCoord, toCoord], {
        color: '#007aff', weight: 2.5, opacity: 0.65
      }).bindTooltip(`Road — ${r.distance} km · ${r.travelTime} min`, { sticky: true })
        .addTo(routeLayer);
    }
  });

  document.getElementById('mapStatRoads').textContent   = open;
  document.getElementById('mapStatBlocked').textContent = blocked;
}

// ── Public map controls ────────────────────────────────────────────────────
function toggleMapLayer(name) {
  mapLayerState[name] = !mapLayerState[name];
  const layerMap = { centers: centerLayer, areas: areaLayer, routes: routeLayer };
  if (mapLayerState[name]) {
    networkMap.addLayer(layerMap[name]);
  } else {
    networkMap.removeLayer(layerMap[name]);
  }
}

function mapFitAll() {
  const coords = [];
  centers.forEach(c => { if (c.latitude) coords.push([c.latitude, c.longitude]); });
  areas.forEach(a =>   { if (a.latitude) coords.push([a.latitude, a.longitude]); });
  if (coords.length > 0 && networkMap) {
    networkMap.fitBounds(coords, { padding: [40, 40] });
  }
}

async function refreshMap() {
  initMap();
  renderMapCenters(centers);
  renderMapAreas(areas);
  renderMapRoads(roads);
}

// ══════════════════════════════════════════════════
//  INITIALISE
// ══════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  updateLastUpdated();
  setInterval(updateLastUpdated, 1000);

  // Load data in order so map coordinates are ready before roads render
  async function loadAllData() {
    await loadCenters();
    await loadAreas();
    await loadRoads();
  }
  loadAllData();

  setupFormHandlers();
});

// ══════════════════════════════════════════════════
//  TAB NAVIGATION
// ══════════════════════════════════════════════════

function initializeTabs() {
  const tabs        = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) content.classList.add('active');
      });

      if (targetTab === 'routing')    populateRouteSelects();
      if (targetTab === 'simulation') populateSimulationSelects();

      if (targetTab === 'dashboard' && networkMap) {
        setTimeout(() => networkMap.invalidateSize(), 50);
      }
    });
  });
}

// ══════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════

function updateLastUpdated() {
  document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
}

async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data && method !== 'GET') options.body = JSON.stringify(data);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

function getPriorityLevel(score) {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

// ══════════════════════════════════════════════════
//  DATA LOADERS
// ══════════════════════════════════════════════════

async function loadCenters() {
  const result = await apiRequest('/centers');
  if (Array.isArray(result)) {
    centers = result;
    displayCenters(centers);
    initMap();
    renderMapCenters(centers);
    if (roads.length) renderMapRoads(roads);
  }
}

async function loadAreas() {
  const result = await apiRequest('/areas');
  if (Array.isArray(result)) {
    areas = result;
    displayAreas(areas);
    initMap();
    renderMapAreas(areas);
    if (roads.length) renderMapRoads(roads);
  }
}

async function loadRoads() {
  const result = await apiRequest('/roads');
  if (Array.isArray(result)) {
    roads = result;
    displayRoads(roads);
    initMap();
    renderMapRoads(roads);
  }
}

// ══════════════════════════════════════════════════
//  DISPLAY HELPERS
// ══════════════════════════════════════════════════

function displayCenters(data) {
  const container = document.getElementById('centersList');
  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted)">No relief centers found</p>';
    return;
  }
  container.innerHTML = data.map(c => `
    <div class="data-item">
      <strong>${c.name}</strong> (ID: ${c._id})<br>
      📍 ${c.latitude}, ${c.longitude}<br>
      🍱 Food: ${c.resources.food} | 💧 Water: ${c.resources.water} | 🏥 Medical: ${c.resources.medical}
    </div>`).join('');
}

function displayAreas(data) {
  const container = document.getElementById('areasList');
  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted)">No affected areas found</p>';
    return;
  }
  container.innerHTML = data.map(a => `
    <div class="data-item">
      <strong>${a.name}</strong> (ID: ${a._id})<br>
      📍 ${a.latitude}, ${a.longitude}<br>
      👥 People: ${a.peopleAffected} | ⚠️ Severity: ${a.severity}/5 | 🚧 Access: ${a.accessDifficulty === 1 ? 'Difficult' : 'Easy'}<br>
      ${a.priorityScore > 0
        ? `<span class="priority-badge priority-${getPriorityLevel(a.priorityScore)}">Priority: ${a.priorityScore}</span>`
        : ''}
    </div>`).join('');
}

function displayRoads(data) {
  const container = document.getElementById('roadsList');
  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted)">No roads found</p>';
    return;
  }
  container.innerHTML = data.map(r => {
    const fromName = r.fromLocation && r.fromLocation.name ? r.fromLocation.name : r.fromLocation;
    const toName   = r.toLocation   && r.toLocation.name   ? r.toLocation.name   : r.toLocation;
    return `
    <div class="data-item" style="border-left-color:${r.isBlocked ? 'var(--emergency-red)' : 'var(--safe-green)'}">
      <strong>${fromName} ↔ ${toName}</strong><br>
      📏 ${r.distance} km | ⏱️ ${r.travelTime} min | 🛣️ ${r.roadCondition} |
      ${r.isBlocked
        ? '🚫 <strong style="color:var(--emergency-red)">BLOCKED</strong>'
        : '✅ Open'}
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════
//  PRIORITY & ALLOCATION
// ══════════════════════════════════════════════════

async function computePriorities() {
  const resultContainer = document.getElementById('prioritiesResult');
  resultContainer.innerHTML = '<div class="loading"></div> Computing priorities...';

  const result = await apiRequest('/analytics/compute-priorities', 'POST');

  if (result.areas) {
    const sorted = result.areas;

    resultContainer.innerHTML = `
      <h3 style="margin-bottom:15px;color:var(--safe-green)">✓ Priority Computation Complete</h3>
      <table class="table">
        <thead><tr>
          <th>Rank</th><th>Area Name</th><th>Priority Score</th>
          <th>People</th><th>Severity</th><th>Access</th>
        </tr></thead>
        <tbody>
          ${sorted.map((area, i) => `
            <tr>
              <td><strong>${i + 1}</strong></td>
              <td>${area.name}</td>
              <td><span class="priority-badge priority-${getPriorityLevel(area.priorityScore)}">${area.priorityScore}</span></td>
              <td>${area.peopleAffected}</td>
              <td>${area.severity}/5</td>
              <td>${area.accessDifficulty === 1 ? 'Hard' : 'Easy'}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    await loadAreas();
  } else {
    resultContainer.innerHTML = `<p style="color:var(--emergency-red)">Error: ${result.error || result.message}</p>`;
  }
}

// ══════════════════════════════════════════════════
//  ROUTING
// ══════════════════════════════════════════════════

function populateRouteSelects() {
  const cs = centers.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
  const as = areas.map(a   => `<option value="${a._id}">${a.name}</option>`).join('');

  document.getElementById('routeCenterId').innerHTML      = cs;
  document.getElementById('routeAreaId').innerHTML        = as;
  document.getElementById('multiRouteCenterId').innerHTML = cs;
  document.getElementById('multiAreaSelect').innerHTML    = areas.map(a => `
    <label class="checkbox-label">
      <input type="checkbox" name="areaId" value="${a._id}">
      ${a.name}
    </label>`).join('');
}

async function findRoute(event) {
  event.preventDefault();
  const startId = document.getElementById('routeCenterId').value;
  const endId   = document.getElementById('routeAreaId').value;
  const rc      = document.getElementById('routeResult');
  rc.innerHTML  = '<div class="loading"></div> Computing route...';

  const result = await apiRequest('/analytics/compute-route', 'POST', { startId, endId });

  if (result.found) {
    rc.innerHTML = `
      <h3 style="margin-bottom:15px;color:var(--safe-green)">✓ Route Found</h3>
      <div class="route-path">${buildRoutePath(result.path)}</div>
      <div style="margin-top:15px;padding:15px;background:var(--bg-tertiary);border-radius:8px">
        <strong>Total Distance:</strong> ${result.distance} km
      </div>`;
  } else {
    rc.innerHTML = `<p style="color:var(--emergency-red)">${result.error || result.message || 'No route found'}</p>`;
  }
}

async function findMultiRoute(event) {
  event.preventDefault();
  const centerId = document.getElementById('multiRouteCenterId').value;
  const areaIds  = Array.from(document.querySelectorAll('#multiAreaSelect input:checked')).map(cb => cb.value);

  if (!areaIds.length) { alert('Please select at least one area'); return; }

  const rc = document.getElementById('multiRouteResult');
  rc.innerHTML = '<div class="loading"></div> Computing multi-stop route...';

  // Run individual routes to each selected area and display results
  const results = [];
  for (const endId of areaIds) {
    const r = await apiRequest('/analytics/compute-route', 'POST', { startId: centerId, endId });
    if (r.found && r.path.length > 0) {
      results.push({ path: r.path, distance: r.distance, area: r.path[r.path.length - 1].name });
    }
  }

  if (results.length === 0) {
    rc.innerHTML = `<p style="color:var(--emergency-red)">No routes found to selected areas</p>`;
    return;
  }

  rc.innerHTML = `
    <h3 style="margin-bottom:15px;color:var(--safe-green)">✓ Multi-Stop Routes Planned</h3>
    ${results.map((r, i) => `
      <div style="margin-bottom:15px;padding:15px;background:var(--bg-tertiary);border-radius:8px">
        <strong>Stop ${i + 1}: ${r.area}</strong> — ${r.distance} km<br>
        <div class="route-path" style="margin-top:8px">${buildRoutePath(r.path)}</div>
      </div>`).join('')}`;
}

function buildRoutePath(route) {
  return route.map((node, i) => {
    const arrow = i < route.length - 1 ? '<span class="route-arrow">→</span>' : '';
    return `<div class="route-node">${node.name}</div>${arrow}`;
  }).join('');
}

// ══════════════════════════════════════════════════
//  SIMULATION (road block toggle)
// ══════════════════════════════════════════════════

function populateSimulationSelects() {
  const sel = document.getElementById('simRoadId');
  sel.innerHTML = '<option value="">-- Select a road --</option>' +
    roads.map(r => {
      const fromName = r.fromLocation && r.fromLocation.name ? r.fromLocation.name : 'Unknown';
      const toName   = r.toLocation   && r.toLocation.name   ? r.toLocation.name   : 'Unknown';
      return `<option value="${r._id}">${fromName} ↔ ${toName} (${r.distance} km)</option>`;
    }).join('');
}

async function runSimulation(event) {
  event.preventDefault();
  const roadId  = document.getElementById('simRoadId').value;
  const blocked = document.getElementById('simBlocked').value === 'true';

  if (!roadId) { alert('Please select a road to modify'); return; }

  const rc = document.getElementById('simulationResult');
  rc.innerHTML = '<div class="loading"></div> Running simulation...';

  // Toggle the road block status
  const updateResult = await apiRequest(`/roads/${roadId}`, 'PUT', { isBlocked: blocked });

  if (updateResult._id) {
    // Recompute priorities after the road change
    const priorityResult = await apiRequest('/analytics/compute-priorities', 'POST');
    const top5 = priorityResult.areas ? priorityResult.areas.slice(0, 5) : [];

    const fromName = updateResult.fromLocation && updateResult.fromLocation.name ? updateResult.fromLocation.name : 'Unknown';
    const toName   = updateResult.toLocation   && updateResult.toLocation.name   ? updateResult.toLocation.name   : 'Unknown';

    rc.innerHTML = `
      <h3 style="margin-bottom:15px;color:var(--safe-green)">✓ Simulation Complete</h3>
      <div style="padding:15px;background:var(--bg-tertiary);border-radius:8px;margin-bottom:20px">
        <strong>Scenario:</strong> ${fromName} ↔ ${toName} is now ${blocked ? 'BLOCKED 🚫' : 'OPEN ✅'}
      </div>
      <h4 style="margin-bottom:10px">Updated Priority Rankings:</h4>
      <table class="table">
        <thead><tr><th>Rank</th><th>Area</th><th>Priority Score</th><th>People</th><th>Severity</th></tr></thead>
        <tbody>
          ${top5.map((area, i) => `
            <tr>
              <td><strong>${i + 1}</strong></td>
              <td>${area.name}</td>
              <td><span class="priority-badge priority-${getPriorityLevel(area.priorityScore)}">${area.priorityScore}</span></td>
              <td>${area.peopleAffected}</td>
              <td>${area.severity}/5</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    await loadRoads();
  } else {
    rc.innerHTML = `<p style="color:var(--emergency-red)">Error: ${updateResult.error || updateResult.message}</p>`;
  }
}

// ══════════════════════════════════════════════════
//  FORM HANDLERS
// ══════════════════════════════════════════════════

function setupFormHandlers() {
  document.getElementById('routeForm').addEventListener('submit', findRoute);
  document.getElementById('multiRouteForm').addEventListener('submit', findMultiRoute);
  document.getElementById('simulationForm').addEventListener('submit', runSimulation);

  // Add Center
  document.getElementById('addCenterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const payload = {
      name: data.name,
      latitude:  parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      food:    parseInt(data.food)    || 0,
      water:   parseInt(data.water)   || 0,
      medical: parseInt(data.medical) || 0
    };

    const result = await apiRequest('/centers', 'POST', payload);
    if (result._id) {
      alert('Relief center added successfully!');
      e.target.reset();
      await loadCenters();
    } else {
      alert('Error: ' + (result.error || result.message));
    }
  });

  // Add Area
  document.getElementById('addAreaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const payload = {
      name:             data.name,
      latitude:         parseFloat(data.latitude),
      longitude:        parseFloat(data.longitude),
      peopleAffected:   parseInt(data.peopleAffected)   || 0,
      severity:         parseInt(data.severity)          || 1,
      accessDifficulty: parseInt(data.accessDifficulty) || 0,
      food:    parseInt(data.food)    || 0,
      water:   parseInt(data.water)   || 0,
      medical: parseInt(data.medical) || 0
    };

    const result = await apiRequest('/areas', 'POST', payload);
    if (result._id) {
      alert('Affected area added successfully!');
      e.target.reset();
      await loadAreas();
    } else {
      alert('Error: ' + (result.error || result.message));
    }
  });

  // Add Road
  document.getElementById('addRoadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const payload = {
      fromLocation: data.fromLocation,
      fromModel:    data.fromModel,
      toLocation:   data.toLocation,
      toModel:      data.toModel,
      distance:     parseFloat(data.distance)   || 0,
      travelTime:   parseInt(data.travelTime)   || 0,
      isBlocked:    data.isBlocked === 'true',
      roadCondition: data.roadCondition || 'good'
    };

    const result = await apiRequest('/roads', 'POST', payload);
    if (result._id) {
      alert('Road connection added successfully!');
      e.target.reset();
      await loadRoads();
    } else {
      alert('Error: ' + (result.error || result.message));
    }
  });
}
