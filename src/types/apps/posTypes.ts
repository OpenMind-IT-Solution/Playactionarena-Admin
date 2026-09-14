export type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
  total: number
  image?: string
  addons?: { name: string; price: number }[]
}

export type OrderSummary = {
  items: CartItem[]
  subtotal: number
  foodSubtotal: number
  drinksSubtotal: number
  foodGst: number
  drinksGst: number
  gstTotal: number
  total: number
}