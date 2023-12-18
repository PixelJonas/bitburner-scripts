export interface Portfolio {

  reserve: number, // The amount of money to be held in reserve.
  symbols: {
    [symbol: string]: Symbol
  }
}
export interface Symbol {
  cost_long: number, // Total cost of buying all shares in Long.
  cost_short: number, // Total cost of buying all shares in Short.
  commission_long: number, // Commission for all shares in Long.
  commission_short: number, // Commission for all shares in Short.
  forecast: number, // The forecast for the stock.
  history: number[], // History of price changes.  Latest
  // value at front of array.  Pre-4S only.
  prev_price: number, // Previous price of the stock.  Pre-4S only.
}