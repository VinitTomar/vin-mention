import { Directive, Self, OnInit, Input, ElementRef } from '@angular/core';
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
    @Self() private _ngContol: NgControl,
    private _elmRef: ElementRef<HTMLElement>
  ) { }

  ngOnInit() {

  }

}
