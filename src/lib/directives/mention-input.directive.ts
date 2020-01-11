import { Directive, Self, OnInit, Input, ElementRef, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { MentionContainerComponent } from '../components/mention-container/mention-container.component';

@Directive({
  selector: '[mentionInput]'
})
export class MentionInputDirective implements OnInit {

  @Input('mentionInput')
  set mentionListContainer(listContainer: MentionContainerComponent) {
    this._mentionListContainer = listContainer;
    this._mentionListContainer.registerInputControl(this._ngContol);
    this._mentionListContainer.registerHtmlInputElmNode(this._elmRef.nativeElement)
  }
  private _mentionListContainer: MentionContainerComponent;

  constructor(
    @Optional() @Self() private _ngContol: NgControl,
    private _elmRef: ElementRef<HTMLElement>
  ) {
    if (!this._ngContol) {
      throw ('No control value accessor provided. Please have a look at "https://www.npmjs.com/package/vin-content-editable"');
    }
  }

  ngOnInit() {
    if (!this._mentionListContainer) {
      throw 'No vin-mention is provided as input to mentionInput';
    }
  }

}
