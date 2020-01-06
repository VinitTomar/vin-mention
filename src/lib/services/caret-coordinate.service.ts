import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable()
export class CaretCoordinateService {

  constructor(@Inject(DOCUMENT) private _doc: Document) { }

  getCoordinates(): DOMRect | any {
    let markerElm = this._doc.createElement('span');
    let selection = this._doc.getSelection();
    if (selection.anchorNode) {
      let range = selection.getRangeAt(0);
      range.insertNode(markerElm);
      return markerElm.getBoundingClientRect();
    }
  }
}
