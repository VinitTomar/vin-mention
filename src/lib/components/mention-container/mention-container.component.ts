import { Component, OnInit, EventEmitter, ViewChild, TemplateRef, ViewContainerRef, QueryList, ContentChildren, AfterContentInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { OverlayRef, Overlay, GlobalPositionStrategy, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

import { merge, from, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ESCAPE, UP_ARROW } from '@angular/cdk/keycodes';

import { CaretCoordinateService } from '../../services/caret-coordinate.service';
import { MentionListItemDirective } from '../../directives/mention-list-item.directive';

@Component({
  selector: 'vin-mention',
  templateUrl: './mention-container.component.html',
  styleUrls: ['./mention-container.component.scss'],
  exportAs: 'vinMention',
  providers: [CaretCoordinateService]
})
export class MentionContainerComponent implements OnInit, AfterContentInit {

  private _triggerChar = '@';
  private _ngInputControl: NgControl;
  private _overlayRef: OverlayRef;
  private _selectionEmitter = new EventEmitter();

  get templatePortal() {
    if (!this._templatePortal || this._templatePortal.templateRef !== this.templateRef) {
      this._templatePortal = new TemplatePortal(this.templateRef, this._viewContainerRef);
    }
    return this._templatePortal;
  }
  private _templatePortal: TemplatePortal;

  @ViewChild(TemplateRef, { static: true })
  templateRef: TemplateRef<any>;

  @ContentChildren(MentionListItemDirective, { descendants: true })
  items: QueryList<MentionListItemDirective>;

  constructor(
    private _coordSer: CaretCoordinateService,
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef
  ) { }

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.items.forEach(item => {
      item.itemSelected.asObservable()
        .subscribe(item => {
          console.log(item);
          this._addValueAfterSelection(item.value);
        })
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
    this._ngInputControl.control.valueChanges.subscribe(val => this._setWatcher(val));
  }

  private _setOverlayEventListener() {
    merge(
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
  }

  private _openOverlay() {
    const coord = this._coordSer.getCoordinates();
    let { x, y, height } = coord;
    const globalPostion = new GlobalPositionStrategy();
    globalPostion.top(y + height + 'px');
    globalPostion.left(x + 'px');

    const overlayConfig: OverlayConfig = {
      positionStrategy: globalPostion,
      hasBackdrop: true,
      backdropClass: 'mat-overlay-transparent-backdrop',
    }

    this._overlayRef = this._overlay.create(overlayConfig);
    // const componentPortal = new ComponentPortal(MentionContainerComponent);
    // const containerInstanceRef = this._overlayRef.attach(componentPortal);
    // containerInstanceRef.instance.selectionEmitter.subscribe(value => this._addValueAfterSelection(value));
    this._overlayRef.attach(this.templatePortal);
    this._setOverlayEventListener();
  }

  private _addValueAfterSelection(value) {
    console.log(value);
    const currentInputValue: string = this._ngInputControl.control.value;
    const insertValue = `<span contenteditable="false" style="background:green; color: white;">${value}</span>`;
    const insertionStartIndex = currentInputValue.lastIndexOf(this._triggerChar);
    const newVal = currentInputValue.substr(0, insertionStartIndex)
      + insertValue +
      currentInputValue.substr(insertionStartIndex + 1, currentInputValue.length - 1 - insertionStartIndex);
    this._ngInputControl.control.setValue(newVal);
    this._closeOverlay();
  }

  private _closeOverlay() {
    if (this._overlayRef && this._overlayRef.hasAttached()) {
      this._overlayRef.detach();
    }
  }

  private _setWatcher(val: string) {
    if (val.charAt(val.length - 1) === this._triggerChar) {
      this._openOverlay();
    } else {
      this._closeOverlay();
    }
  }

}
