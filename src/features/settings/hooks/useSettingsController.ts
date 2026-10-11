import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { amount } from '../components/shared'
import { createExchangeRate,deleteExchangeRate,listExchangeRates,refreshExchangeRate,updateExchangeRate,type ExchangeRate,type ExchangeRatePayload } from '../services/exchange-rate-api.service'

export function useSettingsController() {
  const client = useQueryClient(); const [modal, setModal] = useState(false); const [editing, setEditing] = useState<ExchangeRate>(); const [notice, setNotice] = useState(''); const query = useQuery({ queryKey: ['exchange-rates'], queryFn: listExchangeRates }); const rates = query.data ?? []; const current = rates[0]
  const invalidate = () => { void client.invalidateQueries({ queryKey: ['exchange-rates'] }) }; const say = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3500) }
  const save = useMutation({ mutationFn: ({ id, payload }: { id?: string; payload: ExchangeRatePayload }) => id ? updateExchangeRate(id, payload) : createExchangeRate(payload), onSuccess: () => { invalidate(); setModal(false); say('Tipo de cambio guardado correctamente.') }, onError: (error: Error) => say(error.message) })
  const automatic = useMutation({ mutationFn: refreshExchangeRate, onSuccess: rate => { invalidate(); say(`Tasa actualizada: S/ ${amount(rate).toFixed(4)} por USD.`) }, onError: (error: Error) => say(error.message) })
  const remove = useMutation({ mutationFn: deleteExchangeRate, onSuccess: () => { invalidate(); say('Tipo de cambio eliminado.') }, onError: (error: Error) => say(error.message) })

  return { client, modal, setModal, editing, setEditing, notice, setNotice, query, rates, current, invalidate, say, save, automatic, remove }
}
