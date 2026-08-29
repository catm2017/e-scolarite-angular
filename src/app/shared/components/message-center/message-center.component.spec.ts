import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageCenterComponent } from './message-center.component';

describe('MessageCenterComponent', () => {
  let component: MessageCenterComponent;
  let fixture: ComponentFixture<MessageCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MessageCenterComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use default messages when none are provided', () => {
    expect(component.messages().length).toBeGreaterThan(0);
    expect(component.messages().length).toBeLessThanOrEqual(component.maxMessages());
  });

  it('should display the correct title', () => {
    const title = 'Test Messages';
    fixture.componentRef.setInput('title', title);
    fixture.detectChanges();
    const titleElement = fixture.nativeElement.querySelector('mat-card-title');
    expect(titleElement.textContent.trim()).toContain(title);
  });

  it('should limit the number of messages displayed', () => {
    // Set up test data with more messages than maxMessages
    const maxMessages = 3;
    fixture.componentRef.setInput('maxMessages', maxMessages);
    component.messages = [
      {
        id: 1,
        title: 'Message 1',
        content: 'Content 1',
        sender: 'Sender 1',
        date: new Date(),
        read: false,
        type: 'message'
      },
      {
        id: 2,
        title: 'Message 2',
        content: 'Content 2',
        sender: 'Sender 2',
        date: new Date(),
        read: true,
        type: 'announcement'
      },
      {
        id: 3,
        title: 'Message 3',
        content: 'Content 3',
        sender: 'Sender 3',
        date: new Date(),
        read: false,
        type: 'alert'
      },
      {
        id: 4,
        title: 'Message 4',
        content: 'Content 4',
        sender: 'Sender 4',
        date: new Date(),
        read: true,
        type: 'message'
      },
      {
        id: 5,
        title: 'Message 5',
        content: 'Content 5',
        sender: 'Sender 5',
        date: new Date(),
        read: false,
        type: 'announcement'
      }
    ];
    
    // Call ngOnInit to apply the limit
    component.ngOnInit();
    
    // Check if the messages array was limited
    expect(component.messages().length).toBe(maxMessages);
    expect(component.messages()[0].title).toBe('Message 1');
    expect(component.messages()[maxMessages - 1].title).toBe('Message 3');
  });

  it('should toggle message expansion', () => {
    const messageId = component.messages()[0].id;
    
    // Initially no message should be expanded
    expect(component.expandedMessageId).toBeNull();
    
    // Expand a message
    component.toggleMessageExpansion(messageId);
    expect(component.expandedMessageId).toBe(messageId);
    
    // Collapse the message
    component.toggleMessageExpansion(messageId);
    expect(component.expandedMessageId).toBeNull();
  });

  it('should mark message as read when expanded', () => {
    // Find an unread message
    const unreadMessage = component.messages().find(m => !m.read);
    if (unreadMessage) {
      // Expand the message
      component.toggleMessageExpansion(unreadMessage.id);
      
      // Check if the message was marked as read
      expect(unreadMessage.read).toBe(true);
    }
  });

  it('should mark all messages as read', () => {
    // Ensure there are some unread messages
    messages[0].read = false;
    messages[1].read = false;
    
    // Mark all as read
    component.markAllAsRead();
    
    // Check if all messages are marked as read
    const unreadCount = messages.filter(m => !m.read).length;
    expect(unreadCount).toBe(0);
  });

  it('should return correct unread count', () => {
    // Set up test data with known read/unread status
    component.messages = [
      { id: 1, title: 'Message 1', content: 'Content 1', sender: 'Sender 1', date: new Date(), read: false, type: 'message' },
      { id: 2, title: 'Message 2', content: 'Content 2', sender: 'Sender 2', date: new Date(), read: true, type: 'message' },
      { id: 3, title: 'Message 3', content: 'Content 3', sender: 'Sender 3', date: new Date(), read: false, type: 'message' }
    ];
    
    // Check if the unread count is correct
    expect(component.getUnreadCount()).toBe(2);
  });

  it('should return correct message type icon', () => {
    expect(component.getMessageTypeIcon('announcement')).toBe('campaign');
    expect(component.getMessageTypeIcon('alert')).toBe('warning');
    expect(component.getMessageTypeIcon('message')).toBe('mail');
    expect(component.getMessageTypeIcon('unknown')).toBe('message');
  });

  it('should return correct message type class', () => {
    expect(component.getMessageTypeClass('Announcement')).toBe('announcement');
    expect(component.getMessageTypeClass('Alert')).toBe('alert');
    expect(component.getMessageTypeClass('Message')).toBe('message');
  });

  it('should return correct priority class', () => {
    expect(component.getPriorityClass('high')).toBe('high');
    expect(component.getPriorityClass('medium')).toBe('medium');
    expect(component.getPriorityClass('low')).toBe('low');
    expect(component.getPriorityClass(undefined)).toBe('medium');
  });

  it('should format date correctly', () => {
    const today = new Date();
    expect(component.getFormattedDate(today)).toBe('Today');
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(component.getFormattedDate(yesterday)).toBe('Yesterday');
    
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(component.getFormattedDate(threeDaysAgo)).toBe('3 days ago');
    
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    // This will vary based on the actual date, so we just check it doesn't match the other patterns
    const formattedDate = component.getFormattedDate(twoWeeksAgo);
    expect(formattedDate).not.toBe('Today');
    expect(formattedDate).not.toBe('Yesterday');
    expect(formattedDate).not.toContain('days ago');
  });
});