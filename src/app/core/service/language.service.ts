import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from '@shared/services';

export type PlatformLocale = 'fr' | 'wo' | 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  translate = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);
  private document = inject<Document>(DOCUMENT);

  public languages: PlatformLocale[] = ['fr', 'wo', 'en', 'ar'];
  readonly locale = signal<PlatformLocale>(
    this.normalizeLocale(this.localStorageService.get('lang') as string),
  );

  constructor() {
    const translate = this.translate;

    let browserLang: string;
    translate.addLangs(this.languages);

    if (this.localStorageService.get('lang')) {
      browserLang = this.localStorageService.get('lang') as string;
    } else {
      browserLang = translate.getBrowserLang() as string;
    }
    const locale = this.normalizeLocale(browserLang);
    this.locale.set(locale);
    this.applyDocumentLocale(locale);
    translate.use(locale);
  }

  public setLanguage(lang: string) {
    const locale = this.normalizeLocale(lang);
    this.locale.set(locale);
    this.translate.use(locale);
    this.localStorageService.set('lang', locale);
    this.applyDocumentLocale(locale);
  }

  private normalizeLocale(lang?: string): PlatformLocale {
    return lang === 'wo' || lang === 'en' || lang === 'ar' ? lang : 'fr';
  }

  private applyDocumentLocale(locale: PlatformLocale): void {
    this.document.documentElement.lang = locale;
    this.document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }
}
