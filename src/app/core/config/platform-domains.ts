/** Domaines qui servent la plateforme E-Scolarité elle-même. */
export const DOMAINES_PLATEFORME = [
  'localhost',
  '127.0.0.1',
  'e-scolarite.local',
  'escolarite.daaratech.sn',
  'escolarite.org',
  'www.escolarite.org',
] as const;

export function estDomainePlateforme(domaine: string): boolean {
  return DOMAINES_PLATEFORME.includes(domaine.toLowerCase() as (typeof DOMAINES_PLATEFORME)[number]);
}
