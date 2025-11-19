import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelChart } from './model-chart';

describe('ModelChart', () => {
  let component: ModelChart;
  let fixture: ComponentFixture<ModelChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModelChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
