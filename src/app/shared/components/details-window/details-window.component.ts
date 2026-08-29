import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface DetailsWindowData {
  title: string;
  type: string;
  item: any;
  columns: { def: string; label: string; type?: string }[];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-details-window',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './details-window.component.html',
  styleUrls: ['./details-window.component.scss']
})
export class DetailsWindowComponent {
  public dialogRef = inject(MatDialogRef<DetailsWindowComponent>);
  public data = inject<DetailsWindowData>(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
