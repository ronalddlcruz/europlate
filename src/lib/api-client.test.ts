import assert from 'node:assert/strict'
import test from 'node:test'
import { api, apiClient } from '@/lib/api-client'

test('la fachada usa el cliente compartido y mantiene el token y contrato de datos', async () => {
  const originalFetch = globalThis.fetch
  const originalStorage = globalThis.localStorage
  const storage = new Map<string, string>([['europlate.access_token', 'jwt']])
  let requestUrl = ''
  let requestHeaders: HeadersInit | undefined

  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
  } as Storage
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input)
    requestHeaders = init?.headers
    return new Response(JSON.stringify({ data: { id: 'product-1' } }), { status: 200 })
  }

  try {
    assert.deepEqual(await api<{ id: string }>('/api/products/1'), { id: 'product-1' })
    assert.equal(requestUrl.endsWith('/api/products/1'), true)
    assert.equal(new Headers(requestHeaders).get('Authorization'), 'Bearer jwt')
  } finally {
    globalThis.fetch = originalFetch
    globalThis.localStorage = originalStorage
  }
})

test('la carga de PDF conserva encabezados y devuelve el documento del servidor', async () => {
  const originalFetch = globalThis.fetch
  const originalStorage = globalThis.localStorage
  let request: RequestInit | undefined

  globalThis.localStorage = { getItem: () => null } as unknown as Storage
  globalThis.fetch = async (_input, init) => {
    request = init
    return new Response(JSON.stringify({ data: { storageKey: 'document-1' } }), { status: 200 })
  }

  try {
    const file = new File(['pdf'], 'factura 1.pdf', { type: 'application/pdf' })
    assert.deepEqual(
      await apiClient.uploadPdf<{ storageKey: string }>('/api/imports/documents', file, 'Error'),
      { storageKey: 'document-1' },
    )
    assert.equal(new Headers(request?.headers).get('Content-Type'), 'application/pdf')
    assert.equal(new Headers(request?.headers).get('X-File-Name'), 'factura%201.pdf')
    assert.equal(request?.body, file)
  } finally {
    globalThis.fetch = originalFetch
    globalThis.localStorage = originalStorage
  }
})
