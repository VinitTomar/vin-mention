import { Directive, Input, HostListener, Output, EventEmitter, ElementRef } from '@angular/core';
import { MentionConfig } from '../models/mention-config.model';

@Directive({
  selector: '[mentionListItem]',
})
export class MentionListItemDirective {

  @Input('mentionListItem')
  set mentionValue(value: MentionConfig) {
    if (value && !this.checkType(value)) {
      throw ('MentionListItem value should be a type of "MentionConfig".')
    } else if (!value) {
      throw ('No value is provide for MentionListItem. Please provide a value of "MentionConfig".');
    } else {
      this._value = value;
    }
  }
  get value() {
    return this._value;
  }
  private _value: MentionConfig;

  isHidden = false;

  @Output('itemSelected')
  itemSelected: EventEmitter<any> = new EventEmitter();

  constructor(private _elmRef: ElementRef<HTMLElement>) { }

  @HostListener('click')
  onItemSelection() {
    this.itemSelected.next(this._value);
  }

  selectItem() {
    this.onItemSelection();
  }

  hideItem() {
    this._elmRef.nativeElement.style.display = 'none';
    this.isHidden = true;
  }

  showItem() {
    this._elmRef.nativeElement.style.display = null;
    this.isHidden = false;
  }

  focus() {
    this._elmRef.nativeElement.classList.add(this.value.focusedClass);
  }

  blur() {
    this._elmRef.nativeElement.classList.remove(this.value.focusedClass);
  }

  checkType(value: any): boolean {
    const keys = Object.keys(new MentionConfig('', '', ''));
    return keys.reduce((prev, curr) => {
      return prev && value.hasOwnProperty(curr);
    }, true);
  }

}
