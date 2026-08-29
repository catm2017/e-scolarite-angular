import { Direction, BidiModule } from '@angular/cdk/bidi';
import { Component, Renderer2, DOCUMENT, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DirectionService, InConfiguration } from '@core';
import { ConfigService } from '@config';

import { RouterOutlet } from '@angular/router';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { LocalStorageService } from '@shared/services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: [],
  imports: [BidiModule, RouterOutlet],
})
export class AuthLayoutComponent extends UnsubscribeOnDestroyAdapter {
    private cdr = inject(ChangeDetectorRef);
  private document = inject<Document>(DOCUMENT);
  private directoryService = inject(DirectionService);
  private configService = inject(ConfigService);
  private renderer = inject(Renderer2);
  private localStorageService = inject(LocalStorageService);

  direction!: Direction;
  public config!: InConfiguration;
  constructor() {
    super();
    const localStorageService = this.localStorageService;

    this.config = this.configService.configData;
    this.subs.sink = this.directoryService.currentData.subscribe(
      (currentData) => {
        if (currentData) {
          this.direction = currentData === 'ltr' ? 'ltr' : 'rtl';
        } else {
          if (localStorageService.get('isRtl')) {
            if (localStorageService.get('isRtl') === 'true') {
              this.direction = 'rtl';
            } else if (localStorageService.get('isRtl') === 'false') {
              this.direction = 'ltr';
            }
          } else {
            if (this.config) {
              if (this.config.layout.rtl === true) {
                this.direction = 'rtl';
                localStorageService.set('isRtl', 'true');
              } else {
                this.direction = 'ltr';
                localStorageService.set('isRtl', 'false');
              }
            }
          }
        }
            this.cdr.markForCheck();
      }
    );

    // set theme on startup
    if (localStorageService.get('theme')) {
      this.renderer.removeClass(this.document.body, this.config.layout.variant);
      this.renderer.addClass(
        this.document.body,
        localStorageService.get('theme') as string
      );
    } else {
      this.renderer.addClass(this.document.body, this.config.layout.variant);
    }
  }
}
