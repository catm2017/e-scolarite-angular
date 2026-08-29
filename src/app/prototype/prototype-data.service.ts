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
  | 'cta'
  | 'text';

export interface WebsiteSection {
  id: string;
  type: WebsiteSectionType;
  title: string;
  eyebrow: string;
  content: string;
  visible: boolean;
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
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  admissionsOpen: boolean;
  showStats: boolean;
  pages: WebsitePage[];
  menuItems: WebsiteMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class PrototypeDataService {
  readonly website = signal<WebsiteDraft>({
    schoolName: 'Institut Le Joyau du Savoir',
    tagline: 'Grandir, apprendre et réussir ensemble.',
    description:
      'Un établissement exigeant et bienveillant, engagé pour la réussite académique et l’épanouissement de chaque apprenant.',
    phone: '+221 77 450 18 18',
    email: 'contact@joyaudusavoir.sn',
    address: 'Keur Massar, Dakar',
    primaryColor: '#2F80ED',
    admissionsOpen: true,
    showStats: true,
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
          { id: 'admission-content', type: 'text', eyebrow: 'PROCÉDURE', title: 'Une admission simple et accompagnée', content: 'Choisissez le cycle, préparez les pièces demandées et transmettez votre demande. Notre équipe vous recontactera.', visible: true },
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
      { id: 'menu-schools', label: 'Nos écoles', linkType: 'internal', pageId: 'schools', openInNewTab: false, visible: true },
      { id: 'menu-about', label: 'À propos', linkType: 'internal', pageId: 'about', openInNewTab: false, visible: true },
      { id: 'menu-admission', label: 'Admission', linkType: 'internal', pageId: 'admission', openInNewTab: false, visible: true },
      { id: 'menu-contact', label: 'Contact', linkType: 'internal', pageId: 'contact', openInNewTab: false, visible: true },
    ],
  });

  updateWebsite(patch: Partial<WebsiteDraft>): void {
    this.website.update((draft) => ({ ...draft, ...patch }));
  }
}
