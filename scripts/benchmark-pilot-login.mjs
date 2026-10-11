import { performance } from 'node:perf_hooks'

const baseUrl = process.env.EUROPLATE_API_URL ?? 'http://localhost:3001'
const endpoint = new URL('/api/auth/login', baseUrl)
const body = JSON.stringify({
  email: `benchmark-${Date.now()}@example.invalid`,
  password: 'benchmark-password',
})

async function sample() {
  const started = performance.now()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal: AbortSignal.timeout(15_000),
  })
  await response.arrayBuffer()
  if (response.status !== 401) throw new Error(`Login inexistente devolvió HTTP ${response.status}, esperado 401`)
  return performance.now() - started
}

const quantile = (samples, fraction) => {
  const sorted = [...samples].sort((left, right) => left - right)
  return sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(1)
}

for (let index = 0; index < 2; index++) await sample()
const samples = []
for (let index = 0; index < 10; index++) samples.push(await sample())
console.info(`POST /api/auth/login (correo inexistente, 10 muestras): p50=${quantile(samples, 0.5)} ms, p95=${quantile(samples, 0.95)} ms`)
