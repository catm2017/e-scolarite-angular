import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RecentActivityComponent } from './recent-activity.component';

describe('RecentActivityComponent', () => {
  let component: RecentActivityComponent;
  let fixture: ComponentFixture<RecentActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RecentActivityComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default activities when none are provided', () => {
    expect(component.displayActivities.length).toBeGreaterThan(0);
    expect(component.displayActivities.length).toBeLessThanOrEqual(component.maxActivities());
  });

  it('should display the correct title', () => {
    const title = 'Test Activities';
    fixture.componentRef.setInput('title', title);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent.trim()).toContain(title);
  });

  it('should limit the number of activities displayed', () => {
    // Set up test data with more activities than maxActivities
    const maxActivities = 3;
    fixture.componentRef.setInput('maxActivities', maxActivities);
    
    // Create test activities
    const testActivities = [
      {
        id: 1,
        type: 'assignment' as const,
        title: 'Activity 1',
        message: 'Message 1',
        timestamp: new Date(),
        statusClass: 'border-info',
        read: false
      },
      {
        id: 2,
        type: 'grade' as const,
        title: 'Activity 2',
        message: 'Message 2',
        timestamp: new Date(),
        statusClass: 'border-success',
        read: true
      },
      {
        id: 3,
        type: 'attendance' as const,
        title: 'Activity 3',
        message: 'Message 3',
        timestamp: new Date(),
        statusClass: 'border-warning',
        read: false
      },
      {
        id: 4,
        type: 'message' as const,
        title: 'Activity 4',
        message: 'Message 4',
        timestamp: new Date(),
        statusClass: 'border-primary',
        read: true
      },
      {
        id: 5,
        type: 'note' as const,
        title: 'Activity 5',
        message: 'Message 5',
        timestamp: new Date(),
        statusClass: 'border-info',
        read: false
      }
    ];
    
    // Set the activities input
    fixture.componentRef.setInput('activities', () => testActivities);
    
    // Call ngOnInit to apply the limit
    component.ngOnInit();
    
    // Check if the activities array was limited
    expect(component.displayActivities.length).toBe(maxActivities);
    expect(component.displayActivities[0].id).toBe(1);
    expect(component.displayActivities[maxActivities - 1].id).toBe(3);
  });

  it('should return correct activity icon', () => {
    expect(component.getActivityIcon('assignment')).toBe('assignment');
    expect(component.getActivityIcon('grade')).toBe('grade');
    expect(component.getActivityIcon('attendance')).toBe('how_to_reg');
    expect(component.getActivityIcon('message')).toBe('message');
    expect(component.getActivityIcon('note')).toBe('note');
    expect(component.getActivityIcon('system')).toBe('system_update');
    expect(component.getActivityIcon('unknown')).toBe('notifications');
  });

  it('should return correct activity icon class', () => {
    expect(component.getActivityIconClass('Assignment')).toBe('assignment');
    expect(component.getActivityIconClass('Grade')).toBe('grade');
    expect(component.getActivityIconClass('Attendance')).toBe('attendance');
  });

  it('should mark activity as read', () => {
    const activity = {
      id: 1,
      type: 'assignment' as const,
      title: 'Test Activity',
      message: 'Test Message',
      timestamp: new Date(),
      statusClass: 'border-info',
      read: false
    };
    
    component.markAsRead(activity);
    expect(activity.read).toBe(true);
  });

  it('should mark all activities as read', () => {
    // Set up test data with some unread activities
    component.displayActivities = [
      {
        id: 1,
        type: 'assignment' as const,
        title: 'Activity 1',
        message: 'Message 1',
        timestamp: new Date(),
        statusClass: 'border-info',
        read: false
      },
      {
        id: 2,
        type: 'grade' as const,
        title: 'Activity 2',
        message: 'Message 2',
        timestamp: new Date(),
        statusClass: 'border-success',
        read: false
      }
    ];
    
    // Mark all as read
    component.markAllAsRead();
    
    // Check if all activities are marked as read
    const unreadCount = component.displayActivities.filter(a => !a.read).length;
    expect(unreadCount).toBe(0);
  });

  it('should return correct unread count', () => {
    // Set up test data with known read/unread status
    component.displayActivities = [
      {
        id: 1,
        type: 'assignment' as const,
        title: 'Activity 1',
        message: 'Message 1',
        timestamp: new Date(),
        statusClass: 'border-info',
        read: false
      },
      {
        id: 2,
        type: 'grade' as const,
        title: 'Activity 2',
        message: 'Message 2',
        timestamp: new Date(),
        statusClass: 'border-success',
        read: true
      },
      {
        id: 3,
        type: 'attendance' as const,
        title: 'Activity 3',
        message: 'Message 3',
        timestamp: new Date(),
        statusClass: 'border-warning',
        read: false
      }
    ];
    
    // Check if the unread count is correct
    expect(component.getUnreadCount()).toBe(2);
  });

  it('should format time correctly', () => {
    const now = new Date();
    
    // Just now
    expect(component.getFormattedTime(now)).toBe('Just now');
    
    // Minutes ago
    const minutesAgo = new Date(now.getTime() - 10 * 60000);
    expect(component.getFormattedTime(minutesAgo)).toBe('10 minutes ago');
    
    // Hours ago
    const hoursAgo = new Date(now.getTime() - 3 * 3600000);
    expect(component.getFormattedTime(hoursAgo)).toBe('3 hours ago');
    
    // Days ago
    const daysAgo = new Date(now.getTime() - 2 * 86400000);
    expect(component.getFormattedTime(daysAgo)).toBe('2 days ago');
  });
});
