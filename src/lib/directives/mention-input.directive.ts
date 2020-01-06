import { Directive, Self, OnInit, Input } from '@angular/core';
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
  }
  private _mentionListContainer: MentionContainerComponent;

  constructor(
    @Self() private _ngContol: NgControl,
  ) { }

  ngOnInit() {

  }

}
