import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PrototypeDataService, WebsiteDraft, WebsiteMedia, WebsiteMenuItem, WebsiteSection, WebsiteSectionItem, WebsiteSectionType } from '../prototype-data.service';
import { PlatformLanguageSwitcherComponent } from '../../shared/components/platform-language-switcher/platform-language-switcher.component';
import { AdmissionFormComponent } from '../admission-form/admission-form.component';

@Component({
  selector: 'app-school-site',
  imports: [RouterLink, PlatformLanguageSwitcherComponent, AdmissionFormComponent],
  templateUrl: './school-site.component.html',
  styleUrl: './school-site.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolSiteComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  readonly data = inject(PrototypeDataService);
  readonly draft = this.data.website;
  readonly selectedPageId = signal('home');
  readonly mobileMenuOpen = signal(false);
  readonly selectedPage = computed(() =>
    this.draft().pages.find((page) => page.id === this.selectedPageId()) ?? this.draft().pages[0],
  );
  readonly visibleMenu = computed(() => this.draft().menuItems.filter((item) => item.visible));
  /** Visuel affiché par défaut derrière la bannière lorsqu'aucune vidéo n'est configurée. */
  readonly defaultHeroBackgroundUrl = 'assets/videos/default-school-hero.mp4';
  readonly testimonialSlideBySection = signal<Record<string, number>>({});
  readonly newsSlideBySection = signal<Record<string, number>>({});
  private carouselTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.carouselTimer = setInterval(() => this.advanceCarousels(), 5000);
    try {
      const preview = localStorage.getItem('escolarite-site-preview');
      if (preview) {
        const draft = JSON.parse(preview) as WebsiteDraft;
        if (draft?.pages && draft?.menuItems) this.data.remplacerWebsite(draft);
      }
    } catch {
      // Le rendu conserve la proposition locale par défaut si le stockage est indisponible.
    }
    const requestedPage = this.route.snapshot.queryParamMap.get('page');
    if (requestedPage && this.draft().pages.some((page) => page.id === requestedPage)) {
      this.selectedPageId.set(requestedPage);
    }
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) clearInterval(this.carouselTimer);
  }

  openMenuItem(item: WebsiteMenuItem, event: Event): void {
    if (item.linkType !== 'internal' || !item.pageId) return;
    event.preventDefault();
    this.selectedPageId.set(item.pageId);
    this.mobileMenuOpen.set(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sectionButtonHref(section: WebsiteSection): string {
    const internalHeroLink = section.type === 'hero' && !section.buttonLinkType;
    return section.buttonLinkType === 'internal' || internalHeroLink
      ? `?page=${encodeURIComponent(section.buttonPageId || (section.type === 'hero' ? 'schools' : 'home'))}`
      : section.buttonUrl || '#';
  }

  /** La page d’authentification reste dans le site de l’établissement en démonstration.
   * Sur un domaine client, /connexion est résolu avec le thème du domaine courant. */
  siteLoginHref(): string {
    return this.route.snapshot.url.some((segment) => segment.path === 'demo')
      ? '/demo/joyau-du-savoir/connexion'
      : '/connexion';
  }

  openSectionLink(section: WebsiteSection, event: Event): void {
    const internalHeroLink = section.type === 'hero' && !section.buttonLinkType;
    if (section.buttonLinkType !== 'internal' && !internalHeroLink) return;
    event.preventDefault();
    this.selectedPageId.set(section.buttonPageId || 'home');
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
      admission: 'how_to_reg',
      cta: 'campaign',
      text: 'article',
      heading: 'title',
      image: 'image',
      video: 'movie',
      gallery: 'collections',
      slider: 'view_carousel',
      button: 'smart_button',
    };
    return icons[type];
  }

  mediaById(mediaId: string | null | undefined) {
    return mediaId ? this.draft().mediaLibrary.find((media) => media.id === mediaId) : undefined;
  }

  heroBackgroundMedia(section: WebsiteSection): WebsiteMedia | undefined {
    const media = this.mediaById(section.mediaId);
    return media?.type === 'video' ? media : undefined;
  }

  mediaUsesEmbed(media: WebsiteMedia): boolean {
    return media.source === 'external' && !!media.embedUrl && !/\.(mp4|webm|mov|ogg|m4v|avi|mkv)(?:\?|$)/i.test(media.embedUrl);
  }

  mediaEmbedResourceUrl(media: WebsiteMedia): SafeResourceUrl | null {
    if (!this.mediaUsesEmbed(media)) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(media.embedUrl || media.url);
  }

  itemExternalHref(item: WebsiteSectionItem): string | null {
    const url = item.linkUrl?.trim();
    if (!url || url === '#') return null;
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  sectionItems(section: WebsiteSection): WebsiteSectionItem[] {
    if (section.items?.length) return section.items;
    const defaults: Record<string, WebsiteSectionItem[]> = {
      stats: [
        { id: 'stat-1', title: '684', subtitle: 'Apprenants' }, { id: 'stat-2', title: '42', subtitle: 'Enseignants' },
        { id: 'stat-3', title: '98%', subtitle: 'Réussite aux examens' }, { id: 'stat-4', title: '16', subtitle: 'Années d’expérience' },
      ],
      programs: [
        { id: 'program-1', title: 'Préscolaire & Primaire', subtitle: 'CI – CM2', content: 'Éveil, acquisition des fondamentaux et accompagnement personnalisé.', icon: 'child_care' },
        { id: 'program-2', title: 'Collège & Lycée', subtitle: '6e – Terminale', content: 'Consolidation des savoirs, orientation et préparation aux examens.', icon: 'menu_book' },
        { id: 'program-3', title: 'Enseignement religieux', subtitle: 'Parcours dédié', content: 'Lecture, mémorisation, récitation et transmission des valeurs.', icon: 'auto_stories' },
      ],
      schools: [{ id: 'school-1', title: 'Campus Keur Massar', subtitle: 'Préscolaire · Primaire · Collège', content: 'Keur Massar, Dakar', icon: 'apartment' }, { id: 'school-2', title: 'Campus Dakar Plateau', subtitle: 'Lycée · Formation professionnelle', content: 'Dakar Plateau', icon: 'domain' }],
      about: [{ id: 'value-1', title: 'Accompagnement individualisé', content: 'Un suivi attentif pour faire progresser chaque apprenant.', icon: 'person_search' }, { id: 'value-2', title: 'Excellence académique', content: 'Des équipes engagées autour d’objectifs ambitieux et mesurables.', icon: 'workspace_premium' }, { id: 'value-3', title: 'Valeurs & citoyenneté', content: 'Une éducation responsable, ouverte et enracinée au Sénégal.', icon: 'diversity_3' }],
      news: [{ id: 'news-1', title: 'Bienvenue pour la nouvelle rentrée scolaire', subtitle: '12 OCT. 2026', icon: 'campaign' }, { id: 'news-2', title: 'Nos élèves récompensés pour leurs résultats', subtitle: '28 JUIN 2026', icon: 'emoji_events' }, { id: 'news-3', title: 'Rencontre avec les familles de l’établissement', subtitle: '16 MAI 2026', icon: 'groups' }],
      testimonials: [{ id: 'testimonial-1', title: 'Awa Ndiaye', subtitle: 'Parent d’élève', content: 'Une équipe disponible, une communication claire et un suivi qui nous met en confiance.', icon: 'format_quote' }, { id: 'testimonial-2', title: 'Mamadou Fall', subtitle: 'Ancien élève', content: 'J’ai trouvé un cadre exigeant qui m’a permis de progresser et de préparer mon avenir.', icon: 'format_quote' }],
      contact: [{ id: 'contact-1', title: 'Adresse', content: this.draft().address, icon: 'location_on' }, { id: 'contact-2', title: 'Téléphone', content: this.draft().phone, icon: 'phone' }, { id: 'contact-3', title: 'E-mail', content: this.draft().email, icon: 'mail' }],
    };
    return defaults[section.type] ?? [];
  }

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

  firstMedia(section: { mediaItems?: string[] }) {
    return this.mediaById(section.mediaItems?.[0]);
  }
}
