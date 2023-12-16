
export interface Entry {
  name: string;
  path: string[];

  contracts?: string[];
  ports?: { open: number | undefined; needed: number | undefined; nuked: boolean; backdoored: boolean | undefined; };
  difficulty?: { required: number | undefined; current: number | undefined; };
}