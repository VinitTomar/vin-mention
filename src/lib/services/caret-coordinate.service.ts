import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CaretInfo } from '../models/caret-info.model';

@Injectable()
export class CaretCoordinateService {
  constructor(
    @Inject(DOCUMENT) @Inject(DOCUMENT) _doc: any
  ) {
    this._doc = _doc as Document;
  }
  private _doc: Document

  getInfo(htmlNode: HTMLElement): CaretInfo {
    const markerElm = this._doc.createElement('span');
    const selection = this._doc.getSelection();
    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    if (selection.anchorNode && htmlNode === range.commonAncestorContainer.parentNode) {
      const offset = range.startOffset - 1;
      range.insertNode(markerElm);
      const boundingClient: DOMRect = markerElm.getBoundingClientRect() as DOMRect;
      markerElm.remove();
      return new CaretInfo(boundingClient as DOMRect, offset, anchorNode);
    } else {
      return null;
    }
  }
}
