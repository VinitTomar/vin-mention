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

  getInfo(element: HTMLElement | HTMLInputElement, triggerChar: string): CaretInfo {
    if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
      return this._coordinateForInputElement(element as HTMLInputElement, triggerChar);
    }

    return this._coordinateForContentEditableElement(element, triggerChar);
  }

  private _coordinateForInputElement(element: HTMLInputElement, triggerChar: string): CaretInfo {
    if (!element.value) {
      return null;
    }

    const styleKeys = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX',
      'overflowY', 'borderTopWidth', 'borderRightWidth',
      'borderBottomWidth', 'borderLeftWidth', 'paddingTop',
      'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
      'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
      'textAlign', 'textTransform', 'textIndent',
      'textDecoration', 'letterSpacing', 'wordSpacing'
    ];

    const markerElmWrapper = this._doc.createElement('div');
    this._doc.body.appendChild(markerElmWrapper);

    const computedStyle = window.getComputedStyle(element);

    styleKeys.forEach(key => {
      markerElmWrapper.style[key] = computedStyle[key];
    });

    markerElmWrapper.style.whiteSpace = 'pre-wrap';
    markerElmWrapper.style.position = 'fixed';
    markerElmWrapper.style.visibility = 'hidden';
    markerElmWrapper.style.overflow = 'auto';

    const elementBoundingClient = element.getBoundingClientRect();
    markerElmWrapper.style.top = elementBoundingClient.top + 'px';
    markerElmWrapper.style.left = elementBoundingClient.left + 'px';

    markerElmWrapper.textContent = element.value;
    if (element.nodeName === 'INPUT') {
      markerElmWrapper.textContent = markerElmWrapper.textContent.replace(/\s/g, ' ');
    }

    if (element.nodeName === 'TEXTAREA') {
      markerElmWrapper.style.wordWrap = 'break-word';
    }

    if (element.scrollWidth > element.clientWidth) {
      markerElmWrapper.scrollLeft = element.scrollLeft;
    }

    if (element.scrollHeight > element.clientHeight) {
      markerElmWrapper.scrollTop = element.scrollTop;
    }

    const range = this._doc.createRange();
    const caretOffset = element.value.indexOf(triggerChar);
    const anchorNode = markerElmWrapper.firstChild;
    const caretInfo = new CaretInfo(this._calculateCoordinates(range, anchorNode, triggerChar), caretOffset, anchorNode);
    
    const wrapperElmBoundingClient = markerElmWrapper.getBoundingClientRect();

    if (caretInfo.coordinate.x > wrapperElmBoundingClient.right) {
      caretInfo.coordinate.x = wrapperElmBoundingClient.right
    } else if (caretInfo.coordinate.x < wrapperElmBoundingClient.left) {
      caretInfo.coordinate.x = wrapperElmBoundingClient.left;
    }

    markerElmWrapper.remove();
    return caretInfo;
  }

  private _coordinateForContentEditableElement(element: HTMLElement, triggerChar: string): CaretInfo {
    let selection = this._doc.getSelection();
    let anchorNode = selection.anchorNode;
    const range = selection.getRangeAt(0);
    if (anchorNode && anchorNode.nodeValue && anchorNode.nodeValue.lastIndexOf(triggerChar) !== -1) {
      const caretOffset = range.endOffset;
      return new CaretInfo(this._calculateCoordinates(range, anchorNode, triggerChar),caretOffset,anchorNode,);
    }
    return null;
  }

  private _calculateCoordinates(range: Range, anchorNode:Node , triggerChar: string): DOMRect {
    const triggerCharIndex = anchorNode.nodeValue.lastIndexOf(triggerChar);
    const caretOffset = range.endOffset;
    const markerElm = this._doc.createElement('span');

    range.setStart(anchorNode, triggerCharIndex + 1);
    range.collapse(true);
    range.insertNode(markerElm);
    const boundingClient: DOMRect = markerElm.getBoundingClientRect() as DOMRect;
    markerElm.remove();
    if (anchorNode.nodeType === Node.TEXT_NODE) {
      anchorNode.parentElement.normalize();
    } else {
      anchorNode.normalize();
    }

    range.setStart(anchorNode, caretOffset);
    range.collapse(true);
    return boundingClient;
  }
}
