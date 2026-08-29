import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TopStudentsCardComponent } from './top-students-card.component';

describe('TopStudentsCardComponent', () => {
  let component: TopStudentsCardComponent;
  let fixture: ComponentFixture<TopStudentsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TopStudentsCardComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopStudentsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default students data when none is provided', () => {
    expect(component.students().length).toBeGreaterThan(0);
    expect(component.students().length).toBeLessThanOrEqual(component.maxStudents());
  });

  it('should display the correct title', () => {
    const title = 'Test Students';
    fixture.componentRef.setInput('title', title);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent).toContain(title);
  });

  it('should limit the number of students displayed', () => {
    // Set up test data with more students than maxStudents
    const maxStudents = 3;
    fixture.componentRef.setInput('maxStudents', maxStudents);
    component.students = [
      {
        id: 1,
        name: 'Student 1',
        score: 95,
        rank: 1,
        subject: 'Math'
      },
      {
        id: 2,
        name: 'Student 2',
        score: 90,
        rank: 2,
        subject: 'Science'
      },
      {
        id: 3,
        name: 'Student 3',
        score: 85,
        rank: 3,
        subject: 'English'
      },
      {
        id: 4,
        name: 'Student 4',
        score: 80,
        rank: 4,
        subject: 'History'
      },
      {
        id: 5,
        name: 'Student 5',
        score: 75,
        rank: 5,
        subject: 'Art'
      }
    ];
    
    // Call ngOnInit to apply the limit
    component.ngOnInit();
    
    // Check if the students array was limited
    expect(component.students().length).toBe(maxStudents);
    expect(component.students()[0].name).toBe('Student 1');
    expect(component.students()[maxStudents - 1].name).toBe('Student 3');
  });

  it('should return correct badge tooltip', () => {
    expect(component.getBadgeTooltip('star')).toBe('Outstanding Performance');
    expect(component.getBadgeTooltip('trending_up')).toBe('Significant Improvement');
    expect(component.getBadgeTooltip('unknown_badge')).toBe('Achievement Badge');
  });

  it('should return correct badge color', () => {
    expect(component.getBadgeColor('star')).toBe('gold');
    expect(component.getBadgeColor('trending_up')).toBe('green');
    expect(component.getBadgeColor('unknown_badge')).toBe('primary');
  });

  it('should return correct improvement icon', () => {
    expect(component.getImprovementIcon(6)).toBe('trending_up');
    expect(component.getImprovementIcon(3)).toBe('arrow_upward');
    expect(component.getImprovementIcon(0)).toBe('remove');
    expect(component.getImprovementIcon(-2)).toBe('arrow_downward');
    expect(component.getImprovementIcon(undefined)).toBe('');
  });

  it('should return correct improvement color', () => {
    expect(component.getImprovementColor(5)).toBe('positive');
    expect(component.getImprovementColor(-3)).toBe('negative');
    expect(component.getImprovementColor(0)).toBe('');
    expect(component.getImprovementColor(undefined)).toBe('');
  });
});