import { MemoryMap } from "lib/interfaces/Ram";
import { Entry } from "lib/interfaces/Entry";

export interface Report {
  servers: Entry[];
  money: number;
  hackSkill: number;
  portCrackers: number;
  canHackJoe?: boolean;

  ram?: MemoryMap;

}