import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService, PlatformLocale } from '@core/service/language.service';

@Component({
  selector: 'app-platform-language-switcher',
  standalone: true,
  templateUrl: './platform-language-switcher.component.html',
  styleUrl: './platform-language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformLanguageSwitcherComponent {
  readonly language = inject(LanguageService);

  changeLanguage(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PlatformLocale;
    this.language.setLanguage(value);
  }
}
