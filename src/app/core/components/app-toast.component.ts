import { ChangeDetectionStrategy, Component, Inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type AppToastKind = 'success' | 'error';

export interface AppToastData {
  message: string;
  action?: string;
  kind: AppToastKind;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="escolarite-toast" [class.is-error]="data.kind === 'error'" role="status">
      <mat-icon class="escolarite-toast-icon">{{ data.kind === 'success' ? 'check_circle' : 'error' }}</mat-icon>
      <p>{{ data.message }}</p>
      @if (data.action && data.action !== 'Fermer' && data.action !== 'Close') {
        <button type="button" class="escolarite-toast-action" (click)="runAction()">{{ data.action }}</button>
      }
      <button type="button" mat-icon-button class="escolarite-toast-close" aria-label="Fermer la notification" (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: `
    .escolarite-toast-panel.mat-mdc-snack-bar-container { width: min(440px, calc(100vw - 32px)); max-width: min(440px, calc(100vw - 32px)); margin: 20px 18px; padding: 0; background: transparent; box-shadow: none; }
    .escolarite-toast-panel .mdc-snackbar__surface { min-width: 0; padding: 0; background: transparent; box-shadow: none; }
    .escolarite-toast-panel .mat-mdc-snack-bar-label { padding: 0; }
    .escolarite-toast { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 12px 10px 12px 15px; border: 1px solid #dbe6f0; border-radius: 12px; background: #fff; color: #172033; box-shadow: 0 12px 30px rgba(35, 66, 93, .16); }
    .escolarite-toast-icon { width: 23px; height: 23px; font-size: 23px; color: #20a464; flex: 0 0 auto; }
    .escolarite-toast.is-error .escolarite-toast-icon { color: #df4d57; }
    .escolarite-toast p { flex: 1; margin: 0; color: #172033; font-size: 14px; font-weight: 600; line-height: 1.4; }
    .escolarite-toast-action { border: 0; background: transparent; color: #1873c9; font: inherit; font-size: 13px; font-weight: 700; white-space: nowrap; cursor: pointer; }
    .escolarite-toast-close { width: 32px !important; height: 32px !important; padding: 4px !important; color: #7c8ba1 !important; flex: 0 0 auto; }
    .escolarite-toast-close .mat-icon { width: 19px; height: 19px; font-size: 19px; }
    @media (max-width: 575px) { .escolarite-toast-panel.mat-mdc-snack-bar-container { margin: 14px 8px; } .escolarite-toast { gap: 9px; padding-left: 12px; } .escolarite-toast p { font-size: 13px; } }
  `,
})
export class AppToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) readonly data: AppToastData,
    private readonly reference: MatSnackBarRef<AppToastComponent>,
  ) {}

  close(): void {
    this.reference.dismiss();
  }

  runAction(): void {
    this.reference.dismissWithAction();
  }
}
