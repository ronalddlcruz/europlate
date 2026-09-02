export type Presentation = {
  id: string
  name: string
  unit: string
  minimum: number
  factor: number
  stock: number
  values: Record<string, string>
  autoName: boolean
}
