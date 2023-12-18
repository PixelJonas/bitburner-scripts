export class Time {
  milliseconds: number;

  constructor(milliseconds: number) {
    this.milliseconds = milliseconds;
  }

  toSeconds(): number {
    return this.milliseconds / 1e3;
  }

  toMinutes(): number {
    return this.milliseconds / 60e3;
  }
}