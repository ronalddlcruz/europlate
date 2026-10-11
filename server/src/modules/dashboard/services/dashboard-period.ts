const businessMonth = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit',
})

/** Documentos con fecha de negocio usan el día guardado; eventos usan hora de Perú. */
export const monthOfBusinessDate = (value: Date | string) => new Date(value).toISOString().slice(0, 7)
export const monthOfEvent = (value: Date | string) => businessMonth.format(new Date(value))
export const currentBusinessMonth = () => monthOfEvent(new Date())
