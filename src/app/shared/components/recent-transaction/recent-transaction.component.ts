import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-recent-transaction',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './recent-transaction.component.html',
  styleUrl: './recent-transaction.component.scss',
})
export class RecentTransactionComponent {
  // Recent transactions
  recentTransactions = [
    {
      id: 'TRX-001',
      student: 'John Smith',
      amount: 1200,
      date: '2023-05-10',
      status: 'completed',
    },
    {
      id: 'TRX-002',
      student: 'Emily Johnson',
      amount: 950,
      date: '2023-05-08',
      status: 'completed',
    },
    {
      id: 'TRX-003',
      student: 'Michael Brown',
      amount: 1500,
      date: '2023-05-05',
      status: 'completed',
    },
    {
      id: 'TRX-004',
      student: 'Sarah Wilson',
      amount: 800,
      date: '2023-05-03',
      status: 'completed',
    },
  ];

  // Format currency
  formatCurrency(amount: number): string {
    return '$' + amount.toFixed(2);
  }

  // Format date
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
