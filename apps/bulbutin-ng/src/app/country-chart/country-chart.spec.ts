import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountryChart } from './country-chart';

describe('CountryChart', () => {
  let component: CountryChart;
  let fixture: ComponentFixture<CountryChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountryChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountryChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
