import { Component, OnInit, EventEmitter, ViewChild, TemplateRef, ViewContainerRef, QueryList, ContentChildren, AfterContentInit, Input, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgControl } from '@angular/forms';
import { OverlayRef, Overlay, GlobalPositionStrategy, OverlayConfig, RepositionScrollStrategy } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ESCAPE, UP_ARROW, DOWN_ARROW, ENTER, SPACE, AT_SIGN } from '@angular/cdk/keycodes';

import { merge, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { CaretCoordinateService } from '../../services/caret-coordinate.service';
import { MentionListItemDirective } from '../../directives/mention-list-item.directive';
import { SelectionCallback } from '../../models/selection-callback.model';
import { MentionListItemConfig } from '../../models/mention-list-item-config.model';
import { CaretInfo } from '../../models/caret-info.model';
import { MentionConfig } from '../../models/mention-config';

@Component({
  selector: 'vin-mention',
  templateUrl: './mention-container.component.html',
  styleUrls: ['./mention-container.component.scss'],
  exportAs: 'vinMention',
  providers: [CaretCoordinateService]
})
export class MentionContainerComponent implements OnInit, AfterContentInit, OnDestroy {

  private _triggerChar = '@';
  private _triggerCharOffset = -1;
  private _ngInputControl: NgControl;
  private _overlayRef: OverlayRef;
  private _htmlInputElmNode: HTMLElement | HTMLInputElement;
  private _selectionEmitter = new EventEmitter();
  private _caretInfo: CaretInfo;
  private _mentionFilteredList: MentionListItemDirective[];
  private _focusedMentionItemIndex = -1;
  private _insertOnSpace = false;
  private _filterListItems = false;
  private _menuOpenedProgramatically = false;
  private _anchorNodeOffset: number = null;
  private _elmScrollLeft: number = null;
  private _anchorNodeTextValue: string = null;

  private _allRxjsSubscription: Array<Subscription> = [];

  get templatePortal() {
    if (!this._templatePortal || this._templatePortal.templateRef !== this.templateRef) {
      this._templatePortal = new TemplatePortal(this.templateRef, this._viewContainerRef);
    }
    return this._templatePortal;
  }
  private _templatePortal: TemplatePortal;

  get filterKeyword(): string {
    if (this._htmlInputElmNode.nodeName === 'INPUT' || this._htmlInputElmNode.nodeName === 'TEXTAREA') {
      return this._filterKeywordForInputElement;
    }

    return this._filterKeywordForContentEditableElement;
  }

  private get _filterKeywordForContentEditableElement(): string {
    const anchorNodeText = this._caretInfo.anchorNode.nodeValue;
    const keywordLength = this._caretInfo.offset - (this._triggerCharOffset + 1);
    const keyword = anchorNodeText.substr(this._triggerCharOffset + 1, keywordLength);
    return keyword;
  }

  private get _filterKeywordForInputElement(): string {
    const elm = (this._htmlInputElmNode as HTMLInputElement);
    const elmValue = elm.value;
    const anchorCharIndex = elmValue.indexOf(this._triggerChar) + 1;
    const caretOffset = elm.selectionEnd;
    const keyword = elmValue.substring(anchorCharIndex, caretOffset);
    return keyword;
  }

  @Input('selectionCallback')
  private _selectionCallback: SelectionCallback;

  @Input('config')
  set mentionConfig(config: MentionConfig) {
    if (!this._checkConfigType(config)) {
      throw ('Please provide config of type "MentionConfig".');
    }
    this._triggerChar = config.triggerChar;
    if (!this._selectionCallback)
      this._selectionCallback = config.selectionCallback;
    this._insertOnSpace = config.insertOnSpace;
    this._filterListItems = config.filterListItems;
  }


  @ViewChild(TemplateRef, { static: true })
  templateRef: TemplateRef<any>;

  @ContentChildren(MentionListItemDirective, { descendants: true })
  items: QueryList<MentionListItemDirective>;

  constructor(
    private _coordSer: CaretCoordinateService,
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    @Inject(DOCUMENT) _doc: any
  ) {
    this._doc = _doc as Document;
  }
  private _doc: Document

  ngOnInit() {
  }

  ngOnDestroy() {
    this._allRxjsSubscription.forEach(sub => sub.unsubscribe());
  }

  ngAfterContentInit() {
    this.items.forEach(item => {
      this._allRxjsSubscription.push(
        item.itemSelected.asObservable().subscribe((item: MentionListItemConfig) => this._addValueAfterSelection(item))
      )
    });
  }

  selectItem(item: string) {
    this._selectionEmitter.next(item);
  }

  registerInputControl(control: NgControl) {
    if (this._ngInputControl) {
      throw Error('One mention can only be associated with a single input.');
    }
    this._ngInputControl = control;
    const subsc = this._ngInputControl.control.valueChanges.subscribe(val => {
      this._setWatcher(val)
    });
    this._allRxjsSubscription.push(subsc);
  }

  registerHtmlInputElmNode(node: HTMLElement | HTMLInputElement) {
    this._htmlInputElmNode = node;
  }

  openMentionMenu() {
    if (this._htmlInputElmNode.nodeName === 'INPUT' || this._htmlInputElmNode.nodeName === 'TEXTAREA') {
      this._openMenuForInputElement();
    } else {
      this._openMenuForContentEditableElement();
    }
  }

  private _openMenuForInputElement() {
    const elm = (this._htmlInputElmNode as HTMLInputElement);
    const value = elm.value;
    const caretOffset = elm.selectionEnd;
    const preVal = value.substring(0, caretOffset);
    const postVal = value.substring(caretOffset, value.length);
    const finalValue = preVal + this._triggerChar + postVal;
    this._menuOpenedProgramatically = true;
    this._anchorNodeOffset = caretOffset + this._triggerChar.length;
    this._elmScrollLeft = elm.scrollLeft;
    this._ngInputControl.control.setValue(finalValue);
  }

  private _openMenuForContentEditableElement() {
    this._menuOpenedProgramatically = true;
    const selection = this._doc.getSelection();

    if (selection.anchorNode === this._htmlInputElmNode) {
      const textNode = this._doc.createTextNode(this._triggerChar);

      if (selection.anchorOffset !== 0) {
        const childNode = selection.anchorNode.childNodes.item(selection.anchorOffset);
        if (childNode)
          childNode.before(textNode);
        else
          this._htmlInputElmNode.appendChild(textNode);
      }
      else {
        this._htmlInputElmNode.prepend(textNode);
      }

      this._anchorNodeTextValue = textNode.wholeText;
      this._anchorNodeOffset = textNode.nodeValue.indexOf(this._triggerChar) + 1;

    } else if (selection.anchorNode && (
      selection.anchorNode.parentElement === this._htmlInputElmNode || selection.anchorNode.parentElement.nodeType !== Node.TEXT_NODE
    )) {
      this._htmlInputElmNode.normalize();

      if (selection.anchorNode.nodeType === Node.TEXT_NODE) {
        const textNode = selection.anchorNode
        const nodeText = textNode.nodeValue;
        const offset = selection.anchorOffset;
        const preText = nodeText.slice(0, offset);
        const postText = nodeText.slice(offset, nodeText.length);
        textNode.nodeValue = preText + this._triggerChar + postText;

        this._anchorNodeOffset = offset + 1;
        this._anchorNodeTextValue = textNode.nodeValue;

      } else {
        const textNode = this._doc.createTextNode(this._triggerChar);
        const anchorNode = (selection.anchorNode as HTMLDivElement);

        if (anchorNode.innerText === '\n') {
          anchorNode.innerText = '';
        }

        selection.anchorNode.appendChild(textNode);
        this._anchorNodeOffset = 1;
        this._anchorNodeTextValue = textNode.nodeValue;
      }
    } else {
      const textNode = this._doc.createTextNode(this._triggerChar);
      this._htmlInputElmNode.appendChild(textNode);

      this._anchorNodeOffset = null;
      this._anchorNodeTextValue = null;
    }

    this._ngInputControl.control.setValue(this._htmlInputElmNode.innerHTML);
  }

  private _checkConfigType(config: MentionConfig): boolean {
    const keys = Object.keys(new MentionConfig('', true, true, null));
    return keys.reduce((prev, curr) => {
      return prev && config.hasOwnProperty(curr);
    }, true);
  }

  private _setOverlayEventListener() {
    const subsc = merge(
      this._overlayRef.backdropClick(),
      this._overlayRef.detachments(),
      this._overlayRef.keydownEvents()
        .pipe(
          filter(event => {
            return event.keyCode === ESCAPE || (event.altKey && event.keyCode === UP_ARROW);
          })
        )
    ).subscribe(event => {
      if (event) {
        event.preventDefault();
      }

      this._closeOverlay();
    });

    this._allRxjsSubscription.push(subsc);
  }

  private _openOverlay(coordinate: DOMRect) {
    if (!coordinate)
      return;

    const overlayConfig: OverlayConfig = {
      positionStrategy: this._getOverlayPosition(coordinate),
      hasBackdrop: true,
      backdropClass: 'mat-overlay-transparent-backdrop',
      scrollStrategy: this._overlay.scrollStrategies.close()
    }

    this._overlayRef = this._overlay.create(overlayConfig);
    this._overlayRef.attach(this.templatePortal);
    this._setOverlayEventListener();
  }

  private _getOverlayPosition(coordinate: DOMRect): GlobalPositionStrategy {
    if (!coordinate)
      return;

    this._closeOverlay();

    const { x, y, height } = coordinate;
    const globalPostion = new GlobalPositionStrategy();
    globalPostion.top(y + height + 'px');
    globalPostion.left(x + 'px');

    return globalPostion;
  }

  private _addValueAfterSelection(selectedMentionListItemConfig: MentionListItemConfig) {
    if (this._triggerCharOffset < 0 || !this._caretInfo) {
      return;
    }

    if (this._htmlInputElmNode.nodeName === 'INPUT' || this._htmlInputElmNode.nodeName === 'TEXTAREA') {
      this._addValueForInputElement(selectedMentionListItemConfig);
    } else {
      this._addValueForContentEditableElement(selectedMentionListItemConfig);
    }

    this._closeOverlay();
  }

  private _addValueForContentEditableElement(selectedMentionListItemConfig: MentionListItemConfig) {
    const anchorNode: Node = this._caretInfo.anchorNode;
    const anchorNodeText: string = anchorNode.nodeValue;
    const tempElm = this._doc.createElement('div');
    tempElm.innerHTML = this._selectionCallback(selectedMentionListItemConfig);
    const insertElm: HTMLElement = tempElm.firstChild as HTMLElement;
    insertElm.setAttribute('setFocusAfterMe', 'true');
    const preVal = anchorNodeText.substr(0, this._triggerCharOffset);
    const postVal = anchorNodeText.substr(this._caretInfo.offset, anchorNodeText.length);
    const preNode = this._doc.createTextNode(preVal);
    const postNode = this._doc.createTextNode(postVal);
    anchorNode.parentNode.replaceChild(preNode, anchorNode);
    preNode.parentNode.insertBefore(insertElm, preNode.nextSibling);
    insertElm.parentNode.insertBefore(postNode, insertElm.nextSibling);
    this._ngInputControl.control.setValue(this._htmlInputElmNode.innerHTML);
    this._restoreCaretPositionForContentEditableElement();
  }

  private _restoreCaretPositionForContentEditableElement() {
    const range = this._doc.createRange();
    const sel = this._doc.getSelection();
    const elm = this._htmlInputElmNode.querySelector('[setFocusAfterMe="true"]');
    const elmNextSibling = elm.nextSibling;

    if (elmNextSibling && elmNextSibling.nodeType === Node.TEXT_NODE) {
      range.setStart(elmNextSibling, 0);
      range.collapse(true);
    } else {
      range.setStartAfter(elm);
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
    elm.removeAttribute('setFocusAfterMe');
    this._htmlInputElmNode.focus();
  }

  private _addValueForInputElement(selectedMentionListItemConfig: MentionListItemConfig) {
    const elm = (this._htmlInputElmNode as HTMLInputElement);
    const elmValue = elm.value;
    const valueForInsertion = this._selectionCallback(selectedMentionListItemConfig);
    const preVal = elmValue.substr(0, this._triggerCharOffset);
    const postVal = elmValue.substr(elm.selectionEnd, elmValue.length);
    const finalValue = preVal + valueForInsertion + postVal;
    const offsetForFocus = (preVal + valueForInsertion).length;
    this._ngInputControl.control.setValue(finalValue);
    this._caretInfo.offset = offsetForFocus;
    const offset = this._caretInfo.offset
    this._restoreCaretForInputElement(offset);
  }

  private _restoreCaretForInputElement(offset: number, scrollLeft: number = null) {
    const elm = this._htmlInputElmNode as HTMLInputElement;
    elm.focus();
    elm.setSelectionRange(offset, offset);
    if (scrollLeft) {
      elm.scrollLeft = scrollLeft;
    }
    elm.focus();
  }

  private _closeOverlay() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
      this._cleanUp();
    }
  }

  private _cleanUp() {
    this._mentionFilteredList = null;
    this._focusedMentionItemIndex = -1;
  }

  private _getElmForProgrammaticTigger(): ChildNode | HTMLElement {
    let selectedElm: ChildNode;
    if (this._anchorNodeOffset !== null && this._anchorNodeTextValue !== null) {
      const childNodes = this._htmlInputElmNode.childNodes;
      const nodeArr: Array<ChildNode> = Array.prototype.slice.call(childNodes);

      selectedElm = nodeArr.find(node => {
        if (node.nodeType === 1) {
          const childNodes = node.childNodes;
          const nodeArr: Array<ChildNode> = Array.prototype.slice.call(childNodes);
          const selNode = nodeArr.find(node => {
            return node.nodeValue === this._anchorNodeTextValue;
          });

          return !!selNode;
        }
        return node.nodeValue === this._anchorNodeTextValue;
      });
    }

    if (selectedElm.nodeType === 1) {
      const childNodes = selectedElm.childNodes;
      const nodeArr: Array<ChildNode> = Array.prototype.slice.call(childNodes);
      selectedElm = nodeArr.find(node => {
        return node.nodeValue === this._anchorNodeTextValue;
      });
    }

    return selectedElm || this._htmlInputElmNode.lastChild;
  }

  private _setWatcher(val: string) {
    if (this._menuOpenedProgramatically && (this._htmlInputElmNode.nodeName === 'INPUT' || this._htmlInputElmNode.nodeName === 'TEXTAREA')) {
      this._restoreCaretForInputElement(this._anchorNodeOffset, this._elmScrollLeft);
    } else if (this._menuOpenedProgramatically) {
      const elm = this._getElmForProgrammaticTigger();
      const triggerCharIndex = elm.nodeValue.indexOf(this._triggerChar) + 1;
      const range = this._doc.createRange();
      const sel = this._doc.getSelection();
      range.setStart(elm, triggerCharIndex);
      range.collapse();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    this._menuOpenedProgramatically = false;
    this._anchorNodeOffset = null;
    this._anchorNodeTextValue = null;
    this._elmScrollLeft = null;

    this._caretInfo = this._coordSer.getInfo(this._htmlInputElmNode, this._triggerChar);
    if (!this._caretInfo) {
      this._closeOverlay();
      return;
    }

    const textContent = this._getTextContent(this._caretInfo.anchorNode.nodeValue);
    this._triggerCharOffset = textContent.lastIndexOf(this._triggerChar);

    if (this._triggerCharOffset > -1) {
      this._openOverlay(this._caretInfo.coordinate);
      this._filterMentionItems();

      if (this._mentionFilteredList.length == 0) {
        this._closeOverlay();
      }

      this._setKeyDownEventsAction();

    } else {
      this._closeOverlay();
    }
  }

  private _setKeyDownEventsAction() {
    const subsc1 = this._overlayRef.keydownEvents().pipe(
      filter(event => {
        return event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW || event.keyCode === ENTER;
      })
    ).subscribe(keyStrokeEvent => {
      keyStrokeEvent.preventDefault();
      switch (keyStrokeEvent.keyCode) {
        case UP_ARROW:
          this._focusPrevMenuItem();
          break;
        case DOWN_ARROW:
          this._focusNextMenuItem();
          break;
        case ENTER:
          this._selectFocusedItem();
          break;
      }
    });
    this._allRxjsSubscription.push(subsc1);

    const subsc2 = this._overlayRef.keydownEvents().pipe(
      filter(event => {
        return event.keyCode === SPACE
      })
    ).subscribe(keyStrokeEvent => {
      switch (keyStrokeEvent.keyCode) {
        case SPACE:
          if (this._mentionFilteredList.length == 1 && this._insertOnSpace) {
            this._mentionFilteredList[0].selectItem();
          }
          break;
      }
    });
    this._allRxjsSubscription.push(subsc2);
  }

  private _selectFocusedItem() {
    if (this._focusedMentionItemIndex == -1) {
      this._mentionFilteredList[0].selectItem();
    } else {
      this._mentionFilteredList[this._focusedMentionItemIndex].selectItem();
    }
  }

  private _focusNextMenuItem() {
    const len = this._mentionFilteredList.length;
    if (len) {
      ++this._focusedMentionItemIndex;
      if (this._focusedMentionItemIndex == this._mentionFilteredList.length) {
        this._focusedMentionItemIndex = 0;
      }
      this._updateMentionItemFocus();
    }
  }

  private _focusPrevMenuItem() {
    const len = this._mentionFilteredList.length;
    if (len) {
      --this._focusedMentionItemIndex;
      if (this._focusedMentionItemIndex < 0) {
        this._focusedMentionItemIndex = this._mentionFilteredList.length - 1;
      }
      this._updateMentionItemFocus();
    }
  }

  private _updateMentionItemFocus() {
    this._mentionFilteredList.forEach((item, i) => {
      if (i == this._focusedMentionItemIndex) {
        item.focus();
      } else {
        item.blur();
      }
    })
  }

  private _filterMentionItems() {

    if (!this._filterListItems) {
      this._mentionFilteredList = this.items.toArray();
      return;
    }

    const filteredList = this.items.map(item => {
      item.blur();
      if (item.value.keyword.indexOf(this.filterKeyword.trim()) < 0) {
        item.hideItem();
      } else {
        item.showItem();
      }
      return item;
    })
      .filter(item => {
        return !item.isHidden;
      });

    this._mentionFilteredList = filteredList;
  }

  private _getTextContent(val: string): string {
    const tempElm = this._doc.createElement('div');
    tempElm.innerHTML = val;
    return tempElm.innerText;
  }

}
