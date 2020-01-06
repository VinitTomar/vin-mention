import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';

import { MatCardModule, MatListModule } from '@angular/material';

import { MentionInputDirective } from './directives/mention-input.directive';
import { MentionContainerComponent } from './components/mention-container/mention-container.component';
import { MentionListItemDirective } from './directives/mention-list-item.directive';


@NgModule({
  declarations: [MentionInputDirective, MentionContainerComponent, MentionListItemDirective],
  imports: [
    OverlayModule,
    MatCardModule,
    MatListModule,
    CommonModule
  ],
  exports: [MentionInputDirective, MentionContainerComponent, MentionListItemDirective],
  entryComponents: [MentionContainerComponent]
})
export class VinMentionModule { }
