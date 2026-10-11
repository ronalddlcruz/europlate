export const codePart = (value: string, length: number) => {
  const words = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().match(/[A-Z0-9]+/g) ?? []
  const initials = words.map(word => word[0]).join('')
  const compact = words.join('')
  return (initials.length >= length ? initials : compact).slice(0, length).padEnd(length, 'X')
}
