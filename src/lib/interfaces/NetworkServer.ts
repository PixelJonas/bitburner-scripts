import { NS, Server } from "@ns";
import { assert, hasFormulas } from "lib/util";
import { HOME_SERVER, SHARE_FOREVER_SCRIPT } from "lib/contants";

/**
 * Manage a server.
 */
export class NetworkServer {
  /**
   * The hostname of this server.
   */
  #hostname: string;

  /**
   * The Netscript API.
   */
  #ns: NS;

  /**
   * The Netscript Server Object
   */
  #server: Server;

  /**
   * A weight score for this server representing the value of hacking
   */
  #hackingWeight: number;

  /**
   * Create a server object with the given hostname.
   *
   * @param {NS} ns The Netscript API.
   * @param {string} host The hostname of a server.
   */
  constructor(ns: NS, host: string) {
    this.#server = ns.getServer(host);
    this.#hostname = this.#server.hostname;
    this.#ns = ns;
    this.#hackingWeight = weight(ns, this.#server);
  }

  /**
   * How much RAM (in GB) is available on this server.
   *
   * @returns {number} The amount of RAM available on this server.
   */
  available_ram(): number {
    return this.ram_max() - this.ram_used();
  }

  /**
   * Copy a hack script over to this server.  Run the hack script on this
   * server and use the server to hack the given target.
   *
   * @param {string} script Deploy this script against the given target.
   * @param {string} target We run a hack script against this target server.
   * @returns {number} pid of the running process. 0 if it did not start.
   */
  deploy(script: string, target: string): number {
    // Sanity checks.
    assert(target.length > 0);
    assert(script.length > 0);
    const targ = this.#ns.getServer(target);
    if (
      !this.has_root_access()
      || !targ.hasAdminRights
      || !this.#ns.fileExists(script, HOME_SERVER)
    ) {
      return 0;
    }

    // No free RAM on server to run our hack script.
    const nthread = this.num_threads(script);
    if (nthread < 1) {
      return 0;
    }

    // Copy our script over to this server.  Use the server to hack the
    // target.
    this.#ns.scp(script, this.hostname(), HOME_SERVER);
    const option = { preventDuplicates: true, threads: nthread };

    return this.#ns.exec(script, this.hostname(), option, targ.hostname);;
  }

  /**
   * Whether we have root access on this server.
   *
   * @returns {boolean} True if we have root access on this server;
   *     false otherwise.
   */
  has_root_access(): boolean {
    return this.#ns.getServer(this.hostname()).hasAdminRights;
  }

  /**
   * The hostname of this server.
   *
   * @returns {string} This server's hostname.
   */
  hostname(): string {
    return this.#hostname;
  }

  /**
   * Try to gain root access on this server.
   *
   * @returns {boolean} True if we have root access on this server;
   *     false otherwise.
   */
  nuke(): boolean {
    if (this.has_root_access()) {
      return true;
    }

    // Open all required ports and nuke the server.
    try {
      this.#ns.brutessh(this.hostname());
    } catch { }
    try {
      this.#ns.ftpcrack(this.hostname());
    } catch { }
    try {
      this.#ns.httpworm(this.hostname());
    } catch { }
    try {
      this.#ns.relaysmtp(this.hostname());
    } catch { }
    try {
      this.#ns.sqlinject(this.hostname());
    } catch { }
    try {
      this.#ns.nuke(this.hostname());
      return true;
    } catch {
      assert(!this.has_root_access());
      return false;
    }
  }

  /**
   * Determine how many threads we can run a given script on this server.
   *
   * @param {string} script Run this script on the server.
   * @returns {number} The number of threads that can be used to run the given
   *     script on this server.  Return 0 if we cannot run the script using at
   *     least one thread.
   */
  num_threads(script: string): number {
    const script_ram = this.#ns.getScriptRam(script, HOME_SERVER);
    const avai_ram = this.available_ram();
    return avai_ram < script_ram ? 0 : Math.floor(avai_ram / script_ram);
  }

  /**
   * The maximum amount of RAM (GB) on this server.
   *
   * @returns {number} The largest amount of RAM on this server.
   */
  ram_max(): number {
    return this.#ns.getServer(this.hostname()).maxRam;
  }

  /**
   * How much RAM (GB) is already used on this server.
   *
   * @returns {number} Amount of used RAM.
   */
  ram_used(): number {
    return this.#ns.getServer(this.hostname()).ramUsed;
  }

  /**
   * Share the RAM of this server with a faction.
   *
   * @returns {boolean} True if we are sharing RAM of this server;
   *     false otherwise.
   */
  share(): boolean {
    if (
      !this.has_root_access()
      || !this.#ns.fileExists(SHARE_FOREVER_SCRIPT, HOME_SERVER)
    ) {
      return false;
    }

    // No free RAM on server to run our share script.
    const nthread = this.num_threads(SHARE_FOREVER_SCRIPT);
    if (nthread < 1) {
      return false;
    }

    // Copy our share script over to this server and share its RAM with a
    // faction.
    this.#ns.scp(SHARE_FOREVER_SCRIPT, this.hostname(), HOME_SERVER);
    const option = { preventDuplicates: true, threads: nthread };
    this.#ns.exec(SHARE_FOREVER_SCRIPT, this.hostname(), option);
    return true;
  }

  weight() {
    return this.#hackingWeight;
  }

  server() {
    return this.#server;
  }

  /**
   * Prints stats for this server to the script log
   *
   */
  print(): void {
    this.getReport().forEach(stat => this.#ns.print(stat));
  }

  /**
   * Get an Array of strings which can be printed to print the stats of this Server
   *
   * @returns {Array<string>} Array of strings representing the report
   */
  getReport(): Array<string> {
    let report: Array<string> = [];
    report.push('');
    report.push(`${this.#hostname} (Weight: ${this.#hackingWeight})`);
    report.push(`INFO: Money    : ${this.#ns.formatNumber(this.#server.moneyAvailable)} / ${this.#ns.formatNumber(this.#server.moneyMax)} (${(this.#server.moneyAvailable / this.#server.moneyMax * 100).toFixed(2)}%)`);
    report.push(`INFO: Security : ${(this.#server.hackDifficulty - this.#server.minDifficulty).toFixed(2)}`);
    report.push(`INFO: Weaken   : ${this.#ns.formatNumber(this.#ns.getWeakenTime(this.#hostname))}`);
    report.push(`INFO: Grow     : ${this.#ns.formatNumber(this.#ns.getGrowTime(this.#hostname))}`);
    report.push(`INFO: Hack     : ${this.#ns.formatNumber(this.#ns.getHackTime(this.#hostname))}`);
    report.push('');
    return report;
  }


}


/**
 * Whether we can run a script on a given server.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} script A script to run.  Assumed to exist on our home server.
 * @param {string} host The target host.
 * @returns {boolean} True if the given target server can run the script;
 *     false otherwise.
 */
export function can_run_script(ns: NS, script: string, host: string): boolean {
  return num_threads(ns, script, host) > 0;
}

/**
 * The amount of available RAM on a server.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} host Hostname of the server to query.
 * @returns {number} The amount of free RAM on the given server.
 */
export function free_ram(ns: NS, host: string): number {
  return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

/**
 * Whether a server is bankrupt.  A server is bankrupt if the maximum amount
 * of money it can hold is zero.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} host Test this server for bankruptcy.
 * @returns {boolean} True if the server is bankrupt; false otherwise.
 */
export function is_bankrupt(ns: NS, host: string): boolean {
  return ns.getServer(host).moneyMax === 0;
}

/**
 * The maximum number of threads that can be used to run our script on a given
 * server.
 *
 * @param {NS} ns The Netscript API.
 * @param {string} script A script.  Assumed to be located on our home server.
 * @param {string} host Hostname of a world server.
 * @returns {number} The maximum number of threads to run our script on the
 *     given server.
 */
export function num_threads(ns: NS, script: string, host: string): number {
  const script_ram = ns.getScriptRam(script, HOME_SERVER);
  const { maxRam, ramUsed } = ns.getServer(host);
  const server_ram = maxRam - ramUsed;
  if (server_ram < script_ram) {
    return 0;
  }
  return Math.floor(server_ram / script_ram);
}


function weight(ns: NS, server: Server): number {
  let player = ns.getPlayer();
  server.hackDifficulty = server.minDifficulty;

  if (server.requiredHackingSkill > player.skills.hacking) return 0;

  let weight = server.moneyMax / server.minDifficulty;

  if (hasFormulas(ns)) {
    weight = server.moneyMax / ns.formulas.hacking.weakenTime(server, player) * ns.formulas.hacking.hackChance(server, player);
  } else if (server.requiredHackingSkill > player.skills.hacking / 2 && server.hostname != "n00dles") {
    return 0;
  }
  return weight
}
