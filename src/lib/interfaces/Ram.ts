import { NS, Server } from "@ns";
import { getAllServers } from "lib/scan";
import { MIN_HOME_RAM } from "lib/contants";

export class MemoryMap {
  blocks: any[];
  used: number;
  available: number;
  total: number;
  purchased: number;
  home: number;
  other: number;
  reserved: number;

  constructor(ns: NS, simulateFull = false, servers: Server[]) {

    this.blocks = new Array();
    this.used = 0;
    this.available = 0;
    this.total = 0;
    this.purchased = 0;
    this.home = 0;
    this.other = 0;
    this.reserved = 0;

    for (var server of servers) {

      if (server.hostname.startsWith('hacknet')) continue;

      let free = server.maxRam - (simulateFull ? 0 : server.ramUsed);
      if (free < 1.6) free = 0;

      this.used += simulateFull ? 0 : server.ramUsed;
      this.available += free;
      this.total += server.maxRam;

      if (server.hostname == 'home')
        this.home = server.maxRam;
      else if (server.purchasedByPlayer)
        this.purchased += server.maxRam;
      else
        this.other += server.maxRam;

      if (free >= 0 && server.maxRam > 0) {
        let block: any = {};
        block.server = server;
        block.free = free;
        block.coreBonus = 1 + (server.cpuCores - 1) / 16;

        if (server.hostname == 'home') {
          let minFree = MIN_HOME_RAM(ns);
          if (free < minFree) {
            minFree = free;
          }
          block.reserved = minFree;
          this.reserved += minFree;
        }
        else {
          block.reserved = 0;
        }
        block.purchased = server.purchasedByPlayer;
        block.isHome = server.hostname == 'home';
        block.total = server.maxRam;
        this.blocks.push(block);
      }
    }
    this.blocks.sort(BlockSort(this.total, this.other));

    function BlockSort(total: number, other:number) {
      return function (a: any, b: any) {
        // home is always last unless we have to use other servers
        if (a.isHome) return 1;
        if (b.isHome) return -1;

        // Priorize by block size, smallers first
        if (a.free - a.reserved > b.free - b.reserved) return 1;
        if (a.free - a.reserved < b.free - b.reserved) return -1;

        // Priorize purchased servers
        if (a.purchased && !b.purchased) return [total] > [other] ? -1 : 1;
        if (!a.purchased && b.purchased) return [total] > [other] ? 1 : -1;

        return 0;
      }
    }
  }

  get blockList() { return this.blocks; }

  getReserveBlock(minSize: number) {
    var match = this.blocks.find(b => (b.free - b.reserved) >= minSize);
    if (match == undefined) return undefined;
    match.reserved += minSize;
    return match.server;
  }

  getSmallestBlock(minSize = 0) {
    let smallest = this.getBiggestBlock();
    for (const block of this.blocks) {
      const available = block.free - block.reserved;
      if (available < smallest && available >= minSize)
        smallest = available;
    }
    return smallest;
  }

  getBiggestBlock() {
    let biggest = 0;

    for (const block of this.blocks) {
      const available = block.free - block.reserved;
      if (available > biggest)
        biggest = available;
    }
    return biggest;
  }

  getHomeBlock() {
    return this.blocks.find(b => b.isHome);
  }
}