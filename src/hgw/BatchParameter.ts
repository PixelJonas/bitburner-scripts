export interface BatchParameter {
  hack: BatchOperation,
  grow: BatchOperation,
  weaken: BatchOperation

}

export interface BatchOperation {
  ram: number;
  thread: number;
  time: number
}