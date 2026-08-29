import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { NgScrollbar } from 'ngx-scrollbar';
import { LocalStorageService } from '@shared/services';

export interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: Date;
  lastModified: Date;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-quick-notes-panel',
  templateUrl: './quick-notes-panel.component.html',
  styleUrls: ['./quick-notes-panel.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule,
    MatMenuModule,
    NgScrollbar,
  ],
})
export class QuickNotesPanelComponent implements OnInit, OnDestroy {
  private snackBar = inject(MatSnackBar);
  private localStorageService = inject(LocalStorageService);

  notes: Note[] = [];
  newNoteContent: string = '';
  editingNote: Note | null = null;
  availableColors: string[] = [
    '#fff8bb', // Yellow
    '#ffe3ba', // Orange
    '#ffdfdf', // Red
    '#e6ffc8', // Green
    '#c5edff', // Blue
    '#fbe1ff', // Purple
  ];
  selectedColor: string = this.availableColors[0];
  private storageKey = 'teacherQuickNotes';
  private autoSaveInterval: any;
  private activeColorPickerContainer: HTMLDivElement | null = null;
  private activeColorPickerListener: ((e: MouseEvent) => void) | null = null;

  ngOnInit(): void {
    this.loadNotes();
    // Auto-save notes every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveNotes();
    }, 30000);
  }

  private closeActiveColorPicker(): void {
    if (
      this.activeColorPickerContainer &&
      document.body.contains(this.activeColorPickerContainer)
    ) {
      document.body.removeChild(this.activeColorPickerContainer);
    }
    if (this.activeColorPickerListener) {
      document.removeEventListener('click', this.activeColorPickerListener);
    }
    this.activeColorPickerContainer = null;
    this.activeColorPickerListener = null;
  }

  ngOnDestroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    this.closeActiveColorPicker();
    this.saveNotes();
  }

  loadNotes(): void {
    const savedNotes = this.localStorageService.get(this.storageKey);
    if (savedNotes) {
      try {
        const parsedNotes = Array.isArray(savedNotes)
          ? savedNotes
          : JSON.parse(savedNotes as string);
        this.notes = parsedNotes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          lastModified: new Date(note.lastModified),
        }));
      } catch (error) {
        this.notes = [];
      }
    }

    // If no notes are loaded, add 3 default notes
    if (this.notes.length === 0) {
      const now = new Date();
      this.notes = [
        {
          id: this.generateId(),
          content: 'Welcome to Quick Notes! 📝',
          color: this.availableColors[0],
          createdAt: now,
          lastModified: now,
        },
        {
          id: this.generateId(),
          content: 'Click the palette icon to change note color 🎨',
          color: this.availableColors[1],
          createdAt: now,
          lastModified: now,
        },
        {
          id: this.generateId(),
          content: 'Edit or delete notes using the buttons below ✏️🗑️',
          color: this.availableColors[2],
          createdAt: now,
          lastModified: now,
        },
      ];
      this.saveNotes(); // Save defaults to localStorage
    }
  }

  saveNotes(): void {
    if (this.notes.length > 0) {
      this.localStorageService.set(this.storageKey, JSON.stringify(this.notes));
    }
  }

  addNote(): void {
    if (this.newNoteContent.trim()) {
      const now = new Date();
      const newNote: Note = {
        id: this.generateId(),
        content: this.newNoteContent,
        color: this.selectedColor,
        createdAt: now,
        lastModified: now,
      };

      this.notes.unshift(newNote);
      this.newNoteContent = '';
      this.saveNotes();
      this.showNotification('Note added');
    }
  }

  editNote(note: Note): void {
    this.editingNote = { ...note };
  }

  saveEditedNote(): void {
    if (this.editingNote && this.editingNote.content.trim()) {
      const index = this.notes.findIndex((n) => n.id === this.editingNote!.id);
      if (index !== -1) {
        this.editingNote.lastModified = new Date();
        this.notes[index] = { ...this.editingNote };
        this.saveNotes();
        this.showNotification('Note updated');
      }
      this.editingNote = null;
    }
  }

  cancelEdit(): void {
    this.editingNote = null;
  }

  deleteNote(noteId: string): void {
    const index = this.notes.findIndex((note) => note.id === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.saveNotes();
      this.showNotification('Note deleted');
    }
  }

  changeNoteColor(note: Note, color: string): void {
    const index = this.notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      this.notes[index].color = color;
      this.notes[index].lastModified = new Date();
      this.saveNotes();
    }
  }

  openColorPicker(note: Note, event: MouseEvent): void {
    this.closeActiveColorPicker();

    // Create a temporary div element to serve as a color picker
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.className = 'color-picker-popup';
    colorPickerContainer.style.position = 'absolute';
    colorPickerContainer.style.zIndex = '1000';
    colorPickerContainer.style.padding = '8px';
    colorPickerContainer.style.borderRadius = '4px';
    colorPickerContainer.style.backgroundColor = 'white';
    colorPickerContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    colorPickerContainer.style.display = 'grid';
    colorPickerContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    colorPickerContainer.style.gap = '8px';

    // Get the position of the clicked element
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    // Calculate position to ensure it's visible on screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position below the button
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;

    // Check if the picker would go off the right edge
    if (left + 120 > viewportWidth) {
      // 120px is approximate width of the picker
      left = viewportWidth - 120;
    }

    // Check if the picker would go off the bottom edge
    if (top + 120 > viewportHeight) {
      // 120px is approximate height of the picker
      top = rect.top + window.scrollY - 120; // Position above the button instead
    }

    colorPickerContainer.style.top = `${top}px`;
    colorPickerContainer.style.left = `${left}px`;

    // Add color options
    this.availableColors.forEach((color) => {
      const colorOption = document.createElement('div');
      colorOption.style.width = '30px';
      colorOption.style.height = '30px';
      colorOption.style.borderRadius = '50%';
      colorOption.style.backgroundColor = color;
      colorOption.style.cursor = 'pointer';
      colorOption.style.border = '1px solid rgba(0, 0, 0, 0.12)';
      colorOption.style.transition = 'transform 0.2s';

      // Add hover effect
      colorOption.addEventListener('mouseover', () => {
        colorOption.style.transform = 'scale(1.2)';
        colorOption.style.border = '1px solid rgba(0, 0, 0, 0.5)';
      });

      colorOption.addEventListener('mouseout', () => {
        colorOption.style.transform = 'scale(1)';
        colorOption.style.border = '1px solid rgba(0, 0, 0, 0.12)';
      });

      colorOption.addEventListener('click', () => {
        this.changeNoteColor(note, color);
        this.closeActiveColorPicker();
      });

      colorPickerContainer.appendChild(colorOption);
    });

    // Add click outside listener to close the color picker
    const closeColorPicker = (e: MouseEvent) => {
      if (!colorPickerContainer.contains(e.target as Node)) {
        this.closeActiveColorPicker();
      }
    };

    this.activeColorPickerContainer = colorPickerContainer;
    this.activeColorPickerListener = closeColorPicker;

    // Add the color picker to the DOM
    document.body.appendChild(colorPickerContainer);

    // Add event listener with a slight delay to avoid immediate closing
    setTimeout(() => {
      if (this.activeColorPickerListener === closeColorPicker) {
        document.addEventListener('click', closeColorPicker);
      }
    }, 100);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }

  getFormattedDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
