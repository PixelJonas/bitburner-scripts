import { NS, Server } from "@ns";

export interface HackFile {
  fileName: string;
  command: (host: string) => void;
}

export async function getHacks(ns: NS): Promise<HackFile[]> {
  let hackingFiles: Array<HackFile> = [
    {
      fileName: "BruteSSH.exe",
      command: ns.brutessh
    }, {
      fileName: "FTPCrack.exe",
      command: ns.ftpcrack
    }, {
      fileName: "RelaySMTP.exe",
      command: ns.relaysmtp
    }, {
      fileName: "HTTPWorm.exe",
      command: ns.httpworm
    }, {
      fileName: "SQLInject.exe",
      command: ns.sqlinject
    }];
  return hackingFiles.filter(hackFile => ns.fileExists(hackFile.fileName));;
}

export async function executeHacks(ns: NS, server: Server): Promise<void> {
  let hackFiles = await getHacks(ns);
  hackFiles.forEach(hackFile => {
    if (hackFiles.length >= (server.numOpenPortsRequired as number) && (server.requiredHackingSkill as number) < ns.getHackingLevel()) {
      ns.tprint(`You don't have root access to ${server.hostname}. Trying to hack now with ${hackFile.fileName}`);
      hackFile.command(server.hostname);
    }
  });
}

export async function nuke(ns: NS, server: Server): Promise<void> {
  if ((server.openPortCount as number) >= (server.numOpenPortsRequired as number)) {
    ns.print(`INFO: Nuking ${server.hostname} (${server.openPortCount}/${server.numOpenPortsRequired} ports open)`);
    ns.nuke(server.hostname);
  }
}

