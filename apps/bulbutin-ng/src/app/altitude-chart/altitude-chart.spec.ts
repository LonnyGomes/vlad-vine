import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltitudeChart } from './altitude-chart';

describe('AltitudeChart', () => {
  let component: AltitudeChart;
  let fixture: ComponentFixture<AltitudeChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AltitudeChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AltitudeChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
