import { Injectable, signal } from '@angular/core';

export type WebsiteSectionType =
  | 'hero'
  | 'stats'
  | 'programs'
  | 'schools'
  | 'about'
  | 'news'
  | 'testimonials'
  | 'contact'
  | 'admission'
  | 'cta'
  | 'text'
  | 'heading'
  | 'image'
  | 'video'
  | 'gallery'
  | 'slider'
  | 'button';

export interface WebsiteMedia {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  source?: 'local' | 'external';
  embedUrl?: string;
  alt?: string;
  createdAt?: string;
  storagePath?: string | null;
  sizeBytes?: number;
}

export interface WebsiteSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  icon?: string;
  meta?: string;
  imageId?: string | null;
  linkLabel?: string;
  linkUrl?: string;
}

export interface WebsiteSection {
  id: string;
  type: WebsiteSectionType;
  title: string;
  eyebrow: string;
  content: string;
  visible: boolean;
  mediaId?: string | null;
  /** Image et textes de la carte visuelle affichée dans la bannière. */
  heroImageId?: string | null;
  heroImageTitle?: string;
  heroImageDescription?: string;
  heroImageBadge?: string;
  mediaUrl?: string | null;
  mediaItems?: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  buttonLinkType?: 'internal' | 'external';
  buttonPageId?: string;
  items?: WebsiteSectionItem[];
  styles?: Record<string, string>;
}

export interface WebsitePage {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: 'published' | 'draft';
  isHome: boolean;
  sections: WebsiteSection[];
}

export interface WebsiteMenuItem {
  id: string;
  label: string;
  linkType: 'internal' | 'external';
  pageId?: string;
  url?: string;
  openInNewTab: boolean;
  visible: boolean;
}

export interface WebsiteDraft {
  schoolName: string;
  logoUrl?: string | null;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  admissionsOpen: boolean;
  showStats: boolean;
  mediaLibrary: WebsiteMedia[];
  pages: WebsitePage[];
  menuItems: WebsiteMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class PrototypeDataService {
  private readonly siteDraftStoragePrefix = 'escolarite-site-draft:';

  readonly website = signal<WebsiteDraft>({
    schoolName: 'Institut Le Joyau du Savoir',
    logoUrl: null,
    tagline: 'Grandir, apprendre et réussir ensemble.',
    description:
      'Un établissement exigeant et bienveillant, engagé pour la réussite académique et l’épanouissement de chaque apprenant.',
    phone: '+221 77 450 18 18',
    email: 'contact@joyaudusavoir.sn',
    address: 'Keur Massar, Dakar',
    primaryColor: '#2F80ED',
    admissionsOpen: true,
    showStats: true,
    mediaLibrary: [],
    pages: [
      {
        id: 'home',
        title: 'Accueil',
        slug: 'accueil',
        description: 'Page d’accueil principale du site.',
        status: 'published',
        isHome: true,
        sections: [
          { id: 'home-hero', type: 'hero', eyebrow: 'RENTRÉE 2026–2027', title: 'Former les citoyens et les talents de demain', content: 'Un parcours complet, un accompagnement exigeant et un cadre bienveillant pour faire réussir chaque apprenant.', visible: true },
          { id: 'home-stats', type: 'stats', eyebrow: 'NOS CHIFFRES', title: 'Une communauté qui grandit', content: 'Nos résultats et notre expérience en quelques chiffres.', visible: true },
          { id: 'home-programs', type: 'programs', eyebrow: 'NOS PARCOURS', title: 'Un programme pour chaque ambition', content: 'Du préscolaire au lycée, avec un parcours religieux structuré.', visible: true },
          { id: 'home-schools', type: 'schools', eyebrow: 'NOS ÉTABLISSEMENTS', title: 'Des écoles proches des familles', content: 'Retrouvez nos campus, leurs cycles et leurs coordonnées.', visible: true },
          { id: 'home-about', type: 'about', eyebrow: 'POURQUOI NOUS CHOISIR', title: 'Exigence, accompagnement et valeurs', content: 'Une pédagogie active, une équipe engagée et un suivi individualisé.', visible: true },
          { id: 'home-news', type: 'news', eyebrow: 'ACTUALITÉS', title: 'Les nouvelles de l’institut', content: 'Partagez vos événements, annonces et réussites.', visible: true },
          { id: 'home-testimonials', type: 'testimonials', eyebrow: 'TÉMOIGNAGES', title: 'La parole à notre communauté', content: 'Parents, élèves et anciens partagent leur expérience.', visible: true },
          { id: 'home-cta', type: 'cta', eyebrow: 'ADMISSIONS', title: 'Les préinscriptions sont ouvertes', content: 'Déposez une demande et notre équipe vous accompagne dans les prochaines étapes.', visible: true },
        ],
      },
      {
        id: 'schools',
        title: 'Nos écoles',
        slug: 'nos-ecoles',
        description: 'Présentation des campus et des cycles proposés.',
        status: 'published',
        isHome: false,
        sections: [
          { id: 'schools-hero', type: 'hero', eyebrow: 'NOTRE RÉSEAU', title: 'Nos établissements', content: 'Découvrez nos campus, leurs équipes et les cycles disponibles.', visible: true },
          { id: 'schools-list', type: 'schools', eyebrow: 'CAMPUS', title: 'Choisir son établissement', content: 'Des environnements d’apprentissage adaptés et accessibles.', visible: true },
          { id: 'schools-contact', type: 'cta', eyebrow: 'VISITE', title: 'Venez découvrir nos campus', content: 'Contactez-nous pour organiser une visite.', visible: true },
        ],
      },
      {
        id: 'about',
        title: 'À propos',
        slug: 'a-propos',
        description: 'Histoire, mission, valeurs et équipe de l’institut.',
        status: 'published',
        isHome: false,
        sections: [
          { id: 'about-hero', type: 'hero', eyebrow: 'NOTRE HISTOIRE', title: 'Une école engagée pour la réussite', content: 'Découvrez notre projet éducatif et celles et ceux qui le font vivre.', visible: true },
          { id: 'about-values', type: 'about', eyebrow: 'NOS VALEURS', title: 'Apprendre, grandir et réussir ensemble', content: 'Excellence, responsabilité, ouverture et bienveillance.', visible: true },
        ],
      },
      {
        id: 'admission',
        title: 'Admission',
        slug: 'admission',
        description: 'Procédure, pièces demandées et demande de préinscription.',
        status: 'published',
        isHome: false,
        sections: [
          { id: 'admission-hero', type: 'hero', eyebrow: 'RENTRÉE 2026–2027', title: 'Rejoignez notre établissement', content: 'Consultez la procédure et envoyez votre demande de préinscription.', visible: true },
          { id: 'admission-content', type: 'admission', eyebrow: 'CANDIDATURE', title: 'Déposer une demande d’admission', content: 'Choisissez le type d’établissement, votre campus et la classe souhaitée.', visible: true },
        ],
      },
      {
        id: 'news',
        title: 'Actualités',
        slug: 'actualites',
        description: 'Les événements, annonces et réussites de l’institut.',
        status: 'published',
        isHome: false,
        sections: [
          { id: 'news-hero', type: 'hero', eyebrow: 'ACTUALITÉS', title: 'La vie de notre communauté', content: 'Retrouvez les dernières nouvelles et les moments forts de l’établissement.', visible: true },
          { id: 'news-list', type: 'news', eyebrow: 'À LA UNE', title: 'Nos dernières nouvelles', content: 'Ajoutez une image, un texte et un lien à chaque actualité.', visible: true },
        ],
      },
      {
        id: 'contact',
        title: 'Contact',
        slug: 'contact',
        description: 'Coordonnées, horaires et formulaire de contact.',
        status: 'published',
        isHome: false,
        sections: [
          { id: 'contact-hero', type: 'hero', eyebrow: 'CONTACT', title: 'Parlons du parcours de votre enfant', content: 'Notre équipe répond à vos questions et vous aide à choisir le parcours adapté.', visible: true },
          { id: 'contact-details', type: 'contact', eyebrow: 'NOUS JOINDRE', title: 'Nos coordonnées', content: 'Téléphone, e-mail, adresse et horaires d’ouverture.', visible: true },
        ],
      },
    ],
    menuItems: [
      { id: 'menu-home', label: 'Accueil', linkType: 'internal', pageId: 'home', openInNewTab: false, visible: true },
      { id: 'menu-schools', label: 'Nos parcours', linkType: 'internal', pageId: 'schools', openInNewTab: false, visible: true },
      { id: 'menu-about', label: 'Notre institut', linkType: 'internal', pageId: 'about', openInNewTab: false, visible: true },
      { id: 'menu-admission', label: 'Admissions', linkType: 'internal', pageId: 'admission', openInNewTab: false, visible: true },
      { id: 'menu-news', label: 'Actualités', linkType: 'internal', pageId: 'news', openInNewTab: false, visible: true },
      { id: 'menu-contact', label: 'Contact', linkType: 'internal', pageId: 'contact', openInNewTab: false, visible: true },
    ],
  });

  updateWebsite(patch: Partial<WebsiteDraft>): void {
    this.website.update((draft) => {
      const next = { ...draft, ...patch };
      this.sauvegarderBrouillonLocal(next);
      return next;
    });
  }

  remplacerWebsite(draft: WebsiteDraft): void {
    this.website.set(draft);
  }

  restaurerBrouillonLocal(): WebsiteDraft | null {
    if (typeof window === 'undefined') return null;
    try {
      const brut = window.localStorage.getItem(this.siteDraftStorageKey());
      if (!brut) return null;
      const draft = JSON.parse(brut) as WebsiteDraft;
      return draft?.pages && draft?.menuItems ? draft : null;
    } catch {
      return null;
    }
  }

  effacerBrouillonLocal(): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(this.siteDraftStorageKey()); } catch { /* stockage indisponible */ }
  }

  private sauvegarderBrouillonLocal(draft: WebsiteDraft): void {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(this.siteDraftStorageKey(), JSON.stringify(draft)); } catch { /* quota ou stockage indisponible */ }
  }

  private siteDraftStorageKey(): string {
    if (typeof window === 'undefined') return `${this.siteDraftStoragePrefix}default`;
    let institutId = 'default';
    try {
      const session = JSON.parse(window.localStorage.getItem('escolarite_institut') || '{}') as Record<string, unknown>;
      institutId = String(session['id'] || session['institut_id'] || 'default');
    } catch { /* session non lisible */ }
    return `${this.siteDraftStoragePrefix}${institutId}`;
  }
}
