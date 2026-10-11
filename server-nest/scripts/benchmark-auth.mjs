// Comparación segura: el correo no existe y no se escriben datos en la BD.
const baseUrl = process.env.NEST_BENCHMARK_BASE_URL ?? 'http://127.0.0.1:3002'
const requests = Number(process.env.NEST_BENCHMARK_REQUESTS ?? 20)
const concurrency = Number(process.env.NEST_BENCHMARK_CONCURRENCY ?? 0)
if (!Number.isInteger(requests) || requests < 1 || requests > 100) {
  throw new Error('NEST_BENCHMARK_REQUESTS debe estar entre 1 y 100')
}
if (!Number.isInteger(concurrency) || concurrency < 0 || concurrency > 20) {
  throw new Error('NEST_BENCHMARK_CONCURRENCY debe estar entre 0 y 20')
}

const email = `benchmark-auth-${Date.now()}@example.invalid`
const body = JSON.stringify({ email, password: 'benchmark-password' })

async function sample(url, method = 'GET', payload) {
  const started = performance.now()
  const response = await fetch(url, {
    method,
    headers: payload ? { 'content-type': 'application/json' } : undefined,
    body: payload,
    signal: AbortSignal.timeout(15_000),
  })
  await response.arrayBuffer()
  return { status: response.status, ms: performance.now() - started }
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(sorted.length * ratio) - 1].toFixed(1)
}

async function measure(label, url, method, payload, expectedStatus) {
  for (let i = 0; i < 3; i++) await sample(url, method, payload)
  const timings = []
  for (let i = 0; i < requests; i++) {
    const result = await sample(url, method, payload)
    if (result.status !== expectedStatus)
      throw new Error(`${label}: HTTP ${result.status}, esperado ${expectedStatus}`)
    timings.push(result.ms)
  }
  console.log(
    `${label}: n=${requests}, p50=${percentile(timings, 0.5)} ms, p95=${percentile(timings, 0.95)} ms`,
  )
}

async function measureConcurrent(label, url, method, payload, expectedStatus) {
  const timings = []
  const started = performance.now()
  for (let offset = 0; offset < requests; offset += concurrency) {
    const batchSize = Math.min(concurrency, requests - offset)
    const batch = await Promise.all(
      Array.from({ length: batchSize }, () => sample(url, method, payload)),
    )
    for (const result of batch) {
      if (result.status !== expectedStatus) {
        throw new Error(`${label}: HTTP ${result.status}, esperado ${expectedStatus}`)
      }
      timings.push(result.ms)
    }
  }
  console.log(
    `${label}: n=${requests}, simultáneas=${concurrency}, p50=${percentile(timings, 0.5)} ms, ` +
      `p95=${percentile(timings, 0.95)} ms, total=${(performance.now() - started).toFixed(1)} ms`,
  )
}

await measure('Nest Swagger (sin BD)', `${baseUrl}/docs-json`, 'GET', undefined, 200)
await measure(
  'Nest login inexistente (consulta Supabase)',
  `${baseUrl}/api/auth/login`,
  'POST',
  body,
  401,
)
if (concurrency > 0) {
  await measureConcurrent(
    'Nest login inexistente concurrente',
    `${baseUrl}/api/auth/login`,
    'POST',
    body,
    401,
  )
}
if (process.env.EXPRESS_BENCHMARK_BASE_URL) {
  await measure(
    'Express login inexistente (consulta Supabase)',
    `${process.env.EXPRESS_BENCHMARK_BASE_URL}/api/auth/login`,
    'POST',
    body,
    401,
  )
}
