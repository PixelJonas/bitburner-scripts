import { NS } from "@ns";
import { can_short, initial_portfolio, transaction } from "/stock/wse";
import { WSE_TICK } from "/stock/constants";

export async function main(ns: NS) {


  // Continuously trade on the Stock Market.
  const allow_short = can_short(ns);
  ns.tprint(`---- Starting to trade on the Stock Market ----`);
  let portfolio = await initial_portfolio(ns, true);
  for (; ;) {
    portfolio = await transaction(
      ns,
      portfolio,
      true,
      allow_short
    );
    await ns.sleep(WSE_TICK);
  }
}