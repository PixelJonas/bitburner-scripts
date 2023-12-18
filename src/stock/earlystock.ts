/**
 * Copyright (C) 2023 Duck McSouls
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { NS } from "@ns";
import {
  can_short,
  initial_portfolio,
  transaction,
  update_history,
} from "stock/wse";

/**
 * Suppress various log messages.
 *
 * @param {NS} ns The Netscript API.
 */
function shush(ns: NS) {
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("sleep");
}

/**
 * A Stock Market script that does not have access to 4S data and API.  We have
 * an account at the World Stock Exchange and access to the Trade Information
 * eXchange (TIX) API.
 *
 * Usage: run quack/stock/pre4s.js
 *
 * @param {NS} ns The Netscript API.
 */
export async function main(ns) {
  shush(ns);
  // Continuously trade on the Stock Market.
  ns.tail();
  const allow_short = can_short(ns);
  let portfolio = await initial_portfolio(ns, false);
  ns.tprint(`Can Short: ${allow_short}`);
  for (; ;) {
    await ns.sleep(6e3);
    portfolio = update_history(ns, portfolio);
    portfolio = await transaction(ns, portfolio, false, allow_short);
  }
}