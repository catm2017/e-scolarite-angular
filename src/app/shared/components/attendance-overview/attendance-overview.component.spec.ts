import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AttendanceOverviewComponent } from './attendance-overview.component';
import { NgApexchartsModule } from 'ng-apexcharts';

describe('AttendanceOverviewComponent', () => {
  let component: AttendanceOverviewComponent;
  let fixture: ComponentFixture<AttendanceOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AttendanceOverviewComponent,
        NgApexchartsModule,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default attendance data when none is provided', () => {
    expect(component.attendanceData().length).toBeGreaterThan(0);
    expect(component.classes.length).toBeGreaterThan(0);
    expect(component.selectedClass).toBeTruthy();
  });

  it('should display the correct title', () => {
    const title = 'Test Attendance';
    fixture.componentRef.setInput('title', title);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent).toContain(title);
  });

  it('should update chart data when class selection changes', () => {
    const updateChartDataSpy = spyOn(component, 'updateChartData');
    component.onClassChange();
    expect(updateChartDataSpy).toHaveBeenCalled();
  });

  it('should calculate total students correctly', () => {
    // Set up test data
    component.attendanceData = [
      {
        className: 'Test Class',
        present: 80,
        absent: 15,
        late: 5
      }
    ];
    component.selectedClass = 'Test Class';
    
    // Calculate expected total
    const expectedTotal = 80 + 15 + 5;
    
    // Check if the method returns the correct total
    expect(component.getTotalStudents()).toBe(expectedTotal);
  });
});