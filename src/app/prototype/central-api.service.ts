import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, defer, Observable, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const CLES_SESSION_API = [
  'escolarite_centrale_token',
  'escolarite_centrale_user',
  'escolarite_institut',
  'escolarite_souscription_validee',
  'escolarite_fonctionnalites_actives',
  'escolarite_session_expire_at',
] as const;

/** Nettoyage synchrone utilisable par l'intercepteur sans dépendance HttpClient circulaire. */
export function effacerSessionApiLocale(): void {
  CLES_SESSION_API.forEach((cle) => localStorage.removeItem(cle));
  window.dispatchEvent(new Event('escolarite-session-effacee'));
}

export interface CentralUser {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  roles?: string[];
}

export interface InstitutConnexion {
  id: string;
  nom: string;
  slug: string;
}

export interface FonctionnaliteSouscription {
  id: string;
  fonctionnalite_id: string;
  code: string;
  libelle: string;
  prix_mensuel: number;
  devise: string;
  selectionnee: boolean;
}

export interface TypeSouscription {
  id: string | null;
  type_id: string;
  code: string;
  type: string;
  nom: string;
  active: boolean;
  fonctionnalites: FonctionnaliteSouscription[];
}

export interface EspaceInstitut {
  institut: InstitutConnexion;
  user: CentralUser & { type: string };
  etablissements: Array<Omit<TypeSouscription, 'fonctionnalites'>>;
  campus: CampusInstitut[];
}

export interface CampusInstitut {
  id: string;
  code: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  statut: 'actif' | 'inactif';
  etablissements_count: number;
  salles_count: number;
}

export interface SalleInstitut {
  id: string;
  campus_id: string;
  campus_nom: string;
  code: string;
  nom: string;
  type: string;
  capacite: number | null;
  description: string | null;
  statut: 'disponible' | 'indisponible' | 'maintenance';
}

export type SalleInstitutPayload = Omit<SalleInstitut, 'id' | 'campus_nom' | 'code' | 'description'> & {
  code: string | null;
  description: string | null;
};

export interface SouscriptionInstitut {
  abonnement_id: string | null;
  statut: string | null;
  validee: boolean;
  fonctionnalites_actives: string[];
  types: TypeSouscription[];
}

export interface TarificationFonctionnalite {
  id: string;
  prix_mensuel: number;
  devise: string;
  actif: boolean;
  ordre: number;
  type_etablissement_id: string;
  type_etablissement: string;
  code: string;
  fonctionnalite: string;
}

export interface TypeEtablissementCatalogue {
  id: string;
  code: string;
  libelle: string;
}

export interface DemandeAdhesion {
  id: string;
  nom_institut: string;
  ville?: string;
  prenom_responsable: string;
  nom_responsable: string;
  email_responsable: string;
  telephone_responsable: string;
  types_etablissements?: string[];
  effectif_estime?: number;
  statut: string;
  created_at: string;
}

export interface AnneeScolaireCentrale {
  id: string;
  libelle: string;
  statut: 'ouverte' | 'archivee';
  est_courante: boolean;
}

export interface AnneeScolaireInstitut extends AnneeScolaireCentrale {
  configuration: {
    id: string;
    date_debut: string;
    date_fin: string;
    est_courante: boolean;
  } | null;
}

export interface ParametresScolariteEtablissement {
  niveaux: Array<{ id: string; code: string; libelle: string }>;
  periodes: Array<{ id: string; libelle: string; date_debut: string | null; date_fin: string | null }>;
}

export interface ClasseEtablissementApi {
  id: string;
  code: string;
  nom: string;
  niveau: string;
  serie: string | null;
  statut: string;
  effectif: number;
  frais_inscription: number;
  mensualite: number;
}

export interface ClasseEtablissementPayload {
  id?: string | null;
  niveau: string;
  nom: string;
  serie?: string | null;
  frais_inscription: number;
  mensualite: number;
}

export interface SerieLyceeEtablissementApi {
  id: string;
  code: string;
  libelle: string;
  description: string | null;
  couleur: string;
  actif: boolean;
}

export interface SerieLyceeEtablissementPayload {
  code: string;
  libelle: string;
  description: string | null;
  couleur: string;
  actif: boolean;
}

export interface MatiereEtablissementApi {
  id: string;
  code: string;
  libelle: string;
  domaine: string | null;
}

export interface ClasseMatiereEtablissementApi {
  id: string;
  classe_id: string;
  matiere_id: string;
  coefficient: number | string | null;
  note_maximale: number | string | null;
}

export interface LeconProgrammeEtablissementApi {
  id: string;
  programme_id: string;
  libelle: string;
  objectifs: string | null;
  ordre: number;
  nombre_seances_estime: number;
  periode_academique_id: string | null;
  periode: string | null;
  pourcentage: number;
  statut: 'a_faire' | 'en_cours' | 'terminee';
  date_dernier_avancement: string | null;
}

export interface ProgrammeEtablissementApi {
  id: string;
  classe_matiere_id: string;
  classe_id: string;
  matiere_id: string;
  libelle: string;
  description: string | null;
  lecons: LeconProgrammeEtablissementApi[];
}

export interface PedagogieEtablissementApi {
  matieres: MatiereEtablissementApi[];
  classes_matieres: ClasseMatiereEtablissementApi[];
  programmes: ProgrammeEtablissementApi[];
  message?: string;
}

export interface EmploiTempsEtablissementApi {
  version_id: string | null;
  salle_id: string | null;
  creneaux: Array<{
    heure_debut: string;
    heure_fin: string;
    cellules: Array<{
      jour_semaine: number;
      est_pause: boolean;
      matiere_id: string | null;
      matiere_libelle: string | null;
      enseignant_id: string | null;
      enseignant_nom: string | null;
      salle_id: string | null;
    }>;
  }>;
}

export interface SeanceEtablissementApi {
  id: string;
  classe_id: string;
  salle_id: string | null;
  date_seance: string;
  heure_debut: string;
  heure_fin: string;
  statut: 'planifiee' | 'a_completer' | 'terminee';
  matiere_id: string | null;
  matiere_libelle: string | null;
  enseignant_id: string | null;
  enseignant_nom: string | null;
  cahier_texte: string | null;
  lecon_id: string | null;
  lecon_libelle: string | null;
}

export interface EvaluationEtablissementApi {
  id: string; classe_id: string; titre: string; type: string; bareme: number | string; date_evaluation: string;
  statut: string; periode: string | null; domaine_evaluation: string | null; composante_evaluation: string | null;
  enseignant_id: string | null; enseignant_nom: string | null;
  resultats: Array<{ eleve_id: string; note: number | string | null; appreciation: string | null; a_participe: boolean | number }>;
}

export type OperationInscriptionApi = 'inscription' | 'reinscription' | 'transfert';

export interface CandidatInscriptionApi {
  eleve_id: string;
  matricule: string;
  prenom: string;
  nom: string;
  sexe: 'F' | 'M' | null;
  date_naissance: string | null;
  tuteur_nom: string | null;
  tuteur_telephone: string | null;
  classe_source_id: string;
  classe_source: string;
  annee_source: string | null;
  statut: string;
}

export interface CandidatsInscriptionsApi {
  data: CandidatInscriptionApi[];
  classes_sources: Array<{ id: string; libelle: string; annee: string | null }>;
}

export interface FinancesEtablissementApi {
  annee_scolaire: { id: string; libelle: string; statut: string };
  periodes_mensuelles: Array<{ valeur: string; libelle: string }>;
  tarifications: {
    configurations: Array<{
      classe_id: string;
      registrationFee: number;
      monthlyFee: number;
    }>;
    frais_supplementaires: Array<{
      id: string;
      classe_id: string;
      libelle: string;
      montant: number;
      frequence: 'unique' | 'mensuel';
      obligatoire: boolean;
    }>;
  };
  echeances: Array<{
    id: string;
    eleve_id: string;
    tarif_scolaire_id: string;
    classe_id: string;
    code: string;
    frequence: 'unique' | 'mensuel';
    periode: string | null;
    montant_initial: number;
    montant_regle: number;
    statut: string;
    date_paiement: string | null;
  }>;
  types_depenses: Array<{
    id: string;
    backend_id: string;
    code: string;
    libelle: string;
    frequence: 'unique' | 'mensuel';
    cible: 'personnel' | 'enseignants' | 'tous';
    montant_provisoire: number;
    actif: boolean;
  }>;
  depenses: Array<{
    id: string;
    type_id: string;
    personnel_id: string | null;
    libelle: string;
    frequence: 'unique' | 'mensuel';
    montant: number;
    date: string;
    date_paiement: string | null;
    statut: 'Prévue' | 'Payée' | 'Brouillon';
    beneficiaire: string | null;
    notes: string | null;
  }>;
  paies: Array<{
    personnel_id: string;
    periode: string;
    nombre_heures: number;
    montant: number;
    date_paiement: string | null;
  }>;
  operations: Array<{
    id: string;
    montant: number;
    motif: string;
    sens: 'entree' | 'sortie';
    date: string;
    mode_paiement: string | null;
    tiers: string | null;
    reference: string | null;
    statut: 'validee' | 'en_attente' | 'annulee';
    source: string | null;
    notes: string | null;
  }>;
}

export interface TuteurEtablissementApi {
  id: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  telephone_secondaire: string | null;
  email: string | null;
  profession: string | null;
  adresse: string | null;
  statut_compte: string | null;
  nombre_enfants: number;
  lien_parente?: string | null;
}

export interface EleveEtablissementApi {
  id: string;
  matricule: string;
  prenom: string;
  nom: string;
  sexe: 'F' | 'M' | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  nationalite: string | null;
  adresse: string | null;
  groupe_sanguin: string | null;
  notes_medicales: string | null;
  regime: string | null;
  transport: boolean;
  cantine: boolean;
  statut: string;
  classe_id: string | null;
  tuteur: TuteurEtablissementApi | null;
  pieces_jointes?: string[];
}

export interface PersonnelEtablissementApi {
  id: string;
  /** Identifiant du dossier enseignant, distinct de l'identifiant personnel. */
  enseignant_id?: string | null;
  matricule: string;
  prenom: string;
  nom: string;
  sexe: 'F' | 'M' | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  fonction: string | null;
  type_contrat: string | null;
  date_embauche: string | null;
  contact_urgence_nom: string | null;
  contact_urgence_telephone: string | null;
  statut: string;
  statut_compte: string | null;
  type_remuneration: 'mensuelle' | 'horaire' | null;
  montant_mensuel: number | string | null;
  montant_heure: number | string | null;
  specialite?: string | null;
  diplome?: string | null;
  experience_annees?: number | null;
  pieces_jointes?: string[];
}

export interface DossiersEtablissementApi {
  eleves: EleveEtablissementApi[];
  tuteurs: TuteurEtablissementApi[];
  enseignants: PersonnelEtablissementApi[];
  personnels: PersonnelEtablissementApi[];
}

@Injectable({ providedIn: 'root' })
export class CentralApiService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'escolarite_centrale_token';
  private readonly userKey = 'escolarite_centrale_user';
  private readonly institutKey = 'escolarite_institut';
  private readonly souscriptionValideeKey = 'escolarite_souscription_validee';
  private readonly fonctionnalitesActivesKey = 'escolarite_fonctionnalites_actives';
  private readonly expirationKey = 'escolarite_session_expire_at';
  private readonly baseUrl = environment.apiUrl;
  private readonly campusInstitutState = signal<CampusInstitut[]>([]);
  private readonly etablissementsInstitutState = signal<Array<Omit<TypeSouscription, 'fonctionnalites'>>>([]);
  private readonly espaceInstitutChargeState = signal(false);
  private readonly cacheRequetes = new Map<string, { expireAt: number; valeur: Observable<unknown> }>();
  readonly campusInstitut = this.campusInstitutState.asReadonly();
  readonly etablissementsInstitut = this.etablissementsInstitutState.asReadonly();
  readonly espaceInstitutCharge = this.espaceInstitutChargeState.asReadonly();
  private expirationTimer: number | null = null;

  constructor() {
    window.addEventListener('escolarite-session-effacee', () => this.reinitialiserEtatSession());
    this.planifierExpirationSession();
  }

  connexion(email: string, password: string, institutId?: string) {
    return this.http
      .post<{ token: string; expire_at: string; user: CentralUser; espace: 'centrale' | 'institut'; institut?: InstitutConnexion; souscription_validee?: boolean; fonctionnalites_actives?: string[] }>(`${this.baseUrl}/connexion`, {
        email,
        password,
        institut_id: institutId || null,
        nom_appareil: navigator.userAgent.slice(0, 120),
      })
      .pipe(tap((result) => {
        this.invaliderCache();
        this.enregistrerSession(
        result.token,
        result.user,
        result.institut,
        result.souscription_validee,
        result.fonctionnalites_actives,
        result.expire_at,
      );
      }));
  }

  institutsConnexion() {
    return this.lireAvecCache('public:instituts-connexion', () =>
      this.http.get<{ data: InstitutConnexion[] }>(`${this.baseUrl}/instituts-connexion`),
      5 * 60_000,
    );
  }

  envoyerAdhesion(donnees: Record<string, unknown>) {
    return this.http.post<{ message: string; demande_id: string }>(`${this.baseUrl}/adhesions`, donnees);
  }

  tableauBord() {
    return this.lireAvecCache('centrale:tableau-bord', () => this.http.get<{ instituts_actifs: number; adhesions_en_attente: number; essais_en_cours: number; revenu_mensuel: number }>(
      `${this.baseUrl}/centrale/tableau-bord`,
      { headers: this.enteteAutorisation() },
    ));
  }

  demandesAdhesion() {
    return this.lireAvecCache('centrale:demandes-adhesion', () => this.http.get<{ data: DemandeAdhesion[] }>(`${this.baseUrl}/centrale/demandes-adhesion`, {
      headers: this.enteteAutorisation(),
    }));
  }

  approuverDemande(id: string) {
    this.invaliderCache('centrale:');
    return this.http.post<{ message: string; demande: DemandeAdhesion }>(
      `${this.baseUrl}/centrale/demandes-adhesion/${id}/approuver`,
      {},
      { headers: this.enteteAutorisation() },
    );
  }

  catalogueFonctionnalites() {
    return this.lireAvecCache('centrale:catalogue-fonctionnalites', () => this.http.get<{ types: TypeEtablissementCatalogue[]; data: TarificationFonctionnalite[] }>(`${this.baseUrl}/centrale/catalogue-fonctionnalites`, {
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerTarificationFonctionnalite(id: string, prixMensuel: number, actif: boolean) {
    this.invaliderCache('centrale:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/centrale/catalogue-fonctionnalites/${id}`, {
      prix_mensuel: prixMensuel,
      actif,
    }, { headers: this.enteteAutorisation() });
  }

  anneesScolairesCentrales() {
    return this.lireAvecCache('centrale:annees-scolaires', () => this.http.get<{ data: AnneeScolaireCentrale[] }>(`${this.baseUrl}/centrale/annees-scolaires`, {
      headers: this.enteteAutorisation(),
    }));
  }

  creerAnneeScolaireCentrale(libelle: string, estCourante: boolean) {
    this.invaliderCache('centrale:');
    return this.http.post<{ data: AnneeScolaireCentrale }>(`${this.baseUrl}/centrale/annees-scolaires`, {
      libelle,
      est_courante: estCourante,
    }, { headers: this.enteteAutorisation() });
  }

  mettreAJourAnneeScolaireCentrale(annee: AnneeScolaireCentrale) {
    this.invaliderCache('centrale:');
    return this.http.put<{ data: AnneeScolaireCentrale }>(`${this.baseUrl}/centrale/annees-scolaires/${annee.id}`, {
      libelle: annee.libelle,
      statut: annee.statut,
      est_courante: annee.est_courante,
    }, { headers: this.enteteAutorisation() });
  }

  espaceInstitut() {
    return this.lireAvecCache('institut:espace', () => this.http.get<EspaceInstitut>(`${this.baseUrl}/institut/espace`, { headers: this.enteteAutorisation() })).pipe(
      tap((espace) => {
        this.campusInstitutState.set(espace.campus ?? []);
        this.etablissementsInstitutState.set(espace.etablissements ?? []);
        this.espaceInstitutChargeState.set(true);
      }),
    );
  }

  listerCampusInstitut() {
    return this.lireAvecCache('institut:campus', () => this.http.get<{ data: CampusInstitut[] }>(`${this.baseUrl}/institut/campus`, {
      headers: this.enteteAutorisation(),
    })).pipe(tap((resultat) => this.campusInstitutState.set(resultat.data)));
  }

  creerCampusInstitut(donnees: { nom: string; adresse: string; telephone?: string }) {
    this.invaliderCache('institut:');
    return this.http.post<{ message: string; data: CampusInstitut }>(`${this.baseUrl}/institut/campus`, donnees, {
      headers: this.enteteAutorisation(),
    }).pipe(tap((resultat) => this.campusInstitutState.update((campus) => [...campus, resultat.data]
      .sort((a, b) => a.nom.localeCompare(b.nom)))));
  }

  mettreAJourCampusInstitut(campusId: string, donnees: { nom: string; adresse: string; telephone?: string }) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string; data: CampusInstitut }>(`${this.baseUrl}/institut/campus/${campusId}`, {
      nom: donnees.nom,
      adresse: donnees.adresse,
      telephone: donnees.telephone || null,
    }, { headers: this.enteteAutorisation() }).pipe(
      tap((resultat) => this.campusInstitutState.update((campusInstitut) => campusInstitut
        .map((item) => item.id === resultat.data.id ? resultat.data : item)
        .sort((a, b) => a.nom.localeCompare(b.nom)))),
    );
  }

  sallesInstitut(campusId?: string) {
    const cle = `institut:salles:${campusId ?? 'tous'}`;
    return this.lireAvecCache(cle, () => this.http.get<{ data: SalleInstitut[] }>(`${this.baseUrl}/institut/salles`, {
      params: campusId ? { campus_id: campusId } : {},
      headers: this.enteteAutorisation(),
    }));
  }

  creerSalleInstitut(donnees: SalleInstitutPayload) {
    this.invaliderCache('institut:salles:');
    this.invaliderCache('institut:espace');
    this.invaliderCache('institut:campus');
    return this.http.post<{ message: string; data: SalleInstitut }>(`${this.baseUrl}/institut/salles`, donnees, {
      headers: this.enteteAutorisation(),
    });
  }

  mettreAJourSalleInstitut(salleId: string, donnees: SalleInstitutPayload) {
    this.invaliderCache('institut:salles:');
    this.invaliderCache('institut:espace');
    this.invaliderCache('institut:campus');
    return this.http.put<{ message: string; data: SalleInstitut }>(`${this.baseUrl}/institut/salles/${salleId}`, donnees, {
      headers: this.enteteAutorisation(),
    });
  }

  supprimerSalleInstitut(salleId: string) {
    this.invaliderCache('institut:salles:');
    this.invaliderCache('institut:espace');
    this.invaliderCache('institut:campus');
    return this.http.delete<{ message: string }>(`${this.baseUrl}/institut/salles/${salleId}`, {
      headers: this.enteteAutorisation(),
    });
  }

  souscriptionInstitut() {
    return this.lireAvecCache('institut:souscription', () =>
      this.http.get<SouscriptionInstitut>(`${this.baseUrl}/institut/souscription`, { headers: this.enteteAutorisation() }),
    );
  }

  enregistrerSouscriptionInstitut(fonctionnalitesTypesIds: string[]) {
    this.invaliderCache('institut:');
    return this.http.put<SouscriptionInstitut>(
      `${this.baseUrl}/institut/souscription`,
      { fonctionnalites_types_ids: fonctionnalitesTypesIds },
      { headers: this.enteteAutorisation() },
    );
  }

  validerSouscriptionInstitut() {
    this.invaliderCache('institut:');
    return this.http.post<SouscriptionInstitut>(
      `${this.baseUrl}/institut/souscription/valider`,
      {},
      { headers: this.enteteAutorisation() },
    );
  }

  anneesScolairesInstitut(typeEtablissement: string) {
    return this.lireAvecCache(`institut:annees:${typeEtablissement}`, () => this.http.get<{ data: AnneeScolaireInstitut[] }>(`${this.baseUrl}/institut/annees-scolaires`, {
      params: { type_etablissement: typeEtablissement },
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerAnneeScolaireEtablissement(
    anneeCentraleId: string,
    typeEtablissement: string,
    dateDebut: string,
    dateFin: string,
    estCourante: boolean,
    niveaux: Array<{ id: string | number; code: string; libelle: string }>,
    periodes: Array<{ libelle: string; date_debut: string; date_fin: string }>,
  ) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(
      `${this.baseUrl}/institut/annees-scolaires/${anneeCentraleId}/etablissements/${typeEtablissement}`,
      {
        date_debut: dateDebut,
        date_fin: dateFin,
        est_courante: estCourante,
        niveaux,
        periodes,
      },
      { headers: this.enteteAutorisation() },
    );
  }

  parametresScolariteEtablissement(anneeCentraleId: string, typeEtablissement: string) {
    return this.lireAvecCache(`institut:parametres:${typeEtablissement}:${anneeCentraleId}`, () => this.http.get<ParametresScolariteEtablissement>(
      `${this.baseUrl}/institut/parametres-scolarite/${anneeCentraleId}/etablissements/${typeEtablissement}`,
      { headers: this.enteteAutorisation() },
    ));
  }

  seriesLyceeEtablissement() {
    return this.lireAvecCache('institut:series-lycee', () => this.http.get<{ data: SerieLyceeEtablissementApi[] }>(
      `${this.baseUrl}/institut/series-lycee`,
      { params: { type_etablissement: 'lycee' }, headers: this.enteteAutorisation() },
    ));
  }

  enregistrerSerieLyceeEtablissement(
    donnees: SerieLyceeEtablissementPayload,
    serieId?: string | null,
  ) {
    this.invaliderCache('institut:series-lycee');
    const url = serieId
      ? `${this.baseUrl}/institut/series-lycee/${serieId}`
      : `${this.baseUrl}/institut/series-lycee`;
    const requete = { type_etablissement: 'lycee', ...donnees };
    return serieId
      ? this.http.put<{ message: string; data: SerieLyceeEtablissementApi }>(url, requete, { headers: this.enteteAutorisation() })
      : this.http.post<{ message: string; data: SerieLyceeEtablissementApi }>(url, requete, { headers: this.enteteAutorisation() });
  }

  supprimerSerieLyceeEtablissement(serieId: string) {
    this.invaliderCache('institut:series-lycee');
    return this.http.delete<{ message: string }>(`${this.baseUrl}/institut/series-lycee/${serieId}`, {
      params: { type_etablissement: 'lycee' },
      headers: this.enteteAutorisation(),
    });
  }

  classesEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string) {
    return this.lireAvecCache(`institut:classes:${typeEtablissement}:${campusId}:${anneeCentraleId}`, () => this.http.get<{ data: ClasseEtablissementApi[] }>(`${this.baseUrl}/institut/classes`, {
      params: {
        type_etablissement: typeEtablissement,
        campus_id: campusId,
        annee_scolaire_centrale_id: anneeCentraleId,
      },
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerClassesEtablissement(
    typeEtablissement: string,
    campusId: string,
    anneeCentraleId: string,
    classes: ClasseEtablissementPayload[],
  ) {
    this.invaliderCache('institut:');
    return this.http.post<{ data: ClasseEtablissementApi[] }>(`${this.baseUrl}/institut/classes/enregistrer`, {
      type_etablissement: typeEtablissement,
      campus_id: campusId,
      annee_scolaire_centrale_id: anneeCentraleId,
      classes,
    }, { headers: this.enteteAutorisation() });
  }

  pedagogieEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string) {
    return this.lireAvecCache(`institut:pedagogie:${typeEtablissement}:${campusId}:${anneeCentraleId}`, () =>
      this.http.get<PedagogieEtablissementApi>(`${this.baseUrl}/institut/pedagogie`, {
        params: {
          type_etablissement: typeEtablissement,
          campus_id: campusId,
          annee_scolaire_centrale_id: anneeCentraleId,
        },
        headers: this.enteteAutorisation(),
      }),
    );
  }

  enregistrerCatalogueMatieresEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.put<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/matieres/catalogue`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  enregistrerMatiereEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.post<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/matieres`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  enregistrerMatieresClasseEtablissement(classeId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.put<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/classes/${classeId}/matieres`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  ajouterLeconEtablissement(classeId: string, matiereId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.post<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/classes/${classeId}/matieres/${matiereId}/lecons`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  enregistrerAvancementLeconEtablissement(leconId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.put<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/lecons/${leconId}/avancement`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  supprimerLeconEtablissement(
    leconId: string,
    typeEtablissement: string,
    campusId: string,
    anneeCentraleId: string,
  ) {
    this.invaliderCache('institut:pedagogie:');
    return this.http.delete<PedagogieEtablissementApi>(
      `${this.baseUrl}/institut/pedagogie/lecons/${leconId}`,
      {
        params: {
          type_etablissement: typeEtablissement,
          campus_id: campusId,
          annee_scolaire_centrale_id: anneeCentraleId,
        },
        headers: this.enteteAutorisation(),
      },
    );
  }

  emploiTempsEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string, classeId: string) {
    return this.lireAvecCache(`institut:emploi-temps:${typeEtablissement}:${campusId}:${anneeCentraleId}:${classeId}`, () => this.http.get<{ data: EmploiTempsEtablissementApi }>(
      `${this.baseUrl}/institut/emplois-temps`,
      {
        params: {
          type_etablissement: typeEtablissement,
          campus_id: campusId,
          annee_scolaire_centrale_id: anneeCentraleId,
          classe_id: classeId,
        },
        headers: this.enteteAutorisation(),
      },
    ));
  }

  enregistrerEmploiTempsEtablissement(classeId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:emploi-temps:');
    return this.http.put<{ message: string; data: EmploiTempsEtablissementApi }>(
      `${this.baseUrl}/institut/emplois-temps/classes/${classeId}`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  seancesEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string, classeId: string) {
    return this.lireAvecCache(`institut:seances:${typeEtablissement}:${campusId}:${anneeCentraleId}:${classeId}`, () => this.http.get<{ data: SeanceEtablissementApi[] }>(
      `${this.baseUrl}/institut/seances`,
      {
        params: {
          type_etablissement: typeEtablissement,
          campus_id: campusId,
          annee_scolaire_centrale_id: anneeCentraleId,
          classe_id: classeId,
        },
        headers: this.enteteAutorisation(),
      },
    ));
  }

  genererSeancesEtablissement(classeId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:seances:');
    return this.http.post<{ message: string; crees: number; data: SeanceEtablissementApi[] }>(
      `${this.baseUrl}/institut/seances/classes/${classeId}/generer`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  evaluationsEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string, classeId: string) {
    return this.lireAvecCache(`institut:evaluations:${typeEtablissement}:${campusId}:${anneeCentraleId}:${classeId}`, () => this.http.get<{ data: EvaluationEtablissementApi[] }>(`${this.baseUrl}/institut/evaluations`, {
      params: { type_etablissement: typeEtablissement, campus_id: campusId, annee_scolaire_centrale_id: anneeCentraleId, classe_id: classeId }, headers: this.enteteAutorisation(),
    }));
  }

  creerEvaluationEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:evaluations:');
    return this.http.post<{ message: string; data: EvaluationEtablissementApi[] }>(`${this.baseUrl}/institut/evaluations`, donnees, { headers: this.enteteAutorisation() });
  }

  enregistrerResultatsEvaluation(evaluationId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:evaluations:');
    return this.http.put<{ message: string; data: EvaluationEtablissementApi[] }>(`${this.baseUrl}/institut/evaluations/${evaluationId}/resultats`, donnees, { headers: this.enteteAutorisation() });
  }

  candidatsInscriptionsEtablissement(
    typeEtablissement: string,
    campusId: string,
    anneeCentraleId: string,
    operation: OperationInscriptionApi,
  ) {
    return this.lireAvecCache(`institut:inscriptions:${typeEtablissement}:${campusId}:${anneeCentraleId}:${operation}`, () => this.http.get<CandidatsInscriptionsApi>(`${this.baseUrl}/institut/inscriptions/candidats`, {
      params: {
        type_etablissement: typeEtablissement,
        campus_id: campusId,
        annee_scolaire_centrale_id: anneeCentraleId,
        operation,
      },
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerInscriptionsEtablissement(donnees: {
    type_etablissement: string;
    campus_id: string;
    annee_scolaire_centrale_id: string;
    operation: OperationInscriptionApi;
    classe_source_id: string | null;
    classe_cible_id: string;
    eleve_ids: string[];
  }) {
    this.invaliderCache('institut:');
    return this.http.post<{ message: string; traites: number }>(
      `${this.baseUrl}/institut/inscriptions`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  financesEtablissement(typeEtablissement: string, campusId: string, anneeCentraleId: string) {
    return this.lireAvecCache(`institut:finances:${typeEtablissement}:${campusId}:${anneeCentraleId}`, () => this.http.get<FinancesEtablissementApi>(`${this.baseUrl}/institut/finances`, {
      params: { type_etablissement: typeEtablissement, campus_id: campusId, annee_scolaire_centrale_id: anneeCentraleId },
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerTarificationsEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/institut/finances/tarifications`, donnees, { headers: this.enteteAutorisation() });
  }

  ajouterFraisEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<{ message: string; id: string }>(`${this.baseUrl}/institut/finances/tarifications/frais`, donnees, { headers: this.enteteAutorisation() });
  }

  supprimerFraisEtablissement(id: string, typeEtablissement: string, campusId: string, anneeCentraleId: string) {
    this.invaliderCache('institut:');
    return this.http.delete<{ message: string }>(`${this.baseUrl}/institut/finances/tarifications/frais/${id}`, {
      params: { type_etablissement: typeEtablissement, campus_id: campusId, annee_scolaire_centrale_id: anneeCentraleId },
      headers: this.enteteAutorisation(),
    });
  }

  basculerEncaissementEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/institut/finances/encaissements`, donnees, { headers: this.enteteAutorisation() });
  }

  enregistrerTypeDepenseEtablissement(donnees: Record<string, unknown>, id?: string) {
    this.invaliderCache('institut:');
    const url = id ? `${this.baseUrl}/institut/finances/types-depenses/${id}` : `${this.baseUrl}/institut/finances/types-depenses`;
    return id
      ? this.http.put<{ message: string; id: string }>(url, donnees, { headers: this.enteteAutorisation() })
      : this.http.post<{ message: string; id: string }>(url, donnees, { headers: this.enteteAutorisation() });
  }

  supprimerTypeDepenseEtablissement(id: string, typeEtablissement: string, campusId: string) {
    this.invaliderCache('institut:');
    return this.http.delete<{ message: string }>(`${this.baseUrl}/institut/finances/types-depenses/${id}`, {
      params: { type_etablissement: typeEtablissement, campus_id: campusId }, headers: this.enteteAutorisation(),
    });
  }

  enregistrerDepenseEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<{ message: string; id: string }>(`${this.baseUrl}/institut/finances/depenses`, donnees, { headers: this.enteteAutorisation() });
  }

  basculerDepenseEtablissement(id: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/institut/finances/depenses/${id}/paiement`, donnees, { headers: this.enteteAutorisation() });
  }

  basculerPaieEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/institut/finances/paies`, donnees, { headers: this.enteteAutorisation() });
  }

  enregistrerOperationFinanciereEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<{ message: string; id: string }>(`${this.baseUrl}/institut/finances/operations`, donnees, { headers: this.enteteAutorisation() });
  }

  basculerOperationFinanciereEtablissement(id: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<{ message: string }>(`${this.baseUrl}/institut/finances/operations/${id}`, donnees, { headers: this.enteteAutorisation() });
  }

  dossiersEtablissement(typeEtablissement: string, campusId: string) {
    return this.lireAvecCache(`institut:dossiers:${typeEtablissement}:${campusId}`, () => this.http.get<DossiersEtablissementApi>(`${this.baseUrl}/institut/dossiers`, {
      params: { type_etablissement: typeEtablissement, campus_id: campusId },
      headers: this.enteteAutorisation(),
    }));
  }

  enregistrerEleveEtablissement(donnees: Record<string, unknown> | FormData) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & { message: string; eleve_id: string }>(
      `${this.baseUrl}/institut/eleves`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  importerElevesEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & {
      message: string;
      importes: number;
      tuteurs_lies: number;
      tuteurs_a_completer: number;
      tuteurs_crees: number;
      tuteurs_reutilises: number;
    }>(`${this.baseUrl}/institut/eleves/importer`, donnees, { headers: this.enteteAutorisation() });
  }

  enregistrerTuteurEtablissement(tuteurId: string, donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.put<DossiersEtablissementApi & { message: string }>(
      `${this.baseUrl}/institut/tuteurs/${tuteurId}`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  enregistrerEnseignantEtablissement(donnees: Record<string, unknown> | FormData) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & { message: string; personnel_id: string }>(
      `${this.baseUrl}/institut/enseignants`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  importerEnseignantsEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & { message: string; importes: number; crees: number; reutilises: number }>(
      `${this.baseUrl}/institut/enseignants/importer`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  enregistrerPersonnelEtablissement(donnees: Record<string, unknown> | FormData) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & { message: string; personnel_id: string }>(
      `${this.baseUrl}/institut/personnels`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  importerPersonnelsEtablissement(donnees: Record<string, unknown>) {
    this.invaliderCache('institut:');
    return this.http.post<DossiersEtablissementApi & { message: string; importes: number; crees: number; reutilises: number }>(
      `${this.baseUrl}/institut/personnels/importer`,
      donnees,
      { headers: this.enteteAutorisation() },
    );
  }

  utilisateur(): CentralUser | null {
    const valeur = localStorage.getItem(this.userKey);
    return valeur ? (JSON.parse(valeur) as CentralUser) : null;
  }

  institutActuel(): InstitutConnexion | null {
    const valeur = localStorage.getItem(this.institutKey);
    return valeur ? (JSON.parse(valeur) as InstitutConnexion) : null;
  }

  souscriptionValidee(): boolean {
    return localStorage.getItem(this.souscriptionValideeKey) === 'true';
  }

  fonctionnalitesActives(): string[] {
    const valeur = localStorage.getItem(this.fonctionnalitesActivesKey);
    return valeur ? JSON.parse(valeur) as string[] : [];
  }

  actualiserAccesSouscription(validee: boolean, fonctionnalites: string[]): void {
    localStorage.setItem(this.souscriptionValideeKey, String(validee));
    localStorage.setItem(this.fonctionnalitesActivesKey, JSON.stringify(fonctionnalites));
  }

  estConnecte(): boolean {
    return Boolean(localStorage.getItem(this.tokenKey));
  }

  deconnexion() {
    return this.http.post(`${this.baseUrl}/centrale/deconnexion`, {}, { headers: this.enteteAutorisation() }).pipe(
      tap(() => this.effacerSession()),
    );
  }

  effacerSession(): void {
    effacerSessionApiLocale();
  }

  private enregistrerSession(
    token: string,
    user: CentralUser,
    institut?: InstitutConnexion,
    souscriptionValidee = false,
    fonctionnalitesActives: string[] = [],
    expireAt?: string,
  ): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    if (institut) localStorage.setItem(this.institutKey, JSON.stringify(institut));
    else localStorage.removeItem(this.institutKey);
    this.actualiserAccesSouscription(souscriptionValidee, fonctionnalitesActives);
    if (expireAt) localStorage.setItem(this.expirationKey, expireAt);
    else localStorage.removeItem(this.expirationKey);
    this.planifierExpirationSession();
  }

  private planifierExpirationSession(): void {
    if (this.expirationTimer !== null) {
      window.clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    if (!localStorage.getItem(this.tokenKey)) return;
    const expiration = Date.parse(localStorage.getItem(this.expirationKey) ?? '');
    if (!Number.isFinite(expiration)) return;
    const delai = expiration - Date.now();
    if (delai <= 0) {
      this.terminerSessionExpiree();
      return;
    }
    this.expirationTimer = window.setTimeout(() => this.terminerSessionExpiree(), delai);
  }

  private terminerSessionExpiree(): void {
    this.effacerSession();
    void this.router.navigate(['/connexion'], {
      queryParams: { session: 'expiree' },
      replaceUrl: true,
    });
  }

  /**
   * Mémorise brièvement les lectures API. Le cache est uniquement en mémoire
   * (jamais dans le navigateur) et est donc vidé à la déconnexion.
   */
  private lireAvecCache<T>(cle: string, requete: () => Observable<T>, dureeMs = 120_000): Observable<T> {
    const existant = this.cacheRequetes.get(cle);
    if (existant && existant.expireAt > Date.now()) {
      return existant.valeur as Observable<T>;
    }

    const valeur = defer(requete).pipe(
      catchError((erreur) => {
        this.cacheRequetes.delete(cle);
        return throwError(() => erreur);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cacheRequetes.set(cle, { expireAt: Date.now() + dureeMs, valeur });
    return valeur;
  }

  /** Invalidation ciblée utilisée après une écriture ou une actualisation manuelle. */
  invaliderCache(prefixe = ''): void {
    for (const cle of this.cacheRequetes.keys()) {
      if (!prefixe || cle.startsWith(prefixe)) this.cacheRequetes.delete(cle);
    }
  }

  private reinitialiserEtatSession(): void {
    if (this.expirationTimer !== null) {
      window.clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.campusInstitutState.set([]);
    this.etablissementsInstitutState.set([]);
    this.espaceInstitutChargeState.set(false);
    this.invaliderCache();
  }

  private enteteAutorisation(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem(this.tokenKey) ?? ''}` });
  }
}
