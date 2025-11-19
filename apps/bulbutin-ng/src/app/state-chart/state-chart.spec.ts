import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateChart } from './state-chart';

describe('StateChart', () => {
  let component: StateChart;
  let fixture: ComponentFixture<StateChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StateChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
