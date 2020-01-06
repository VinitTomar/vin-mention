import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MentionContainerComponent } from './mention-container.component';

describe('MentionContainerComponent', () => {
  let component: MentionContainerComponent;
  let fixture: ComponentFixture<MentionContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MentionContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MentionContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
