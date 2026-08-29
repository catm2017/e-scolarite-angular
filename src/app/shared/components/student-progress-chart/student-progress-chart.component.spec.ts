import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentProgressChartComponent } from './student-progress-chart.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('StudentProgressChartComponent', () => {
  let component: StudentProgressChartComponent;
  let fixture: ComponentFixture<StudentProgressChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentProgressChartComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentProgressChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize chart with default data when no input is provided', () => {
    expect(component.chartOptions).toBeTruthy();
    expect(component.chartOptions.series).toBeTruthy();
  });

  it('should display the provided title', () => {
    const testTitle = 'Test Progress Chart';
    fixture.componentRef.setInput('title', testTitle);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent).toContain(testTitle);
  });
});