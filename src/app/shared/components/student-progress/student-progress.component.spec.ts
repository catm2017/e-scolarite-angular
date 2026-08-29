import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentProgressComponent } from './student-progress.component';

describe('StudentProgressComponent', () => {
  let component: StudentProgressComponent;
  let fixture: ComponentFixture<StudentProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentProgressComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display student progress data', () => {
    const compiled = fixture.nativeElement;
    const progressItems = compiled.querySelectorAll('.progress-item');
    expect(progressItems.length).toBe(component.students.length);
  });

  it('should return correct progress color based on score', () => {
    expect(component.getProgressColor(95)).toBe('primary');
    expect(component.getProgressColor(80)).toBe('accent');
    expect(component.getProgressColor(65)).toBe('warn');
    expect(component.getProgressColor(55)).toBe('warn');
  });
});