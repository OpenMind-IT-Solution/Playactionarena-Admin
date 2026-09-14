export type Category = {
  id: number
  description: string
  name: string
  status: string
  gstRate?: number
}

export type CategoryTypes = {
  categories: Category[]
}