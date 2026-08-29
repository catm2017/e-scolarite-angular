import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ClassScheduleComponent } from './class-schedule.component';

describe('ClassScheduleComponent', () => {
  let component: ClassScheduleComponent;
  let fixture: ComponentFixture<ClassScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassScheduleComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display class schedule data', () => {
    const compiled = fixture.nativeElement;
    const scheduleItems = compiled.querySelectorAll('.schedule-item');
    expect(scheduleItems.length).toBe(component.todayClasses.length);
  });

  it('should return correct status class based on status', () => {
    expect(component.getStatusClass('completed')).toBe('completed-class');
    expect(component.getStatusClass('ongoing')).toBe('ongoing-class');
    expect(component.getStatusClass('upcoming')).toBe('upcoming-class');
    expect(component.getStatusClass('')).toBe('');
  });
});