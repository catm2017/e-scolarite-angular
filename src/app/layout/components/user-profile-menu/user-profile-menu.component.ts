
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-profile-menu',
  templateUrl: './user-profile-menu.component.html',
  styleUrls: ['./user-profile-menu.component.scss'],
  imports: [
    MatMenuModule,
    FeatherIconsComponent,
    MatButtonModule
],
})
export class UserProfileMenuComponent {
  readonly userName = input<string>('');
  readonly userImg = input<string>('');

  readonly accountClicked = output<void>();
  readonly inboxClicked = output<void>();
  readonly settingsClicked = output<void>();
  readonly logoutClicked = output<void>();

  onAccountClick() {
    this.accountClicked.emit();
  }
  onInboxClick() {
    this.inboxClicked.emit();
  }
  onSettingsClick() {
    this.settingsClicked.emit();
  }
  onLogoutClick() {
    this.logoutClicked.emit();
  }
}
