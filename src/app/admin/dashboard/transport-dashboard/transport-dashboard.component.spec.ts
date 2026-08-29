import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransportDashboardComponent } from './transport-dashboard.component';

describe('TransportDashboardComponent', () => {
  let component: TransportDashboardComponent;
  let fixture: ComponentFixture<TransportDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransportDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransportDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
