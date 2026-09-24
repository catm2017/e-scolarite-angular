import { environment } from '../../../environments/environment';
import { estDomainePlateforme } from './platform-domains';

/**
 * Les domaines clients utilisent leur propre origine pour éviter le CORS :
 * Nginx relaie alors /api vers Laravel. Les domaines techniques gardent l'API
 * déclarée dans l'environnement afin que le développement local reste simple.
 */
export function urlApiActive(): string {
  if (typeof window === 'undefined') return environment.apiUrl;

  const host = window.location.hostname.toLowerCase();
  return estDomainePlateforme(host) ? environment.apiUrl : `${window.location.origin}/api`;
}

export function estUrlApi(url: string): boolean {
  return url.startsWith(urlApiActive());
}
