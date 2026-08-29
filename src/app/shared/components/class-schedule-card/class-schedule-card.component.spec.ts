import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassScheduleCardComponent } from './class-schedule-card.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ClassScheduleCardComponent', () => {
  let component: ClassScheduleCardComponent;
  let fixture: ComponentFixture<ClassScheduleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassScheduleCardComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ClassScheduleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default schedule data when no input is provided', () => {
    expect(component.scheduleData()).toBeTruthy();
    expect(component.scheduleData().length).toBeGreaterThan(0);
  });

  it('should display the provided title', () => {
    const testTitle = 'Test Schedule';
    fixture.componentRef.setInput('title', testTitle);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent).toContain(testTitle);
  });
});