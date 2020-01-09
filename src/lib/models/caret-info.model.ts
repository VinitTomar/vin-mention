export class CaretInfo {
  constructor(
    public coordinate: DOMRect,
    public offset: number,
    public anchorNode: HTMLElement | Node
  ) { }
}