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

  getInfo(htmlNode: HTMLElement, triggerChar: string): CaretInfo {
    const selection = this._doc.getSelection();
    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;

    if (selection.anchorNode && htmlNode === range.commonAncestorContainer.parentNode && anchorNode.nodeValue.lastIndexOf(triggerChar) !== -1) {
      const triggerCharIndex = anchorNode.nodeValue.lastIndexOf(triggerChar);
      const caretOffset = range.endOffset;
      const markerElm = this._doc.createElement('span');

      range.setStart(anchorNode, triggerCharIndex + 1);
      range.collapse(true);
      range.insertNode(markerElm);
      const boundingClient: DOMRect = markerElm.getBoundingClientRect() as DOMRect;
      markerElm.remove();
      htmlNode.normalize();

      range.setStart(anchorNode, caretOffset);
      range.collapse(true);

      return new CaretInfo(boundingClient as DOMRect, caretOffset, anchorNode);
    }
    return null;
  }
}
