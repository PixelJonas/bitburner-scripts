import { NS } from "@ns";
import { HOME_SERVER } from "./lib/contants";

function custom_hud_values(ns: NS) {
  const header = [];
  const value = [];
  // The Hack XP of all scripts per second.
  header.push("Hack XP");
  value.push(`${ns.formatNumber(ns.getTotalScriptExpGain())}/s`);

  // The income of all scripts per second.
  header.push("Money");
  value.push(`${ns.formatNumber(ns.getTotalScriptIncome()[0])}/s`);

  // The share power.  This is the percentage increase in reputation
  // gain while sharing RAM with a faction.  The share power is given
  // as a decimal number.  For example, a share power of 1.286 means
  // we have a 28.6% increase in reputation gain.
  const share_power = ns.getSharePower() - 1;
  const ndigit = 3;
  header.push("Share Power");
  value.push(ns.formatPercent(share_power, ndigit));

  header.push("HOME RAM");
  value.push(`${ns.formatNumber(ns.getServerMaxRam(HOME_SERVER) - ns.getServerUsedRam(HOME_SERVER))}GB free`)

  header.push("PSERV RAM");
  const maxRAMs = ns.getPurchasedServers().map(server => ns.getServerMaxRam(server));
  const maxPservRAM = Math.max(...maxRAMs);
  const maxPservRAMCount = maxRAMs.filter(ram => ram === maxPservRAM);
  value.push(`${ns.formatRam(maxPservRAM)} (${maxPservRAMCount.length}/${maxRAMs.length})`);
  header.push("Next");
  let serverUpgradeCosts = ns.getPurchasedServers().map(server => {
    return {
      hostname: server,
      cost: ns.getPurchasedServerUpgradeCost(server, 2 * ns.getServerMaxRam(server))
    }
  });
  const minUpgradeCost = Math.min(...serverUpgradeCosts.map(server => server.cost));
  const upgradeServer: { hostname: string, cost: number } = serverUpgradeCosts.find(server => server.cost === minUpgradeCost);
  value.push(`${ns.formatNumber(upgradeServer.cost)}(${upgradeServer.hostname})`);


  return [header, value];
}

/**
 * Decorate a custom line with our favourite colour.
 *
 * @param {string} str Add colour to this string.
 * @param {string} colour Colourize the given string with this colour.  The
 *     colour string should be given as a Unicode escape sequence.  Refer to
 *     this page for more details:
 *     https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
 * @return {string} The given line coloured using the given colour.
 */
function decorate(str, colour) {
  const reset = "\u001b[0m";
  return `${colour}${str}${reset}`;
}

/**
 * Suppress various log messages.
 *
 * @param {NS} ns The Netscript API.
 */
function shush(ns: NS): void {
  ns.disableLog("sleep");
}

/**
 * Add custom fields to the HUD.
 *
 * Usage: run quack/hud.js
 *
 * @param {NS} ns The Netscript API.
 */
export async function main(ns: NS): Promise<void> {
  shush(ns);

  // Custom colouring for the new fields.
  // eslint-disable-next-line no-eval
  const doc = eval("document");
  const hook0 = doc.getElementById("overview-extra-hook-0");
  const hook1 = doc.getElementById("overview-extra-hook-1");
  const fav_colour = "#FFA500"; // orange
  hook0.style.color = fav_colour;
  hook1.style.color = fav_colour;

  // Make sure to clean up after ourselves.
  ns.atExit(() => {
    hook0.innerHTML = "";
    hook1.innerHTML = "";
  });

  // Constantly update the HUD.
  for (; ;) {
    try {
      const [header, value] = custom_hud_values(ns);
      hook0.innerText = header.join("\n");
      hook1.innerText = value.join("\n");
    } catch (e) {
      const red = "\u001b[31m";
      ns.print(decorate(`No update: ${String(e)}`, red));
    }

    await ns.sleep(1e3);
  }
}