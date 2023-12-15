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
    if (server.numOpenPortsRequired && hackFiles.length >= server.numOpenPortsRequired) {
      ns.tprint(`You don't have root access to ${server.hostname}. Trying to hack now with ${hackFile.fileName}`);
      hackFile.command(server.hostname);
    }
  });
}

export async function nuke(ns: NS, server: Server): Promise<void> {
  if (server.openPortCount && server.numOpenPortsRequired && server.openPortCount >= server.numOpenPortsRequired) {
    ns.nuke(server.hostname);
  } else {
    ns.print(`${server.hostname}: ${server.openPortCount}/${server.numOpenPortsRequired} ports open`);
  }
}

