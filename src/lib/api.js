// MangroveSignal API client — thin fetch wrappers for the backend at /api

const BASE = '/api';

async function parseResponse(res) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  return null;
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
  });
  const data = await parseResponse(res);
  if (!res.ok) {
    const message =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- Config ---
export function getConfig() {
  return apiFetch('/config');
}

// --- Drafts / Report flow ---
export function createDraft({ photo, lat, lon, submitter_note }) {
  const form = new FormData();
  form.append('photo', photo);
  form.append('lat', String(lat));
  form.append('lon', String(lon));
  if (submitter_note) form.append('submitter_note', submitter_note);
  return apiFetch('/drafts', { method: 'POST', body: form });
}

export function getVision(incident_uuid, retry = false) {
  const q = retry ? '?retry=true' : '';
  return apiFetch(`/drafts/${incident_uuid}/vision${q}`, { method: 'POST' });
}

export function getSpatial(incident_uuid) {
  return apiFetch(`/drafts/${incident_uuid}/spatial`, { method: 'POST' });
}

export function submitDraft(incident_uuid, evidence) {
  return apiFetch(`/drafts/${incident_uuid}/submit`, {
    method: 'POST',
    body: JSON.stringify(evidence),
  });
}

// --- Map ---
export function getIncidents() {
  return apiFetch('/incidents');
}

export function getGmwDisplay() {
  return apiFetch('/gmw-display');
}

// --- Review ---
export function getReviewQueue(password) {
  return apiFetch('/review/queue', {
    headers: { 'x-review-password': password },
  });
}

export function getReviewIncident(incident_uuid, password) {
  return apiFetch(`/review/incidents/${incident_uuid}`, {
    headers: { 'x-review-password': password },
  });
}

export async function getReviewPhoto(incident_uuid, password) {
  const res = await fetch(`${BASE}/review/incidents/${incident_uuid}/photo`, {
    headers: { 'x-review-password': password },
  });
  if (!res.ok) {
    const err = new Error(`Photo fetch failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.blob();
}

export function triageIncident(incident_uuid, password, payload) {
  return apiFetch(`/incidents/${incident_uuid}/triage`, {
    method: 'PATCH',
    headers: {
      'x-review-password': password,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
