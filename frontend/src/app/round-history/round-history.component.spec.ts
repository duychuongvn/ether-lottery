import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundHistoryComponent } from './round-history.component';

describe('RoundHistoryComponent', () => {
  let component: RoundHistoryComponent;
  let fixture: ComponentFixture<RoundHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoundHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoundHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
