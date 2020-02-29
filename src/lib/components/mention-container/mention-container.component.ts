import { Component, OnInit, EventEmitter, ViewChild, TemplateRef, ViewContainerRef, QueryList, ContentChildren, AfterContentInit, Input, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgControl } from '@angular/forms';
import { OverlayRef, Overlay, GlobalPositionStrategy, OverlayConfig } from '@angular/cdk/overlay';
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
  private _htmlInputElmNode: HTMLElement;
  private _selectionEmitter = new EventEmitter();
  private _caretInfo: CaretInfo;
  private _mentionFilteredList: MentionListItemDirective[];
  private _focusedMentionItemIndex = -1;
  private _insertOnSpace = false;
  private _filterListItems = false;
  private _menuOpenedProgramatically = false;

  private _allRxjsSubscription: Array<Subscription> = [];

  get templatePortal() {
    if (!this._templatePortal || this._templatePortal.templateRef !== this.templateRef) {
      this._templatePortal = new TemplatePortal(this.templateRef, this._viewContainerRef);
    }
    return this._templatePortal;
  }
  private _templatePortal: TemplatePortal;

  get filterKeyword(): string {
    const anchorNodeText = this._caretInfo.anchorNode.nodeValue;
    const keywordLength = this._caretInfo.offset - (this._triggerCharOffset + 1);
    const keyword = anchorNodeText.substr(this._triggerCharOffset + 1, keywordLength);
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

  registerHtmlInputElmNode(node: HTMLElement) {
    this._htmlInputElmNode = node;
  }

  openMentionMenu() {
    this._menuOpenedProgramatically = true;
    this._htmlInputElmNode.focus();
    let textNode = this._doc.createTextNode(this._triggerChar);
    this._htmlInputElmNode.appendChild(textNode);
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
    this._ngInputControl.control.setValue(postNode.parentElement.innerHTML);
    this._closeOverlay();
    this._restoreCaretPosition();
  }

  private _restoreCaretPosition() {
    const range = this._doc.createRange();
    const sel = this._doc.getSelection();
    const elm = this._htmlInputElmNode.querySelector('[setFocusAfterMe="true"]');
    range.setStartAfter(elm);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    elm.removeAttribute('setFocusAfterMe');
    this._htmlInputElmNode.focus();
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

  private _setWatcher(val: string) {
    if (this._menuOpenedProgramatically) {
      const elm = this._htmlInputElmNode.lastChild;
      const triggerCharIndex = elm.nodeValue.indexOf(this._triggerChar) + 1;
      const range = this._doc.createRange();
      const sel = this._doc.getSelection();
      range.setStart(elm, triggerCharIndex);
      range.collapse();
      sel.removeAllRanges();
      sel.addRange(range);
      this._menuOpenedProgramatically = false;
    }

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
