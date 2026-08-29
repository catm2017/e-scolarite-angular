import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PrototypeDataService,
  WebsiteDraft,
  WebsiteMenuItem,
  WebsitePage,
  WebsiteSection,
  WebsiteSectionType,
} from '../prototype-data.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';

type EditorTab = 'content' | 'pages' | 'navigation' | 'design';

@Component({
  selector: 'app-site-editor',
  imports: [RouterLink, FormsModule, DragDropModule, PlatformLanguageSwitcherComponent],
  templateUrl: './site-editor.component.html',
  styleUrl: './site-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteEditorComponent {
  readonly data = inject(PrototypeDataService);
  readonly draft = this.data.website;
  readonly activeTab = signal<EditorTab>('content');
  readonly selectedPageId = signal('home');
  readonly previewDevice = signal<'desktop' | 'tablet' | 'mobile'>('desktop');

  newPageTitle = '';
  newPageDescription = '';
  newMenuLabel = '';
  newMenuType: 'internal' | 'external' = 'internal';
  newMenuPageId = 'home';
  newMenuUrl = 'https://';
  newMenuOpenInNewTab = true;
  newSectionType: WebsiteSectionType = 'text';

  readonly selectedPage = computed(() =>
    this.draft().pages.find((page) => page.id === this.selectedPageId()) ?? this.draft().pages[0],
  );

  readonly visibleMenu = computed(() => this.draft().menuItems.filter((item) => item.visible));

  readonly sectionOptions: Array<{ value: WebsiteSectionType; label: string; icon: string }> = [
    { value: 'hero', label: 'Bannière principale', icon: 'panorama' },
    { value: 'text', label: 'Texte libre', icon: 'article' },
    { value: 'stats', label: 'Chiffres clés', icon: 'query_stats' },
    { value: 'programs', label: 'Parcours scolaires', icon: 'school' },
    { value: 'schools', label: 'Établissements', icon: 'apartment' },
    { value: 'about', label: 'Valeurs et atouts', icon: 'verified' },
    { value: 'news', label: 'Actualités', icon: 'newspaper' },
    { value: 'testimonials', label: 'Témoignages', icon: 'reviews' },
    { value: 'contact', label: 'Coordonnées', icon: 'contact_mail' },
    { value: 'cta', label: 'Appel à l’action', icon: 'campaign' },
  ];

  update<K extends keyof WebsiteDraft>(key: K, value: WebsiteDraft[K]): void {
    this.data.updateWebsite({ [key]: value } as Pick<WebsiteDraft, K>);
  }

  selectTab(tab: EditorTab): void {
    this.activeTab.set(tab);
  }

  selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
  }

  addPage(): void {
    const title = this.newPageTitle.trim();
    if (!title) return;
    const baseSlug = this.slugify(title) || 'page';
    const existingSlugs = new Set(this.draft().pages.map((page) => page.slug));
    let slug = baseSlug;
    let index = 2;
    while (existingSlugs.has(slug)) slug = `${baseSlug}-${index++}`;
    const page: WebsitePage = {
      id: `page-${Date.now()}`,
      title,
      slug,
      description: this.newPageDescription.trim() || `Contenu de la page ${title}.`,
      status: 'draft',
      isHome: false,
      sections: [
        {
          id: `section-${Date.now()}`,
          type: 'hero',
          eyebrow: 'DÉCOUVRIR',
          title,
          content: this.newPageDescription.trim() || `Présentez ici la page ${title}.`,
          visible: true,
        },
      ],
    };
    this.update('pages', [...this.draft().pages, page]);
    this.newPageTitle = '';
    this.newPageDescription = '';
    this.selectedPageId.set(page.id);
  }

  updatePage(pageId: string, patch: Partial<WebsitePage>): void {
    this.update('pages', this.draft().pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)));
  }

  removePage(page: WebsitePage): void {
    if (page.isHome) return;
    this.update('pages', this.draft().pages.filter((item) => item.id !== page.id));
    this.update('menuItems', this.draft().menuItems.filter((item) => item.pageId !== page.id));
    if (this.selectedPageId() === page.id) this.selectedPageId.set('home');
  }

  dropPage(event: CdkDragDrop<WebsitePage[]>): void {
    const pages = [...this.draft().pages];
    moveItemInArray(pages, event.previousIndex, event.currentIndex);
    this.update('pages', pages);
  }

  addMenuItem(): void {
    const label = this.newMenuLabel.trim();
    if (!label) return;
    const menuItem: WebsiteMenuItem = {
      id: `menu-${Date.now()}`,
      label,
      linkType: this.newMenuType,
      pageId: this.newMenuType === 'internal' ? this.newMenuPageId : undefined,
      url: this.newMenuType === 'external' ? this.normaliseExternalUrl(this.newMenuUrl) : undefined,
      openInNewTab: this.newMenuType === 'external' && this.newMenuOpenInNewTab,
      visible: true,
    };
    this.update('menuItems', [...this.draft().menuItems, menuItem]);
    this.newMenuLabel = '';
    this.newMenuUrl = 'https://';
  }

  updateMenuItem(itemId: string, patch: Partial<WebsiteMenuItem>): void {
    this.update('menuItems', this.draft().menuItems.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  removeMenuItem(itemId: string): void {
    this.update('menuItems', this.draft().menuItems.filter((item) => item.id !== itemId));
  }

  dropMenu(event: CdkDragDrop<WebsiteMenuItem[]>): void {
    const menuItems = [...this.draft().menuItems];
    moveItemInArray(menuItems, event.previousIndex, event.currentIndex);
    this.update('menuItems', menuItems);
  }

  previewMenuItem(item: WebsiteMenuItem, event: Event): void {
    event.preventDefault();
    if (item.linkType === 'internal' && item.pageId) {
      this.selectedPageId.set(item.pageId);
    }
  }

  addSection(): void {
    const page = this.selectedPage();
    if (!page) return;
    const option = this.sectionOptions.find((item) => item.value === this.newSectionType)!;
    const section: WebsiteSection = {
      id: `section-${Date.now()}`,
      type: this.newSectionType,
      eyebrow: option.label.toUpperCase(),
      title: option.label,
      content: 'Rédigez le contenu de cette section depuis le panneau d’édition.',
      visible: true,
    };
    this.updatePage(page.id, { sections: [...page.sections, section] });
  }

  updateSection(sectionId: string, patch: Partial<WebsiteSection>): void {
    const page = this.selectedPage();
    if (!page) return;
    this.updatePage(page.id, {
      sections: page.sections.map((section) => (section.id === sectionId ? { ...section, ...patch } : section)),
    });
  }

  removeSection(sectionId: string): void {
    const page = this.selectedPage();
    if (!page) return;
    this.updatePage(page.id, { sections: page.sections.filter((section) => section.id !== sectionId) });
  }

  dropSection(event: CdkDragDrop<WebsiteSection[]>): void {
    const page = this.selectedPage();
    if (!page) return;
    const sections = [...page.sections];
    moveItemInArray(sections, event.previousIndex, event.currentIndex);
    this.updatePage(page.id, { sections });
  }

  pageTitle(pageId?: string): string {
    return this.draft().pages.find((page) => page.id === pageId)?.title ?? 'Page supprimée';
  }

  sectionIcon(type: WebsiteSectionType): string {
    return this.sectionOptions.find((item) => item.value === type)?.icon ?? 'widgets';
  }

  sectionLabel(type: WebsiteSectionType): string {
    return this.sectionOptions.find((item) => item.value === type)?.label ?? type;
  }

  private slugify(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private normaliseExternalUrl(value: string): string {
    const url = value.trim();
    if (!url || url === 'https://') return '#';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }
}
