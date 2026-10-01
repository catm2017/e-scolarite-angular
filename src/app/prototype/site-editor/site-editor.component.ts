import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { concatMap, from, toArray } from 'rxjs';
import {
  PrototypeDataService,
  WebsiteDraft,
  WebsiteMenuItem,
  WebsitePage,
  WebsiteSection,
  WebsiteSectionType,
  WebsiteMedia,
  WebsiteSectionItem,
} from '../prototype-data.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { CentralApiService } from '../central-api.service';

type EditorTab = 'content' | 'pages' | 'navigation' | 'design';

@Component({
  selector: 'app-site-editor',
  imports: [RouterLink, FormsModule, DragDropModule, PlatformLanguageSwitcherComponent],
  templateUrl: './site-editor.component.html',
  styleUrl: './site-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteEditorComponent implements OnInit, OnDestroy {
  readonly data = inject(PrototypeDataService);
  private readonly api = inject(CentralApiService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly draft = this.data.website;
  readonly activeTab = signal<EditorTab>('content');
  readonly selectedPageId = signal('home');
  readonly previewDevice = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  readonly selectedSectionId = signal<string | null>(null);
  readonly chargement = signal(true);
  readonly enregistrement = signal(false);
  readonly confirmationReinitialisation = signal(false);
  readonly reinitialisation = signal(false);
  readonly message = signal('');
  readonly mediaUploadError = signal<string | null>(null);
  readonly mediaUploadErrorTitle = signal('Média non enregistré');
  readonly mediaUploadBusy = signal(false);
  readonly mediaUploadName = signal('');
  readonly mediaUploadExternalUrl = signal('');
  readonly mediaUploadAlt = signal('');
  readonly mediaUploadFiles = signal<File[]>([]);
  readonly mediaUploadSource = signal<'local' | 'external'>('local');
  readonly mediaQuotaBytes = 500 * 1024 * 1024;
  readonly mediaMaxFileBytes = 2 * 1024 * 1024;
  /** Visuel par défaut de la bannière, remplaçable par une vidéo de la médiathèque. */
  readonly defaultHeroBackgroundUrl = 'assets/videos/default-school-hero.mp4';
  readonly mediaFilter = signal<'all' | 'image' | 'video' | 'pdf'>('all');
  /** Slide actif par composant témoignages (chaque section garde sa propre position). */
  readonly testimonialSlideBySection = signal<Record<string, number>>({});
  readonly newsSlideBySection = signal<Record<string, number>>({});
  private carouselTimer?: ReturnType<typeof setInterval>;
  readonly itemSectionTypes: WebsiteSectionType[] = ['stats', 'programs', 'schools', 'about', 'news', 'testimonials', 'contact'];

  readonly newPageTitle = signal('');
  readonly newPageDescription = signal('');
  readonly newMenuLabel = signal('');
  newMenuType: 'internal' | 'external' = 'internal';
  newMenuPageId = 'home';
  newMenuUrl = 'https://';
  newMenuOpenInNewTab = true;
  newSectionType: WebsiteSectionType = 'text';

  readonly selectedPage = computed(() =>
    this.draft().pages.find((page) => page.id === this.selectedPageId()) ?? this.draft().pages[0],
  );
  readonly selectedSection = computed(() => this.selectedPage()?.sections.find((section) => section.id === this.selectedSectionId()) ?? null);

  readonly visibleMenu = computed(() => this.draft().menuItems.filter((item) => item.visible));
  readonly filteredMedia = computed(() => {
    const filter = this.mediaFilter();
    return filter === 'all' ? this.draft().mediaLibrary : this.draft().mediaLibrary.filter((media) => media.type === filter);
  });
  readonly mediaUploadSize = computed(() => this.mediaUploadFiles().reduce((total, file) => total + file.size, 0));
  readonly mediaLibrarySize = computed(() => this.draft().mediaLibrary.reduce((total, media) => total + (media.sizeBytes ?? 0), 0));

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
    { value: 'admission', label: 'Formulaire d’admission', icon: 'how_to_reg' },
    { value: 'cta', label: 'Appel à l’action', icon: 'campaign' },
    { value: 'heading', label: 'Titre simple', icon: 'title' },
    { value: 'image', label: 'Image', icon: 'image' },
    { value: 'video', label: 'Vidéo', icon: 'movie' },
    { value: 'gallery', label: 'Galerie d’images', icon: 'collections' },
    { value: 'slider', label: 'Slider', icon: 'view_carousel' },
    { value: 'button', label: 'Bouton', icon: 'smart_button' },
  ];

  ngOnInit(): void {
    this.carouselTimer = setInterval(() => this.advanceCarousels(), 5000);
    if (!this.api.espaceInstitutCharge()) this.api.espaceInstitut().subscribe({ error: () => undefined });
    this.api.siteWebInstitut().subscribe({
      next: ({ data }) => {
        const brouillonLocal = this.data.restaurerBrouillonLocal();
        this.data.remplacerWebsite(brouillonLocal || data.contenu);
      },
      error: () => {
        const brouillonLocal = this.data.restaurerBrouillonLocal();
        if (brouillonLocal) this.data.remplacerWebsite(brouillonLocal);
        this.message.set('Le site n’a pas pu être chargé. La proposition affichée reste modifiable.');
      },
      complete: () => this.chargement.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
  }

  enregistrer(publier?: boolean): void {
    if (this.enregistrement()) return;
    this.enregistrement.set(true);
    this.message.set('');
    this.api.enregistrerSiteWebInstitut(this.draft(), publier).subscribe({
      next: ({ data, message }) => {
        this.data.remplacerWebsite(data.contenu);
        this.data.effacerBrouillonLocal();
        this.message.set(message);
      },
      error: () => this.message.set('L’enregistrement du site n’a pas abouti. Réessayez dans quelques instants.'),
      complete: () => this.enregistrement.set(false),
    });
  }

  demanderReinitialisation(): void {
    if (this.enregistrement() || this.reinitialisation()) return;
    this.confirmationReinitialisation.set(true);
  }

  annulerReinitialisation(): void {
    if (!this.reinitialisation()) this.confirmationReinitialisation.set(false);
  }

  reinitialiserProposition(): void {
    if (this.reinitialisation()) return;
    this.reinitialisation.set(true);
    this.api.propositionInitialeSiteWebInstitut().subscribe({
      next: ({ data, message }) => {
        this.data.updateWebsite(data.contenu);
        this.selectedPageId.set('home');
        this.selectedSectionId.set(null);
        this.activeTab.set('content');
        this.confirmationReinitialisation.set(false);
        this.message.set(message);
      },
      error: () => this.message.set('La proposition initiale n’a pas pu être chargée. Vos modifications sont conservées.'),
      complete: () => this.reinitialisation.set(false),
    });
  }

  update<K extends keyof WebsiteDraft>(key: K, value: WebsiteDraft[K]): void {
    this.data.updateWebsite({ [key]: value } as Pick<WebsiteDraft, K>);
  }

  selectTab(tab: EditorTab): void {
    this.activeTab.set(tab);
  }

  prepareSitePreview(): void {
    try {
      localStorage.setItem('escolarite-site-preview', JSON.stringify(this.draft()));
    } catch {
      // Le rendu public utilisera la dernière version enregistrée si le navigateur bloque le stockage local.
    }
  }

  selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
    this.selectedSectionId.set(null);
  }

  addPage(): void {
    const title = this.newPageTitle().trim();
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
      description: this.newPageDescription().trim() || `Contenu de la page ${title}.`,
      status: 'draft',
      isHome: false,
      sections: [
        {
          id: `section-${Date.now()}`,
          type: 'hero',
          eyebrow: 'DÉCOUVRIR',
          title,
          content: this.newPageDescription().trim() || `Présentez ici la page ${title}.`,
          visible: true,
        },
      ],
    };
    this.update('pages', [...this.draft().pages, page]);
    this.newPageTitle.set('');
    this.newPageDescription.set('');
    this.selectedPageId.set(page.id);
    this.message.set('Page ajoutée. Cliquez sur Enregistrer pour la conserver.');
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
    const label = this.newMenuLabel().trim();
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
    this.newMenuLabel.set('');
    this.newMenuUrl = 'https://';
    this.message.set('Lien ajouté au menu. Cliquez sur Enregistrer pour le conserver.');
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

  addSection(type: WebsiteSectionType = this.newSectionType, index?: number): void {
    const page = this.selectedPage();
    if (!page) return;
    const option = this.sectionOptions.find((item) => item.value === type)!;
    const section: WebsiteSection = {
      id: `section-${Date.now()}`,
      type,
      eyebrow: option.label.toUpperCase(),
      title: option.label,
      content: 'Rédigez le contenu de cette section depuis le panneau d’édition.',
      visible: true,
      buttonLabel: type === 'button' ? 'Découvrir' : undefined,
      buttonUrl: type === 'button' ? '#' : undefined,
      buttonLinkType: type === 'button' ? 'internal' : undefined,
      buttonPageId: type === 'button' ? 'home' : undefined,
      mediaItems: type === 'gallery' || type === 'slider' ? [] : undefined,
      items: this.itemSectionTypes.includes(type) ? this.defaultSectionItems(type) : undefined,
    };
    const sections = [...page.sections];
    if (typeof index === 'number') sections.splice(Math.max(0, Math.min(index, sections.length)), 0, section);
    else sections.push(section);
    this.updatePage(page.id, { sections });
    this.selectedSectionId.set(section.id);
    this.message.set('Composant ajouté. Personnalisez son contenu et son apparence.');
  }

  selectSection(sectionId: string, event?: Event): void {
    event?.stopPropagation();
    this.selectedSectionId.set(sectionId);
    const section = this.selectedPage()?.sections.find((item) => item.id === sectionId);
    if (section && this.itemSectionTypes.includes(section.type) && !section.items?.length) {
      this.updateSection(section.id, { items: this.defaultSectionItems(section.type) });
    }
  }

  supportsItems(type: WebsiteSectionType): boolean { return this.itemSectionTypes.includes(type); }

  defaultSectionItems(type: WebsiteSectionType): WebsiteSectionItem[] {
    const campuses = this.api.campusInstitut();
    const etablissements = this.api.etablissementsInstitut();
    if (type === 'stats') return [
      { id: 'stat-1', title: '684', subtitle: 'Apprenants', icon: 'groups' },
      { id: 'stat-2', title: '42', subtitle: 'Enseignants', icon: 'school' },
      { id: 'stat-3', title: '98%', subtitle: 'Réussite aux examens', icon: 'workspace_premium' },
      { id: 'stat-4', title: '16', subtitle: 'Années d’expérience', icon: 'calendar_month' },
    ];
    if (type === 'programs') return [
      { id: 'program-1', title: 'Préscolaire & Primaire', subtitle: 'CI – CM2', content: 'Éveil, fondamentaux et accompagnement dans un cadre stimulant.', icon: 'child_care' },
      { id: 'program-2', title: 'Collège & Lycée', subtitle: '6e – Terminale', content: 'Exigence académique, orientation et préparation aux examens.', icon: 'menu_book' },
      { id: 'program-3', title: 'Enseignement religieux', subtitle: 'Parcours dédié', content: 'Lecture, mémorisation et éducation aux valeurs.', icon: 'auto_stories' },
    ];
    if (type === 'schools') {
      const types = etablissements.map((item) => item.nom).filter(Boolean).join(' · ');
      return campuses.length ? campuses.map((campus) => ({ id: `campus-${campus.id}`, title: campus.nom, subtitle: types || 'Établissement', content: campus.adresse || 'Campus de l’institut', icon: 'location_city', meta: campus.adresse || '' })) : [
        { id: 'school-1', title: 'Campus Keur Massar', subtitle: 'Préscolaire · Primaire · Collège', content: 'Keur Massar, Dakar', icon: 'apartment' },
        { id: 'school-2', title: 'Campus Dakar Plateau', subtitle: 'Lycée · Formation professionnelle', content: 'Dakar Plateau', icon: 'domain' },
      ];
    }
    if (type === 'about') return [
      { id: 'value-1', title: 'Suivi individualisé', content: 'Chaque apprenant bénéficie d’un accompagnement attentif.', icon: 'person_search' },
      { id: 'value-2', title: 'Excellence académique', content: 'Des objectifs clairs et des équipes pédagogiques engagées.', icon: 'workspace_premium' },
      { id: 'value-3', title: 'Valeurs & citoyenneté', content: 'Une école ouverte, responsable et enracinée dans son contexte.', icon: 'diversity_3' },
    ];
    if (type === 'news') return [
      { id: 'news-1', title: 'Bienvenue pour la nouvelle rentrée scolaire', subtitle: '12 OCT. 2026', icon: 'campaign', linkLabel: 'Lire l’actualité', linkUrl: '' },
      { id: 'news-2', title: 'Nos élèves récompensés pour leurs résultats', subtitle: '28 JUIN 2026', icon: 'emoji_events', linkLabel: 'Lire l’actualité', linkUrl: '' },
      { id: 'news-3', title: 'Rencontre avec les familles de l’établissement', subtitle: '16 MAI 2026', icon: 'groups', linkLabel: 'Lire l’actualité', linkUrl: '' },
    ];
    if (type === 'contact') return [
      { id: 'contact-1', title: 'Adresse', content: 'Keur Massar, Dakar', icon: 'location_on' },
      { id: 'contact-2', title: 'Téléphone', content: '+221 77 450 18 18', icon: 'phone' },
      { id: 'contact-3', title: 'E-mail', content: 'contact@joyaudusavoir.sn', icon: 'mail' },
    ];
    return [
      { id: 'testimonial-1', title: 'Awa Ndiaye', subtitle: 'Parent d’élève', content: 'Une équipe disponible et un suivi qui nous met en confiance.', icon: 'format_quote' },
      { id: 'testimonial-2', title: 'Mamadou Fall', subtitle: 'Ancien élève', content: 'J’ai trouvé un cadre exigeant qui m’a aidé à progresser.', icon: 'format_quote' },
    ];
  }

  sectionItems(section: WebsiteSection): WebsiteSectionItem[] { return section.items?.length ? section.items : this.defaultSectionItems(section.type); }

  testimonialSlides(section: WebsiteSection): WebsiteSectionItem[][] {
    const items = this.sectionItems(section);
    const slides: WebsiteSectionItem[][] = [];
    for (let index = 0; index < items.length; index += 2) slides.push(items.slice(index, index + 2));
    return slides.length ? slides : [[]];
  }

  newsSlides(section: WebsiteSection): WebsiteSectionItem[][] {
    const items = this.sectionItems(section);
    const slides: WebsiteSectionItem[][] = [];
    for (let index = 0; index < items.length; index += 3) slides.push(items.slice(index, index + 3));
    return slides.length ? slides : [[]];
  }

  newsSlideIndex(section: WebsiteSection): number {
    const last = this.newsSlides(section).length - 1;
    return Math.min(this.newsSlideBySection()[section.id] ?? 0, Math.max(0, last));
  }

  setNewsSlide(section: WebsiteSection, index: number): void {
    const last = this.newsSlides(section).length - 1;
    this.newsSlideBySection.update((current) => ({ ...current, [section.id]: Math.max(0, Math.min(index, last)) }));
  }

  nextNewsSlide(section: WebsiteSection): void { this.setNewsSlide(section, this.newsSlideIndex(section) + 1); }

  previousNewsSlide(section: WebsiteSection): void { this.setNewsSlide(section, this.newsSlideIndex(section) - 1); }

  testimonialSlideIndex(section: WebsiteSection): number {
    const last = this.testimonialSlides(section).length - 1;
    return Math.min(this.testimonialSlideBySection()[section.id] ?? 0, Math.max(0, last));
  }

  setTestimonialSlide(section: WebsiteSection, index: number): void {
    const last = this.testimonialSlides(section).length - 1;
    this.testimonialSlideBySection.update((current) => ({ ...current, [section.id]: Math.max(0, Math.min(index, last)) }));
  }

  nextTestimonialSlide(section: WebsiteSection): void { this.setTestimonialSlide(section, this.testimonialSlideIndex(section) + 1); }

  previousTestimonialSlide(section: WebsiteSection): void { this.setTestimonialSlide(section, this.testimonialSlideIndex(section) - 1); }

  private advanceCarousels(): void {
    for (const section of this.selectedPage()?.sections ?? []) {
      if (section.type === 'news' && this.newsSlides(section).length > 1) {
        this.setNewsSlide(section, (this.newsSlideIndex(section) + 1) % this.newsSlides(section).length);
      }
      if (section.type === 'testimonials' && this.testimonialSlides(section).length > 1) {
        this.setTestimonialSlide(section, (this.testimonialSlideIndex(section) + 1) % this.testimonialSlides(section).length);
      }
    }
  }

  itemExternalHref(item: WebsiteSectionItem): string | null {
    const url = item.linkUrl?.trim();
    if (!url || url === '#') return null;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  updateSectionItem(section: WebsiteSection, itemId: string, patch: Partial<WebsiteSectionItem>): void {
    const items = this.sectionItems(section).map((item) => item.id === itemId ? { ...item, ...patch } : item);
    this.updateSection(section.id, { items });
  }

  addSectionItem(section: WebsiteSection): void {
    const item: WebsiteSectionItem = { id: `item-${Date.now()}`, title: 'Nouvel élément', subtitle: 'Sous-titre', content: 'Rédigez son contenu ici.', icon: this.defaultSectionItems(section.type)[0]?.icon || 'star' };
    this.updateSection(section.id, { items: [...this.sectionItems(section), item] });
  }

  removeSectionItem(section: WebsiteSection, itemId: string): void {
    this.updateSection(section.id, { items: this.sectionItems(section).filter((item) => item.id !== itemId) });
  }

  synchroniserEtablissements(section: WebsiteSection): void {
    const appliquer = () => this.updateSection(section.id, { items: this.defaultSectionItems('schools') });
    if (this.api.espaceInstitutCharge()) { appliquer(); return; }
    this.api.espaceInstitut().subscribe({ next: appliquer, error: () => this.message.set('Les établissements ne sont pas disponibles pour le moment.') });
  }

  updateSectionStyle(section: WebsiteSection, key: string, value: string): void {
    this.updateSection(section.id, { styles: { ...(section.styles ?? {}), [key]: value } });
  }

  setSectionButtonPage(section: WebsiteSection, pageId: string): void {
    this.updateSection(section.id, { buttonPageId: pageId, buttonUrl: `?page=${encodeURIComponent(pageId)}` });
  }

  sectionButtonHref(section: WebsiteSection): string {
    const internalHeroLink = section.type === 'hero' && !section.buttonLinkType;
    return section.buttonLinkType === 'internal' || internalHeroLink
      ? `?page=${encodeURIComponent(section.buttonPageId || (section.type === 'hero' ? 'schools' : 'home'))}`
      : section.buttonUrl || '#';
  }

  sectionStyle(section: WebsiteSection, key: string, fallback = ''): string {
    return section.styles?.[key] ?? fallback;
  }

  dropSectionOnPreview(event: CdkDragDrop<WebsiteSection[]>): void {
    const data = event.item.data as WebsiteSection | WebsiteSectionType | undefined;
    if (typeof data === 'string') {
      if (this.sectionOptions.some((option) => option.value === data)) this.addSection(data, event.currentIndex);
      return;
    }
    this.reorderSection(event, data);
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
    this.reorderSection(event, event.item.data as WebsiteSection | undefined);
  }

  private reorderSection(event: CdkDragDrop<WebsiteSection[]>, draggedSection?: WebsiteSection): void {
    const page = this.selectedPage();
    if (!page || !draggedSection?.id) return;
    const sections = [...page.sections];
    if (event.previousContainer === event.container) {
      moveItemInArray(sections, event.previousIndex, event.currentIndex);
    } else {
      const sourceIndex = sections.findIndex((section) => section.id === draggedSection.id);
      if (sourceIndex < 0) return;
      const [moved] = sections.splice(sourceIndex, 1);
      let targetIndex = Math.max(0, Math.min(event.currentIndex, sections.length));
      if (sourceIndex < targetIndex) targetIndex -= 1;
      sections.splice(targetIndex, 0, moved);
    }
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

  mediaFor(section: WebsiteSection): WebsiteMedia | undefined {
    if (!section.mediaId) return undefined;
    return this.draft().mediaLibrary.find((media) => media.id === section.mediaId);
  }

  heroMediaFor(section: WebsiteSection): WebsiteMedia | undefined {
    const media = this.mediaFor(section);
    return media?.type === 'video' ? media : undefined;
  }

  mediaById(mediaId: string | null | undefined): WebsiteMedia | undefined {
    return mediaId ? this.draft().mediaLibrary.find((media) => media.id === mediaId) : undefined;
  }

  selectMediaForSection(section: WebsiteSection, mediaId: string): void {
    this.updateSection(section.id, { mediaId: mediaId || null });
  }

  toggleMediaInSection(section: WebsiteSection, mediaId: string): void {
    const items = [...(section.mediaItems ?? [])];
    const index = items.indexOf(mediaId);
    if (index >= 0) items.splice(index, 1);
    else items.push(mediaId);
    this.updateSection(section.id, { mediaItems: items });
  }

  isMediaSelected(section: WebsiteSection, mediaId: string): boolean {
    return (section.mediaItems ?? []).includes(mediaId);
  }

  onMediaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichiers = Array.from(input.files ?? []);
    if (!fichiers.length || this.mediaUploadBusy()) return;
    const fichierTropLourd = fichiers.find((fichier) => fichier.size > this.mediaMaxFileBytes);
    if (fichierTropLourd) {
      this.afficherErreurMedia(`« ${fichierTropLourd.name} » fait ${this.formatBytes(fichierTropLourd.size)}. La taille maximale autorisée est de ${this.formatBytes(this.mediaMaxFileBytes)} par fichier.`, 'Taille du média trop élevée');
      input.value = '';
      return;
    }
    const extensionsMedia = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'gif', 'svg', 'avif', 'heic', 'heif', 'mp4', 'webm', 'mov', 'ogg', 'm4v', 'avi', 'mkv', 'pdf'];
    if (fichiers.some((fichier) => {
      const extension = fichier.name.split('.').pop()?.toLowerCase() ?? '';
      return !fichier.type.startsWith('image/') && !fichier.type.startsWith('video/') && !extensionsMedia.includes(extension);
    })) {
      this.message.set('Choisissez uniquement des fichiers image, vidéo ou PDF reconnus.');
      input.value = '';
      return;
    }
    const tailleTotale = fichiers.reduce((total, fichier) => total + fichier.size, 0);
    if (this.mediaLibrarySize() + tailleTotale > this.mediaQuotaBytes) {
      this.message.set(`La limite de ${this.formatBytes(this.mediaQuotaBytes)} par institut serait dépassée.`);
      input.value = '';
      return;
    }
    this.mediaUploadFiles.set(fichiers);
    if (!this.mediaUploadName().trim()) this.mediaUploadName.set(fichiers.length === 1 ? fichiers[0].name : 'Médias sélectionnés');
    this.message.set(`${fichiers.length} média${fichiers.length > 1 ? 's' : ''} prêt${fichiers.length > 1 ? 's' : ''}. Cliquez sur « Enregistrer le média${fichiers.length > 1 ? 's' : ''} ».`);
    input.value = '';
  }

  onNewsPdfSelected(event: Event, section: WebsiteSection, item: WebsiteSectionItem): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    input.value = '';
    if (!fichier || this.mediaUploadBusy()) return;
    const extension = fichier.name.split('.').pop()?.toLowerCase() ?? '';
    if (fichier.type !== 'application/pdf' && extension !== 'pdf') {
      this.afficherErreurMedia('Sélectionnez uniquement un fichier PDF pour cette actualité.', 'Fichier non valide');
      return;
    }
    if (fichier.size > this.mediaMaxFileBytes) {
      this.afficherErreurMedia(`« ${fichier.name} » fait ${this.formatBytes(fichier.size)}. La taille maximale autorisée est de ${this.formatBytes(this.mediaMaxFileBytes)} par fichier.`, 'Taille du PDF trop élevée');
      return;
    }
    if (this.mediaLibrarySize() + fichier.size > this.mediaQuotaBytes) {
      this.afficherErreurMedia(`La limite de ${this.formatBytes(this.mediaQuotaBytes)} par institut serait dépassée.`, 'Espace de stockage atteint');
      return;
    }

    this.mediaUploadBusy.set(true);
    this.message.set('Téléversement du document PDF…');
    this.api.televerserMediaSiteWeb(fichier, `Document · ${item.title || 'actualité'}`, `Document joint à l’actualité ${item.title || ''}`.trim()).subscribe({
      next: ({ contenu, media, message }) => {
        this.remplacerContenuMedia(contenu);
        const sectionCourante = this.draft().pages.flatMap((page) => page.sections).find((candidate) => candidate.id === section.id);
        if (sectionCourante) this.updateSectionItem(sectionCourante, item.id, { attachmentId: media.id });
        this.message.set(message || 'Document PDF ajouté à cette actualité. Cliquez sur Enregistrer pour conserver la modification.');
      },
      error: (response) => this.afficherErreurMedia(this.messageErreurMedia(response, 'Le document PDF n’a pas pu être téléversé.')),
      complete: () => this.mediaUploadBusy.set(false),
    });
  }

  changerSourceMedia(source: 'local' | 'external'): void {
    this.mediaUploadSource.set(source);
    this.mediaUploadFiles.set([]);
    this.mediaUploadName.set('');
    this.mediaUploadExternalUrl.set('');
    this.mediaUploadAlt.set('');
    this.message.set(source === 'external' ? 'Saisissez un lien vidéo YouTube, Vimeo ou un fichier vidéo direct.' : 'Choisissez une ou plusieurs images ou vidéos à téléverser.');
  }

  enregistrerMedias(): void {
    if (this.mediaUploadBusy()) return;
    if (this.mediaUploadSource() === 'external') {
      this.addExternalMedia();
      return;
    }
    const fichiers = this.mediaUploadFiles();
    if (!fichiers.length) {
      this.addExternalMedia();
      return;
    }
    const nom = this.mediaUploadName().trim();
    if (!nom) {
      this.message.set('Le nom du média est obligatoire.');
      return;
    }
    this.mediaUploadBusy.set(true);
    this.message.set(`Enregistrement de ${fichiers.length} média${fichiers.length > 1 ? 's' : ''}…`);
    from(fichiers).pipe(
      concatMap((fichier, index) => this.api.televerserMediaSiteWeb(
        fichier,
        fichiers.length > 1 ? `${nom} ${index + 1}` : nom,
        this.mediaUploadAlt(),
      )),
      toArray(),
    ).subscribe({
      next: (reponses) => {
        const derniereReponse = reponses[reponses.length - 1];
        if (derniereReponse) this.remplacerContenuMedia(derniereReponse.contenu);
        this.mediaUploadFiles.set([]);
        this.mediaUploadName.set('');
        this.mediaUploadExternalUrl.set('');
        this.mediaUploadAlt.set('');
        this.message.set(`${fichiers.length} média${fichiers.length > 1 ? 's' : ''} enregistré${fichiers.length > 1 ? 's' : ''} dans la médiathèque.`);
      },
      error: (response) => this.afficherErreurMedia(this.messageErreurMedia(response)),
      complete: () => {
        this.mediaUploadBusy.set(false);
      },
    });
  }

  annulerSelectionMedias(): void {
    if (this.mediaUploadBusy()) return;
    this.mediaUploadFiles.set([]);
    this.mediaUploadName.set('');
    this.mediaUploadExternalUrl.set('');
    this.mediaUploadAlt.set('');
    this.message.set('Sélection de médias annulée.');
  }

  onMediaReplacementSelected(event: Event, media: WebsiteMedia): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier || this.mediaUploadBusy()) return;
    this.mediaUploadBusy.set(true);
    this.message.set('Remplacement du média…');
    this.api.remplacerMediaSiteWeb(media.id, fichier, media.name, media.alt).subscribe({
      next: ({ contenu, message }) => { this.remplacerContenuMedia(contenu); this.message.set(message); },
      error: (response) => this.afficherErreurMedia(this.messageErreurMedia(response, 'Le média n’a pas pu être remplacé.')),
      complete: () => { this.mediaUploadBusy.set(false); input.value = ''; },
    });
  }

  addExternalMedia(): void {
    const name = this.mediaUploadName().trim();
    const url = this.mediaUploadExternalUrl().trim();
    const embedUrl = this.videoEmbedUrl(url);
    if (!name) {
      this.message.set('Le nom du média est obligatoire.');
      return;
    }
    if (!embedUrl) {
      this.message.set('Saisissez un lien vidéo valide YouTube, Vimeo ou un fichier vidéo direct (MP4, WebM, MOV ou OGG).');
      return;
    }
    const media: WebsiteMedia = {
      id: `media-${Date.now()}`,
      name,
      url,
      type: 'video',
      source: 'external',
      embedUrl,
      alt: this.mediaUploadAlt().trim(),
      createdAt: new Date().toISOString(),
    };
    this.update('mediaLibrary', [...this.draft().mediaLibrary, media]);
    this.mediaUploadName.set('');
    this.mediaUploadExternalUrl.set('');
    this.mediaUploadAlt.set('');
    this.message.set('Média externe ajouté. Cliquez sur Enregistrer pour le conserver.');
  }

  videoEmbedUrl(url: string): string | null {
    if (!/^https?:\/\//i.test(url)) return null;
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        const id = parsed.searchParams.get('v')
          || parsed.pathname.match(/^\/(?:embed\/|shorts\/|live\/)([A-Za-z0-9_-]{6,})/)?.[1];
        return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
      }
      if (host === 'youtu.be') {
        const id = parsed.pathname.slice(1).split('/')[0];
        return /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
      }
      if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const id = parsed.pathname.match(/(?:video\/)?(\d{5,})/)?.[1];
        return id ? `https://player.vimeo.com/video/${id}` : null;
      }
      const extension = parsed.pathname.split('.').pop()?.toLowerCase() ?? '';
      return ['mp4', 'webm', 'mov', 'ogg', 'm4v', 'avi', 'mkv'].includes(extension) ? parsed.toString() : null;
    } catch {
      return null;
    }
  }

  mediaUsesEmbed(media: WebsiteMedia): boolean {
    return media.source === 'external' && !!media.embedUrl && !/\.(mp4|webm|mov|ogg|m4v|avi|mkv)(?:\?|$)/i.test(media.embedUrl);
  }

  mediaEmbedResourceUrl(media: WebsiteMedia): SafeResourceUrl | null {
    if (!this.mediaUsesEmbed(media)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(media.embedUrl || media.url);
  }

  private messageErreurMedia(response: any, fallback = 'Le média n’a pas pu être enregistré.'): string {
    const erreurs = response?.error?.errors;
    const detail = erreurs ? Object.values(erreurs).flat().find((item): item is string => typeof item === 'string') : null;
    return detail || response?.error?.message || fallback;
  }

  fermerErreurMedia(): void {
    this.mediaUploadError.set(null);
    this.mediaUploadErrorTitle.set('Média non enregistré');
  }

  private afficherErreurMedia(message: string, titre = 'Média non enregistré'): void {
    this.message.set(message);
    this.mediaUploadErrorTitle.set(titre);
    this.mediaUploadError.set(message);
  }

  private remplacerContenuMedia(contenu: WebsiteDraft): void {
    const brouillonCourant = this.draft();
    this.data.updateWebsite({ ...contenu, ...brouillonCourant, mediaLibrary: contenu.mediaLibrary });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} Mo`;
  }

  removeMedia(media: WebsiteMedia): void {
    const used = this.draft().pages.some((page) => page.sections.some((section) => section.mediaId === media.id || (section.mediaItems ?? []).includes(media.id)));
    const usedInNews = this.draft().pages.some((page) => page.sections.some((section) => section.items?.some((item) => item.attachmentId === media.id)));
    if (used || usedInNews) {
      this.message.set('Ce média est utilisé dans une page. Retirez-le d’abord de cette page.');
      return;
    }
    if (!media.id.startsWith('media-')) {
      this.api.supprimerMediaSiteWeb(media.id).subscribe({
        next: ({ contenu, message }) => { this.remplacerContenuMedia(contenu); this.message.set(message); },
        error: () => this.message.set('Le média n’a pas pu être supprimé.'),
      });
      return;
    }
    this.update('mediaLibrary', this.draft().mediaLibrary.filter((item) => item.id !== media.id));
    this.message.set('Média retiré. Cliquez sur Enregistrer pour le conserver.');
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
