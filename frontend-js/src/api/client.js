/**
 * CoreInsight API client with client-side round-robin load balancing.
 *
 * In development, all requests go through Vite's proxy (/api/*) which
 * itself round-robins across backend instances defined in vite.config.js.
 *
 * In production builds, set VITE_API_URLS as a comma-separated list of
 * backend base URLs and this client will round-robin across them directly.
 *
 * Example .env:
 *   VITE_API_URLS=http://api1.example.com,http://api2.example.com
 */

const RAW_URLS = import.meta.env.VITE_API_URLS
const TARGETS = RAW_URLS
  ? RAW_URLS.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : null // null → use Vite proxy prefix /api

let rrIndex = 0

function baseUrl() {
  if (!TARGETS) return '/api'
  const url = TARGETS[rrIndex % TARGETS.length]
  rrIndex++
  return url
}

async function request(method, path, body = null, signal = null) {
  const url = `${baseUrl()}${path}`
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal,
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch (_) { /* ignore */ }
    throw new Error(detail)
  }
  return res.json()
}

export const api = {
  health: (signal) => request('GET', '/health', null, signal),
  predict: (payload, signal) => request('POST', '/predict', payload, signal),
  analyze: (payload, signal) => request('POST', '/analyze', payload, signal),
  simulate: (payload, signal) => request('POST', '/simulate', payload, signal),
  history: (machineId, limit = 10, signal) =>
    request('GET', `/history?machine_id=${encodeURIComponent(machineId)}&limit=${limit}`, null, signal),
}
