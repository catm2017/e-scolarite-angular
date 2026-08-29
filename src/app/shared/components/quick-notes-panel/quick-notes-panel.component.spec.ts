import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QuickNotesPanelComponent } from './quick-notes-panel.component';

describe('QuickNotesPanelComponent', () => {
  let component: QuickNotesPanelComponent;
  let fixture: ComponentFixture<QuickNotesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        QuickNotesPanelComponent,
        NoopAnimationsModule,
        MatSnackBarModule
      ]
    }).compileComponents();

    // Mock localStorage
    const store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      return store[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key, value) => {
      store[key] = value.toString();
    });

    fixture = TestBed.createComponent(QuickNotesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new note', () => {
    const initialNotesCount = component.notes.length;
    component.newNoteContent = 'Test note content';
    component.addNote();
    
    expect(component.notes.length).toBe(initialNotesCount + 1);
    expect(component.notes[0].content).toBe('Test note content');
    expect(component.newNoteContent).toBe('');
  });

  it('should not add empty notes', () => {
    const initialNotesCount = component.notes.length;
    component.newNoteContent = '   ';
    component.addNote();
    
    expect(component.notes.length).toBe(initialNotesCount);
  });

  it('should edit a note', () => {
    // Add a note first
    component.newNoteContent = 'Original content';
    component.addNote();
    const noteId = component.notes[0].id;
    
    // Edit the note
    component.editNote(component.notes[0]);
    expect(component.editingNote).not.toBeNull();
    if (component.editingNote) {
      component.editingNote.content = 'Updated content';
      component.saveEditedNote();
    }
    
    // Check if the note was updated
    const updatedNote = component.notes.find(note => note.id === noteId);
    expect(updatedNote?.content).toBe('Updated content');
    expect(component.editingNote).toBeNull();
  });

  it('should delete a note', () => {
    // Add a note first
    component.newNoteContent = 'Note to delete';
    component.addNote();
    const noteId = component.notes[0].id;
    const initialNotesCount = component.notes.length;
    
    // Delete the note
    component.deleteNote(noteId);
    
    // Check if the note was deleted
    expect(component.notes.length).toBe(initialNotesCount - 1);
    const deletedNote = component.notes.find(note => note.id === noteId);
    expect(deletedNote).toBeUndefined();
  });

  it('should change note color', () => {
    // Add a note first
    component.newNoteContent = 'Colorful note';
    component.addNote();
    const note = component.notes[0];
    const initialColor = note.color;
    const newColor = component.availableColors.find(color => color !== initialColor) || '#000000';
    
    // Change the color
    component.changeNoteColor(note, newColor);
    
    // Check if the color was updated
    expect(component.notes[0].color).toBe(newColor);
  });

  it('should save notes to localStorage', fakeAsync(() => {
    spyOn(component, 'saveNotes').and.callThrough();
    
    // Add a note
    component.newNoteContent = 'Note to save';
    component.addNote();
    
    // Verify saveNotes was called
    expect(component.saveNotes).toHaveBeenCalled();
    
    // Verify auto-save works
    component.saveNotes.calls.reset();
    tick(31000); // Wait for auto-save interval
    expect(component.saveNotes).toHaveBeenCalled();
  }));

  it('should format date correctly', () => {
    const testDate = new Date(2023, 5, 15, 14, 30); // June 15, 2023, 2:30 PM
    const formattedDate = component.getFormattedDate(testDate);
    
    // Check if the date format contains month and day
    expect(formattedDate).toContain('Jun');
    expect(formattedDate).toContain('15');
  });
});