import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PrototypeDataService, WebsiteMenuItem, WebsiteSectionType } from '../prototype-data.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';

@Component({
  selector: 'app-school-site',
  imports: [RouterLink, PlatformLanguageSwitcherComponent],
  templateUrl: './school-site.component.html',
  styleUrl: './school-site.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolSiteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly draft = inject(PrototypeDataService).website;
  readonly selectedPageId = signal('home');
  readonly mobileMenuOpen = signal(false);
  readonly selectedPage = computed(() =>
    this.draft().pages.find((page) => page.id === this.selectedPageId()) ?? this.draft().pages[0],
  );
  readonly visibleMenu = computed(() => this.draft().menuItems.filter((item) => item.visible));

  ngOnInit(): void {
    const requestedPage = this.route.snapshot.queryParamMap.get('page');
    if (requestedPage && this.draft().pages.some((page) => page.id === requestedPage)) {
      this.selectedPageId.set(requestedPage);
    }
  }

  openMenuItem(item: WebsiteMenuItem, event: Event): void {
    if (item.linkType !== 'internal' || !item.pageId) return;
    event.preventDefault();
    this.selectedPageId.set(item.pageId);
    this.mobileMenuOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sectionIcon(type: WebsiteSectionType): string {
    const icons: Record<WebsiteSectionType, string> = {
      hero: 'panorama',
      stats: 'query_stats',
      programs: 'school',
      schools: 'apartment',
      about: 'verified',
      news: 'newspaper',
      testimonials: 'reviews',
      contact: 'contact_mail',
      cta: 'campaign',
      text: 'article',
    };
    return icons[type];
  }
}
