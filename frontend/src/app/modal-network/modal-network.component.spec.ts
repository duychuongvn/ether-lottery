import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalNetworkComponent } from './modal-network.component';

describe('ModalNetworkComponent', () => {
  let component: ModalNetworkComponent;
  let fixture: ComponentFixture<ModalNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
