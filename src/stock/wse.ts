/// ///////////////////////////////////////////////////////////////////////
// Miscellaneous helper functions for the Stock Market.
/// ///////////////////////////////////////////////////////////////////////

import { NS } from "@ns";
import { assert } from "lib/util.js";
import { BUY_MULTIPLIER, BUY_TAU, COMMISSION, FSIG, INIT, KEEP_DELTA, LONG, LONG_INDEX, MAX_KEEP_MULT, NUM_BUY, SAMPLE_LENGTH, SELL_TAU, SHORT, SHORT_INDEX, SPEND_TAU, WSE_TICK } from "stock/constants";
import { Portfolio } from "/stock/Portfolio";

/**
 * How many shares are available to be purchased.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym A stock symbol.
 * @returns {number} The number of shares of the given stock available to be
 *     purchased.
 */
function available_shares(ns: NS, sym: string): number {
  const max_shares = ns.stock.getMaxShares(sym);
  return max_shares - num_long(ns, sym) - num_short(ns, sym);
}

/**
 * Purchase shares of the top stocks most likely to increase in value during the
 * next tick.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} position The position we want to buy.
 * @returns {Portfolio} The updated portfolio.
 */
function buy_stock(ns: NS, portfolio: Portfolio, position: string): Portfolio {
  assert(is_valid_position(position));
  let stock = most_favourable(ns, portfolio);
  if (position === SHORT) {
    stock = least_favourable(ns, portfolio);
  }
  if (stock.length === 0) {
    return portfolio;
  }

  const new_portfolio = { ...portfolio };
  for (const sym of stock) {
    const nshare = num_shares(ns, sym, new_portfolio, position);
    if (nshare < 1) {
      continue;
    }

    // Try to buy the given number of shares.
    let cost_per_share = 0;
    if (position === LONG) {
      cost_per_share = ns.stock.buyStock(sym, nshare);
    } else {
      cost_per_share = ns.stock.buyShort(sym, nshare);
    }
    if (cost_per_share === 0) {
      continue;
    }

    // Update the cost and commission.
    if (position === LONG) {
      new_portfolio.symbols[sym].cost_long += nshare * cost_per_share;
      new_portfolio.symbols[sym].commission_long += COMMISSION;
    } else {
      new_portfolio.symbols[sym].cost_short += nshare * cost_per_share;
      new_portfolio.symbols[sym].commission_short += COMMISSION;
    }
  }

  return new_portfolio;
}

/**
 * Whether we can short stocks.
 *
 * @param {NS} ns The Netscript API.
 * @returns {boolean} True if we can short stocks; false otherwise.
 */
export function can_short(ns: NS): boolean {
  try {
    ns.stock.buyShort(FSIG, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * The amount of money we can use to purchase shares of a stock.  This takes
 * into account the money that should be held in reserve.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our stock portfolio.
 * @returns {number} The funds for buying shares.
 */
function expenditure(ns: NS, portfolio: Portfolio): number {
  const excess_money = ns.getPlayer().money - portfolio.reserve;
  const fraction = BUY_MULTIPLIER;
  return Math.floor(fraction * excess_money) - COMMISSION;
}

/**
 * The forecast for each stock.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our stock portfolio.
 * @param {boolean} fourS Whether we have access to 4S data and API.
 * @returns {Portfolio} The same portfolio, but with the forecast for each stock.
 */
function get_forecast(ns: NS, portfolio: Portfolio, fourS: boolean): Portfolio {
  assert(typeof fourS == "boolean");
  const new_portfolio = { ...portfolio };
  if (fourS) {
    ns.stock.getSymbols().forEach((sym) => {
      new_portfolio.symbols[sym].forecast = ns.stock.getForecast(sym);
    });
  } else {
    const sum = (sym: string | number) => (new_portfolio.symbols[sym].history as number[]).reduce((prev, curr) => prev += curr, 0);
    const stock_forecast = (sym: string) => sum(sym) / SAMPLE_LENGTH;
    ns.stock.getSymbols().forEach((sym) => {
      new_portfolio.symbols[sym].forecast = stock_forecast(sym);
    });
  }
  return new_portfolio;
}

/**
 * Whether we have access to 4S data and API.
 *
 * @param {NS} ns The Netscript API.
 * @returns {boolean} True if we have access to 4S data and API;
 *     false otherwise.
 */
export function has_4s_api(ns: NS): boolean {
  if (!ns.stock.purchase4SMarketData()) {
    return false;
  }
  if (!ns.stock.purchase4SMarketDataTixApi()) {
    return false;
  }
  return true;
}

/**
 * Whether we have access to pre-4S data and API.
 *
 * @param {NS} ns The Netscript API.
 * @returns {boolean} True if we have access to pre-4S data and API;
 *     false otherwise.
 */
export function has_pre4s_api(ns: NS): boolean {
  if (!ns.stock.purchaseWseAccount()) {
    return false;
  }
  if (!ns.stock.purchaseTixApi()) {
    return false;
  }
  return true;
}

/**
 * Whether we have enough money to be held in reserve.  Must have at least a
 * certain amount of money before we start dabbling on the Stock Market.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {boolean} True if we have sufficient money to be held in reserve;
 *     false otherwise.
 */
function has_money_reserve(ns: NS, portfolio: Portfolio): boolean {
  return ns.getPlayer().money > portfolio.reserve;
}

/**
 * The default portfolio of stocks.
 *
 * @param {NS} ns The Netscript API.
 * @param {boolean} fourS Whether we have access to the 4S data and API.
 * @returns {Promise<Portfolio>} An object representing the initial portfolio of
 *     stocks.
 */
export async function initial_portfolio(ns: NS, fourS: boolean): Promise<Portfolio> {
  assert(typeof fourS === "boolean");
  const portfolio: Portfolio = {
    /**
     * The initial amount of money to be held in reserve.  Will increase as
     * we make a profit from selling shares of a stock.
     */
    reserve: INIT,
    symbols: {}
  };
  const add_stock_data = (sym: string) => {
    portfolio.symbols[sym] = {
      cost_long: 0,
      cost_short: 0,
      commission_long: 0,
      commission_short: 0,
      forecast: 0,
      history: [],
      prev_price: 0,
    };
  };
  ns.stock.getSymbols().forEach(add_stock_data);
  return fourS ? portfolio : populate_history(ns, portfolio);
}

/**
 * Whether the forecast is favourable for the Long position of a stock.  If the
 * forecast for a stock exceeds a given threshold, then the value of the stock
 * is expected to increase in the next tick (or cycle) of the Stock Market.  In
 * this case, we say that the forecast is favourable for the Long position.
 * However, if the forecast for the stock is at most the threshold, then the
 * value of the stock is expected to decrease in the next tick.  Hence the
 * forecast is unfavourable for the Long position.
 *
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} sym The symbol of a stock.
 * @returns {boolean} True if the forecast is favourable for the given stock in
 *     the Long position; false otherwise.
 */
function is_favourable_long(portfolio: Portfolio, sym: string): boolean {
  return portfolio.symbols[sym].forecast > SELL_TAU;
}

/**
 * Whether this is a valid position for a stock.
 *
 * @param {string} position A position of a stock.
 * @returns {boolean} True if the given position is supported; false otherwise.
 */
function is_valid_position(position: string): boolean {
  assert(!(position.length === 0));
  return (
    position === LONG || position === SHORT
  );
}

/**
 * The top stocks most likely to decrease in value during the next tick.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {array<string>} The top stocks that are forecasted to have the
 *     lowest chances of increase in the next tick.  Empty array if no stocks
 *     are forecasted to decrease in value.
 */
function least_favourable(ns: NS, portfolio: Portfolio): Array<string> {
  // Sort the stocks in increasing order of their chances of increase.
  // eslint-disable-next-line max-len
  const not_favourable = (sym: string | number) => portfolio.symbols[sym].forecast < SELL_TAU;
  const to_int = (n: number) => Math.floor(1e6 * n);
  const projection = (sym: string | number) => to_int(portfolio.symbols[sym].forecast);
  const ascending = (syma: any, symb: any) => projection(syma) - projection(symb);
  let stock = ns.stock.getSymbols().filter(not_favourable);
  stock.sort(ascending);

  const can_buy = (sym: string) => available_shares(ns, sym) > 0;
  stock = stock.filter(can_buy);
  return stock.length === 0 ? [] : stock.slice(0, NUM_BUY);
}

/**
 * The top stocks most likely to increase in value during the next tick.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {array<string>} The top stocks that are forecasted to have the best
 *     chances of increase in the next tick.  Empty array if no stocks are
 *     forecasted to increase in value.
 */
function most_favourable(ns: NS, portfolio: Portfolio): Array<string> {
  // Sort the stocks in descending order of their chances of increase.
  // eslint-disable-next-line max-len
  const is_favourable = (sym: string | number) => portfolio.symbols[sym].forecast > BUY_TAU;
  const to_int = (n: number) => Math.floor(1e6 * n);
  const projection = (sym: string | number) => to_int(portfolio.symbols[sym].forecast);
  const descending = (syma: any, symb: any) => projection(symb) - projection(syma);
  let stock = ns.stock.getSymbols().filter(is_favourable);
  stock.sort(descending);

  const can_buy = (sym: string) => available_shares(ns, sym) > 0;
  stock = stock.filter(can_buy);
  return stock.length === 0 ? [] : stock.slice(0, NUM_BUY);
}

/**
 * The number of shares we own in the Long position.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym A stock symbol.
 * @returns {number} How many shares we have of the given stock in the Long
 *     position.
 */
export function num_long(ns: NS, sym: string): number {
  return ns.stock.getPosition(sym)[LONG_INDEX];
}

/**
 * How many shares of a stock we can purchase.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym Buy shares of this stock.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} position The position of the stock.
 * @returns {number} The number of shares of this stock we can buy, in the given
 *     position.  Must be at least zero.  If 0, then we cannot buy any shares of
 *     the given stock.
 */
function num_shares(ns: NS, sym: string, portfolio: Portfolio, position: string): number {
  // Sanity checks.
  assert(is_valid_position(position));
  if (!has_money_reserve(ns, portfolio)) {
    return 0;
  }
  const funds = expenditure(ns, portfolio);
  if (funds < SPEND_TAU) {
    return 0;
  }

  // The maximum number of shares of the stock we can buy.  This takes into
  // account the number of shares we already own.
  const max_share = available_shares(ns, sym);
  if (max_share < 1) {
    return 0;
  }

  // How many more shares of the stock we can buy.
  let nshare = Math.floor(funds / ns.stock.getAskPrice(sym));
  if (position === SHORT) {
    nshare = Math.floor(funds / ns.stock.getBidPrice(sym));
  }
  return Math.min(nshare, max_share);
}

/**
 * The number of shares we own in the Short position.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym A stock symbol.
 * @returns {number} How many shares we have of the given stock in the Short
 *     position.
 */
export function num_short(ns: NS, sym: string): number {
  return ns.stock.getPosition(sym)[SHORT_INDEX];
}

/**
 * Pre-4S only.  The initial price history of each stock.  We need a sample of
 * the recent price changes of each stock.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {Promise<Portfolio>} The same portfolio, but with a sample of the
 *     recent price changes of each stock.
 */
async function populate_history(ns: NS, portfolio: Portfolio): Promise<Portfolio> {
  // The initial price of each stock.
  let new_portfolio = { ...portfolio };
  const set_init_price = (sym: string) => {
    new_portfolio.symbols[sym].prev_price = ns.stock.getPrice(sym);
  };
  ns.stock.getSymbols().forEach(set_init_price);
  // A sample of the price changes.
  for (let i = 0; i < SAMPLE_LENGTH; i++) {
    await ns.sleep(WSE_TICK);
    new_portfolio = update_history(ns, new_portfolio);
    ns.print(`INFO: sampling market data ${i}/${SAMPLE_LENGTH}`);
  }

  return new_portfolio;
}

/**
 * The amount of profit to add to our reserve.  The rest can be used to purchase
 * shares of stocks.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {number} profit The profit from selling shares of a stock.
 * @returns {Promise<number>} How much of the profit to keep.
 */
async function profit_to_keep(ns: NS, portfolio: Portfolio, profit: number): Promise<number> {
  const new_money = ns.getPlayer().money + profit;

  // Given the fraction of the profit we should keep in reserve, do we have
  // enough funds to purchase shares of a stock?
  const has_funds = (keep_amount: number) => {
    const new_reserve = portfolio.reserve + keep_amount;
    const excess_money = new_money - new_reserve;
    const funds = Math.floor(BUY_MULTIPLIER * excess_money);
    return funds >= SPEND_TAU;
  };

  // Determine how much of the profit we can keep.
  let keep_mult = MAX_KEEP_MULT;
  let keep = Math.floor(keep_mult * profit);
  while (!has_funds(keep)) {
    keep_mult -= KEEP_DELTA;
    if (keep_mult <= 0) {
      keep = 0;
      break;
    }
    keep = Math.floor(keep_mult * profit);
    await ns.sleep(1);
  }
  return keep < 0 ? 0 : keep;
}

/**
 * Choose the stock to sell.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} position Either Long or Short.
 * @returns {string} The symbol of the stock to sell in the given position.
 *     Empty string if no stocks should be sold.
 */
function sell_candidate(ns: NS, portfolio: Portfolio, position: string): string {
  assert(is_valid_position(position));

  let has_shares = null;
  let favourable = null;
  if (position === LONG) {
    // All stocks that do not have favourable forecast.  The propitious time
    // to sell shares of a stock in the Long position is when the forecast
    // tells us the stock would decrease in the next tick.
    has_shares = (sym: string) => num_long(ns, sym) > 0;
    favourable = (sym: string) => !is_favourable_long(portfolio, sym);
  } else {
    // All stocks having favourable forecast.  When shorting a stock, we are
    //  betting that the stock would increase in the next tick.  The
    // propitious time to sell shares of a stock in the Short position is
    // when the forecast tells us the stock would increase in the next tick.
    has_shares = (sym: string) => num_short(ns, sym) > 0;
    favourable = (sym: string) => is_favourable_long(portfolio, sym);
  }

  const stock = ns.stock.getSymbols().filter(has_shares).filter(favourable);

  // Choose the stock that yields the highest profit.
  const profit = (sym: string) => sell_profit(ns, sym, portfolio, position);
  const can_profit = (sym: any) => profit(sym) > 0;
  const descending = (syma: any, symb: any) => profit(symb) - profit(syma);
  const candidate = stock.filter(can_profit);
  candidate.sort(descending);
  return candidate.length === 0 ? "" : candidate[0];
}

/**
 * The profit we make from selling all shares of a stock.  This takes into
 * account the total cost we have paid for shares of the stock, as well as the
 * total commission we have paid and will pay for the sell transaction.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym Sell all shares of this stock.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} position The position of the given stock.
 * @returns {number} The profit from selling all shares of the stock in the
 *     given position.
 */
function sell_profit(ns: NS, sym: string, portfolio: Portfolio, position: string): number {
  return (
    sell_revenue(ns, sym, position)
    - total_fees(sym, portfolio, position)
    - total_cost(sym, portfolio, position)
  );
}

/**
 * The revenue from selling all shares of a stock in a given position.  Revenue
 * is not the same as profit.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} sym Sell all shares of this stock.
 * @param {string} position The position of the given stock.
 * @returns {number} The revenue from selling all shares of the stock in the
 *     given position.
 */
function sell_revenue(ns: NS, sym: string, position: string): number {
  assert(is_valid_position(position));
  if (position === LONG) {
    return num_long(ns, sym) * ns.stock.getBidPrice(sym);
  }
  return num_short(ns, sym) * ns.stock.getAskPrice(sym);
}

/**
 * Sell shares of a stock.  Only sell if doing so would earn us a profit.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {boolean} allow_short Whether we can short stocks.
 * @returns {Promise<Portfolio>} The updated portfolio.
 */
async function sell_stock(ns: NS, portfolio: Portfolio, allow_short: boolean): Promise<Portfolio> {
  assert(typeof allow_short === "boolean");
  let new_portfolio = await sell_stock_long(ns, portfolio);
  if (allow_short) {
    new_portfolio = await sell_stock_short(ns, new_portfolio);
  }
  return new_portfolio;
}

/**
 * Sell all shares of a stock in the Long position.  Only sell if doing so would
 * earn us a profit.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {Promise<Portfolio>} The updated portfolio.
 */
async function sell_stock_long(ns: NS, portfolio: Portfolio): Promise<Portfolio> {
  const new_portfolio = { ...portfolio };
  const sym = sell_candidate(ns, new_portfolio, LONG);
  if (sym.length === 0) {
    return portfolio;
  }

  const profit = sell_profit(ns, sym, new_portfolio, LONG);
  const nshare = num_long(ns, sym);
  const result = ns.stock.sellStock(sym, nshare);
  assert(result !== 0);
  const keep = await profit_to_keep(ns, new_portfolio, profit);
  if (typeof new_portfolio.reserve == "number") {
    new_portfolio.reserve += keep;
  }
  new_portfolio.symbols[sym].cost_long = 0;
  new_portfolio.symbols[sym].commission_long = 0;
  return new_portfolio;
}

/**
 * Sell all shares of a stock in the Short position.  Only sell if doing so
 * would earn us a profit.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {Promise<Portfolio>} The updated portfolio.
 */
async function sell_stock_short(ns: NS, portfolio: Portfolio): Promise<Portfolio> {
  const new_portfolio = { ...portfolio };
  const sym = sell_candidate(ns, new_portfolio, SHORT);
  if (sym == "") {
    return portfolio;
  }

  const profit = sell_profit(ns, sym, new_portfolio, SHORT);
  const nshare = num_short(ns, sym);
  const result = ns.stock.sellShort(sym, nshare);
  assert(result !== 0);
  const keep = await profit_to_keep(ns, new_portfolio, profit);
  new_portfolio.reserve += keep;
  new_portfolio.symbols[sym].cost_short = 0;
  new_portfolio.symbols[sym].commission_short = 0;
  return new_portfolio;
}

/**
 * The total cost of a stock in a given position.  Does not include commission.
 *
 * @param {string} sym A stock symbol.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {string} position A position of the stock.
 * @returns {number} The total cost of the stock in the given position.
 */
function total_cost(sym: string, portfolio: Portfolio, position: string): number {
  assert(is_valid_position(position));
  if (position === LONG) {
    return portfolio.symbols[sym].cost_long;
  }
  return portfolio.symbols[sym].cost_short;
}

/**
 * The total commission incurred when we want to sell all shares of a stock.
 *
 * @param {string} sym Sell all shares of this stock.
 * @param {Portfolio} portfolio Our stock portfolio.
 * @param {string} position The position of the given stock.
 * @returns {number} The total commission from selling all shares of the stock
 *     in the given position.
 */
function total_fees(sym: string, portfolio: Portfolio, position: string): number {
  assert(is_valid_position(position));
  if (position === LONG) {
    return COMMISSION + portfolio.symbols[sym].commission_long;
  }
  return COMMISSION + portfolio.symbols[sym].commission_short;
}

/**
 * Sell or buy shares of stocks.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @param {boolean} fourS Whether we have access to the 4S data and API.
 * @param {boolean} allow_short Whether we can short stocks.
 * @returns {Portfolio} The updated portfolio.
 */
export async function transaction(ns: NS, portfolio: Portfolio, fourS: boolean, allow_short: boolean): Promise<Portfolio> {
  let new_portfolio = get_forecast(ns, portfolio, fourS);
  new_portfolio = await sell_stock(ns, new_portfolio, allow_short);
  new_portfolio = buy_stock(ns, new_portfolio, LONG);
  if (allow_short) {
    new_portfolio = buy_stock(ns, new_portfolio, SHORT);
  }
  return new_portfolio;
}

/**
 * Pre-4S only.  Update the history of price changes of stocks.
 *
 * @param {NS} ns The Netscript API.
 * @param {Portfolio} portfolio Our portfolio of stocks.
 * @returns {Portfolio} The same portfolio, but with the latest change in price.
 */
export function update_history(ns: NS, portfolio: Portfolio): Portfolio {
  const new_portfolio = { ...portfolio };
  const to_binary = (ratio: number) => (ratio > 1 ? 1 : 0);
  const update_price = (sym: string) => {
    const current_price = ns.stock.getPrice(sym);
    const ratio = current_price / new_portfolio.symbols[sym].prev_price;

    // The latest is always at the front of the array.  The previous value
    // is now at index 1 of the array, etc.  The oldest value is at the end
    // of the array.
    new_portfolio.symbols[sym].history.unshift(to_binary(ratio));
    if (new_portfolio.symbols[sym].history.length > SAMPLE_LENGTH) {
      new_portfolio.symbols[sym].history.pop();
    }
    new_portfolio.symbols[sym].prev_price = current_price;
  };
  ns.stock.getSymbols().forEach(update_price);
  return new_portfolio;
}