export const normalizeProductSearch = (value: string) => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()
  .trim()

export const productSearchTokens = (value: string) =>
  normalizeProductSearch(value)
    .replace(/(\d)\s*x\s*(\d)/g, '$1 $2')
    .match(/[\p{L}\p{N}]+/gu) ?? []

export const matchesProductSearch = (haystack: string, query: string) => {
  const normalized = normalizeProductSearch(haystack)
  return productSearchTokens(query).every(token => normalized.includes(token))
}
