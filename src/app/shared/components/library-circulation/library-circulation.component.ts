import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface OverdueBook {
  id: number;
  bookTitle: string;
  isbn: string;
  studentName: string;
  avatar: string;
  dueDate: string;
  daysOverdue: number;
  fineAmount: number;
  notified: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-library-circulation',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './library-circulation.component.html',
  styleUrls: ['./library-circulation.component.scss']
})
export class LibraryCirculationComponent {
  overdueBooks: OverdueBook[] = [
    {
      id: 1,
      bookTitle: 'Introduction to Quantum Mechanics',
      isbn: '978-0131118928',
      studentName: 'Oliver Twist',
      avatar: 'assets/images/user/user1.jpg',
      dueDate: '2026-05-10',
      daysOverdue: 10,
      fineAmount: 5.00,
      notified: false
    },
    {
      id: 2,
      bookTitle: 'A Brief History of Time',
      isbn: '978-0553380163',
      studentName: 'Jane Eyre',
      avatar: 'assets/images/user/user2.jpg',
      dueDate: '2026-05-14',
      daysOverdue: 6,
      fineAmount: 3.00,
      notified: true
    },
    {
      id: 3,
      bookTitle: 'The Great Gatsby',
      isbn: '978-0743273565',
      studentName: 'Tom Sawyer',
      avatar: 'assets/images/user/user4.jpg',
      dueDate: '2026-05-18',
      daysOverdue: 2,
      fineAmount: 1.00,
      notified: false
    }
  ];

  displayedColumns: string[] = ['student', 'book', 'days', 'fine', 'action'];

  sendNotice(bookId: number) {
    const book = this.overdueBooks.find(b => b.id === bookId);
    if (book) {
      book.notified = true;
    }
  }
}
