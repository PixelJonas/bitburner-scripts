import { NS } from "@ns";

export const EARLY_HACK_SCRIPT = "early-hack-script.js";
export const CONSTANTS_SCRIPT = "lib/contants.js";
export const PURCHASED_SERVER_PREFIX = "pserv-";
export const WEAKEN_SCRIPT = "lib/weaken.js";
export const GROW_SCRIPT = "lib/grow.js";
export const HACK_SCRIPT = "lib/hack.js";
export const BATCHER_SCRIPT = "hgw/batcher.js";
export const HOME_SERVER = "home";
export const SHARE_FOREVER_SCRIPT = "share-forever.js";

export const DEFAULT_PCT = 0.5;
export const DEFAULT_SHARE_PCT = 0.9;
export const MIN_HOME_RAM = (ns: NS) => (ns.getScriptRam(BATCHER_SCRIPT) * ns.getPurchasedServers().length + 64);
export const PURCHASED_SERVER_RAM_DEFAULT = 1024;
export const PURCHASED_SERVER_MAX_RAM = 16384;




export const NUMBERS = {
  BILLION: 1e9,
  MILLION: 1e6,
  QUADRILLION: 1e15,
  QUINTILLION: 1e18,
  THOUSAND: 1e3,
  TRILLION: 1e12,
}
