import { Directive, Input, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[mentionListItem]'
})
export class MentionListItemDirective {

  @Input('mentionListItem')
  value: any;

  @Output('itemSelected')
  itemSelected: EventEmitter<any> = new EventEmitter();

  constructor() { }

  @HostListener('click')
  onItemSelection() {
    // console.log({ selectedValue: this.value });
    this.itemSelected.next(this.value);
  }

}
