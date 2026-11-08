/**
 * Présentation des séances d'un enseignant, partagée par son dossier dans la
 * console de l'institut et dans les espaces de cycle (primaire, collège, lycée).
 */

import { MatTableDataSource } from '@angular/material/table';
import type { ColumnDefinition } from '@shared/components/master-table/master-table.component';

export interface SeanceEnseignantApi {
  id: string;
  reference: string | null;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  duree_minutes: number;
  statut: string;
  classe_id: string;
  classe: string;
  matiere: string | null;
  salle: string | null;
  etablissement_id: string;
  type_etablissement: string | null;
  etablissement: string;
  campus_id: string;
  campus: string;
  annee_scolaire: string | null;
  annee_scolaire_centrale_id: string | null;
}

export interface SyntheseSeancesEnseignantApi {
  total: number;
  tenues: number;
  ratees: number;
  a_venir: number;
  a_renseigner: number;
  minutes_effectuees: number;
  heures_effectuees: number;
  /** Nombre de séances renvoyées dans la liste (la plus récente d'abord). */
  affichees: number;
}

export type FiltreSeancesEnseignant = 'toutes' | 'tenues' | 'a_venir' | 'a_renseigner' | 'ratees';

export const FILTRES_SEANCES_ENSEIGNANT: ReadonlyArray<{ code: FiltreSeancesEnseignant; libelle: string }> = [
  { code: 'toutes', libelle: 'Toutes' },
  { code: 'tenues', libelle: 'Effectuées' },
  { code: 'a_venir', libelle: 'À venir' },
  { code: 'a_renseigner', libelle: 'À renseigner' },
  { code: 'ratees', libelle: 'Ratées' },
];

/** Catégorie d'une séance : son statut, et sa date pour une séance encore planifiée. */
export function categorieSeance(seance: Pick<SeanceEnseignantApi, 'statut' | 'date_seance'>, aujourdhui = dateDuJour()): Exclude<FiltreSeancesEnseignant, 'toutes'> {
  if (seance.statut === 'realisee' || seance.statut === 'terminee') return 'tenues';
  if (seance.statut === 'ratee') return 'ratees';
  return seance.date_seance < aujourdhui ? 'a_renseigner' : 'a_venir';
}

export function statutSeance(seance: Pick<SeanceEnseignantApi, 'statut' | 'date_seance'>): { libelle: string; classe: string } {
  if (seance.statut === 'terminee') return { libelle: 'Validée', classe: 'validee' };
  if (seance.statut === 'realisee') return { libelle: 'Effectuée', classe: 'effectuee' };
  if (seance.statut === 'ratee') return { libelle: 'Ratée', classe: 'ratee' };
  return categorieSeance(seance) === 'a_renseigner'
    ? { libelle: 'À renseigner', classe: 'a-renseigner' }
    : { libelle: 'Planifiée', classe: 'planifiee' };
}

export function filtrerSeances(seances: SeanceEnseignantApi[], filtre: FiltreSeancesEnseignant): SeanceEnseignantApi[] {
  if (filtre === 'toutes') return seances;
  const aujourdhui = dateDuJour();
  return seances.filter((seance) => categorieSeance(seance, aujourdhui) === filtre);
}

export function compterSeances(seances: SeanceEnseignantApi[], filtre: FiltreSeancesEnseignant): number {
  return filtrerSeances(seances, filtre).length;
}

/** 90 → « 1 h 30 » ; 45 → « 45 min ». */
export function formaterDuree(minutes: number | null | undefined): string {
  const total = Math.max(0, Math.round(minutes ?? 0));
  const heures = Math.floor(total / 60);
  const reste = total % 60;
  if (!heures) return `${reste} min`;
  return reste ? `${heures} h ${String(reste).padStart(2, '0')}` : `${heures} h`;
}

export function formaterDateSeance(date: string): string {
  const valeur = new Date(`${date}T00:00:00`);
  if (Number.isNaN(valeur.getTime())) return date;
  return valeur.toLocaleDateString('fr-SN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function dateDuJour(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

/** Ligne prête à afficher dans le tableau du template (app-master-table). */
export interface LigneSeanceEnseignant extends SeanceEnseignantApi {
  dateLabel: string;
  horaire: string;
  lieu: string;
  matiereLabel: string;
  dureeLabel: string;
  etat: string;
}

export function lignesSeances(seances: SeanceEnseignantApi[]): LigneSeanceEnseignant[] {
  return seances.map((seance) => ({
    ...seance,
    dateLabel: formaterDateSeance(seance.date_seance),
    horaire: `${seance.heure_debut.slice(0, 5)} – ${seance.heure_fin.slice(0, 5)}`,
    lieu: `${seance.etablissement} · ${seance.campus}`,
    matiereLabel: seance.matiere || '—',
    dureeLabel: formaterDuree(seance.duree_minutes),
    etat: statutSeance(seance).libelle,
  }));
}

export function colonnesSeancesEnseignant(avecLieu: boolean): ColumnDefinition[] {
  return [
    { def: 'dateLabel', label: 'Date', type: 'text', visible: true },
    { def: 'horaire', label: 'Horaire', type: 'text', visible: true },
    ...(avecLieu ? [{ def: 'lieu', label: 'Cycle · campus', type: 'text' as const, visible: true }] : []),
    { def: 'classe', label: 'Classe', type: 'text', visible: true },
    { def: 'matiereLabel', label: 'Matière', type: 'text', visible: true },
    { def: 'dureeLabel', label: 'Durée', type: 'text', visible: true },
    {
      def: 'etat',
      label: 'État',
      type: 'status',
      visible: true,
      statusBadgeMap: {
        Validée: 'badge badge-solid-green',
        Effectuée: 'badge badge-solid-blue',
        'À renseigner': 'badge badge-solid-orange',
        Ratée: 'badge badge-solid-red',
        Planifiée: 'badge badge-solid-purple',
      },
    },
    { def: 'actions', label: 'Actions', type: 'actionBtn', visible: true },
  ];
}

/**
 * Source du tableau : la date et la durée sont triées sur leurs valeurs
 * réelles, pas sur leurs libellés (« lun. 3 nov. » ne se trie pas).
 */
export function sourceTableauSeances(): MatTableDataSource<LigneSeanceEnseignant> {
  const source = new MatTableDataSource<LigneSeanceEnseignant>([]);
  source.sortingDataAccessor = (ligne, colonne) => {
    if (colonne === 'dateLabel') return `${ligne.date_seance} ${ligne.heure_debut}`;
    if (colonne === 'horaire') return ligne.heure_debut;
    if (colonne === 'dureeLabel') return ligne.duree_minutes;
    const valeur = (ligne as unknown as Record<string, unknown>)[colonne];
    return typeof valeur === 'number' ? valeur : String(valeur ?? '').toLowerCase();
  };
  return source;
}
