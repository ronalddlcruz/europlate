import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors/app-error.js'

const storage = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)
const safeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(-160) || 'comprobante.pdf'

export async function uploadPurchaseDocument(companyId: string, fileName: string, content: Buffer) {
  const storageKey = `purchases/${companyId}/${randomUUID()}-${safeFileName(fileName)}`
  const { error } = await storage.storage.from(env.SUPABASE_PURCHASES_BUCKET).upload(storageKey, content, { contentType: 'application/pdf', upsert: false })
  if (error) throw new AppError('PURCHASE_DOCUMENT_UPLOAD_FAILED', 'No se pudo subir el comprobante PDF. Inténtalo nuevamente.', 502)
  return { fileName, mimeType: 'application/pdf', size: content.length, storageKey }
}

export async function removePurchaseDocument(storageKey: string) {
  const { error } = await storage.storage.from(env.SUPABASE_PURCHASES_BUCKET).remove([storageKey])
  if (error) throw new AppError('PURCHASE_DOCUMENT_DELETE_FAILED', 'No se pudo retirar el comprobante adjunto.', 502)
}

export async function uploadImportDocument(companyId: string, fileName: string, content: Buffer) {
  const storageKey = `imports/${companyId}/${randomUUID()}-${safeFileName(fileName)}`
  const { error } = await storage.storage.from(env.SUPABASE_PURCHASES_BUCKET).upload(storageKey, content, { contentType: 'application/pdf', upsert: false })
  if (error) throw new AppError('IMPORT_DOCUMENT_UPLOAD_FAILED', 'No se pudo subir el documento PDF. Inténtalo nuevamente.', 502)
  return { fileName, mimeType: 'application/pdf', size: content.length, storageKey }
}

export async function removeImportDocument(storageKey: string) {
  const { error } = await storage.storage.from(env.SUPABASE_PURCHASES_BUCKET).remove([storageKey])
  if (error) throw new AppError('IMPORT_DOCUMENT_DELETE_FAILED', 'No se pudo retirar el documento adjunto.', 502)
}
