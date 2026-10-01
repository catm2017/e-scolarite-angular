import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CentralApiService, ClasseMatiereEnseignantApi, ContexteEnseignant, EspaceEnseignantApi, EvaluationEnseignantDetailApi, SeanceEnseignantDetailApi, SuiviCoranDaaraApi } from '../central-api.service';
import { ColumnDefinition, MasterTableComponent } from '../../shared/components/master-table/master-table.component';
import { QuranFollowupComponent } from '../daara/quran-followup.component';
import { QuranLessonsComponent } from '../daara/quran-lessons.component';

type VueEnseignant = 'espaces' | 'tableau-de-bord' | 'emploi-du-temps' | 'pointage' | 'eleves' | 'eleve-dossier' | 'classes' | 'classe-matiere' | 'programmes' | 'seances' | 'seance-detail' | 'evaluations' | 'evaluation-detail' | 'quran-followup' | 'quran-lesson-history' | 'quran-mouradja' | 'dossier';
type OngletDossier = 'profil' | 'enseignements' | 'emploi-temps' | 'remuneration';
type TypeEvaluation = 'devoir' | 'controle' | 'essai' | 'formative' | 'composition';
type PointageAvecHeures = { date_pointage: string; heure_entree_at: string | null; heure_sortie_at: string | null };

@Component({
  selector: 'app-teacher-space',
  standalone: true,
  imports: [DatePipe, FormsModule, MasterTableComponent, QuranFollowupComponent, QuranLessonsComponent],
  templateUrl: './teacher-space.component.html',
  styleUrl: './teacher-space.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherSpaceComponent implements OnInit, OnDestroy {
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly vue = signal<VueEnseignant>('tableau-de-bord');
  readonly dossierTab = signal<OngletDossier>('profil');
  readonly espace = signal<EspaceEnseignantApi | null>(null);
  readonly affectationsSource = new MatTableDataSource<any>([]);
  readonly seancesSource = new MatTableDataSource<any>([]);
  readonly evaluationsSource = new MatTableDataSource<any>([]);
  readonly elevesClasseSource = new MatTableDataSource<any>([]);
  readonly sessionStudentsSource = new MatTableDataSource<any>([]);
  readonly groupeStudentsSource = new MatTableDataSource<any>([]);
  readonly groupeActif = signal('tous');
  readonly eleveDossierId = signal<string | null>(null);
  readonly eleveDossierLoading = signal(false);
  readonly eleveDossierError = signal<string | null>(null);
  readonly eleveDossierLeconsSource = new MatTableDataSource<any>([]);
  readonly eleveDossierRevisionsSource = new MatTableDataSource<any>([]);
  readonly eleveDossierStudent = computed(() => (this.espace()?.eleves_groupes ?? []).find((eleve) => eleve.id === this.eleveDossierId()) ?? null);
  readonly eleveDossierSelectedLesson = signal<any | null>(null);
  readonly eleveDossierReader = signal<SuiviCoranDaaraApi | null>(null);
  readonly eleveDossierVersets = computed(() => {
    const lesson = this.eleveDossierSelectedLesson();
    const verses = this.eleveDossierReader()?.versets ?? [];
    if (!lesson) return [];
    return verses.filter((verse) => verse.position_memorisation >= lesson.debut.position_memorisation && verse.position_memorisation <= lesson.fin.position_memorisation);
  });
  readonly classeMatiere = signal<ClasseMatiereEnseignantApi | null>(null);
  readonly chargementClasseMatiere = signal(false);
  readonly erreurClasseMatiere = signal<string | null>(null);
  readonly afficherAjoutLecon = signal(false);
  readonly enregistrementLecon = signal(false);
  readonly formulaireLecon = signal({ libelle: '', objectifs: '', periode: '', nombre_seances_estime: 1 });
  readonly seanceDetail = signal<SeanceEnseignantDetailApi | null>(null);
  readonly chargementSeance = signal(false);
  readonly enregistrementSeance = signal(false);
  readonly erreurSeance = signal<string | null>(null);
  readonly televersementPieceSeance = signal(false);
  readonly cahierSeance = signal({ contenu: '', travailMaison: '', leconId: '' });
  readonly presencesSeance = signal<Record<string, string>>({});
  readonly afficherCreationEvaluation = signal(false);
  readonly enregistrementEvaluation = signal(false);
  readonly erreurEvaluation = signal<string | null>(null);
  readonly formulaireEvaluation = signal<{ titre: string; date: string; periode: string; type: TypeEvaluation; classeMatiereId: string; bareme: number }>({
    titre: '', date: '', periode: '', type: 'controle', classeMatiereId: '', bareme: 20,
  });
  readonly evaluationDetail = signal<EvaluationEnseignantDetailApi | null>(null);
  readonly chargementEvaluationDetail = signal(false);
  readonly enregistrementResultats = signal(false);
  readonly erreurEvaluationDetail = signal<string | null>(null);
  readonly evaluationResultsSource = new MatTableDataSource<any>([]);
  readonly pointageJeton = signal('');
  readonly pointageEnvoi = signal(false);
  readonly pointageMessage = signal<string | null>(null);
  readonly pointageErreur = signal<string | null>(null);
  readonly pointageScannerActif = signal(false);
  readonly pointageScannerErreur = signal<string | null>(null);
  readonly sortieDisponibleDansSecondes = signal(0);
  @ViewChild('pointageVideo') private pointageVideo?: ElementRef<HTMLVideoElement>;
  private pointageFlux: MediaStream | null = null;
  private pointageScanTimer: number | null = null;
  private sortieTimer: number | null = null;

  readonly menu: Array<{ id: VueEnseignant; label: string; icon: string }> = [
    { id: 'espaces', label: 'Mes espaces de travail', icon: 'domain' },
    { id: 'tableau-de-bord', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'emploi-du-temps', label: 'Mon emploi du temps', icon: 'calendar_month' },
    { id: 'pointage', label: 'Mon pointage', icon: 'qr_code_scanner' },
    { id: 'eleves', label: 'Élèves de mes groupes', icon: 'groups' },
    { id: 'classes', label: 'Mes classes & matières', icon: 'groups' },
    { id: 'seances', label: 'Séances & cahier de texte', icon: 'event_note' },
    { id: 'evaluations', label: 'Évaluations', icon: 'assignment_turned_in' },
    { id: 'quran-followup', label: 'Suivi du Coran', icon: 'menu_book' },
    { id: 'quran-lesson-history', label: 'Leçons coraniques', icon: 'history_edu' },
    { id: 'quran-mouradja', label: 'Révision coranique', icon: 'history' },
    { id: 'dossier', label: 'Mon dossier', icon: 'badge' },
  ];

  readonly affectationColumns: ColumnDefinition[] = [
    { def: 'classe', label: 'Classe', type: 'text' }, { def: 'matiere', label: 'Matière', type: 'text' },
    { def: 'effectif', label: 'Nombre d’élèves', type: 'number' },
    { def: 'actions', label: 'Actions', type: 'actionBtn', sortable: false },
  ];
  readonly elevesClasseColumns: ColumnDefinition[] = [
    { def: 'matricule', label: 'Matricule', type: 'text' },
    { def: 'name', label: 'Prénom et nom', type: 'nameWithImage' },
    { def: 'gender', label: 'Sexe', type: 'status', statusBadgeMap: { F: 'badge badge-solid-purple', M: 'badge badge-solid-green' } },
    { def: 'birthDate', label: 'Date de naissance', type: 'text' },
    { def: 'parentPhone', label: 'Téléphone tuteur', type: 'phone' },
    { def: 'status', label: 'Statut', type: 'status', statusBadgeMap: { Actif: 'badge badge-solid-green', 'En attente': 'badge badge-solid-orange' } },
  ];
  readonly eleveQuranColumns: ColumnDefinition[] = [
    { def: 'start', label: 'Début', type: 'text' },
    { def: 'end', label: 'Fin', type: 'text' },
    { def: 'sourates', label: 'Sourate(s)', type: 'text' },
    { def: 'statutLabel', label: 'Statut', type: 'status', statusBadgeMap: { 'À réciter': 'badge badge-solid-orange', 'Déjà récité': 'badge badge-solid-green' } },
    { def: 'assignedDate', label: 'Affectée le', type: 'date' },
    { def: 'completedDate', label: 'Récitée le', type: 'date' },
    { def: 'duration', label: 'Durée', type: 'text' },
  ];
  readonly sessionStudentColumns: ColumnDefinition[] = [
    { def: 'nom_complet', label: 'Élève', type: 'nameWithImage' },
    { def: 'matricule', label: 'Matricule', type: 'text' },
    { def: 'attendanceStatus', label: 'Appel', type: 'attendance', sortable: false },
  ];
  readonly seanceColumns: ColumnDefinition[] = [
    { def: 'reference', label: 'Référence', type: 'text' },
    { def: 'date_seance', label: 'Date', type: 'dateCard' }, { def: 'heure_debut', label: 'Horaire', type: 'time' },
    { def: 'classe', label: 'Classe', type: 'text' }, { def: 'matiere', label: 'Matière', type: 'text' },
    {
      def: 'statut', label: 'État', type: 'status',
      statusBadgeMap: {
        Planifiée: 'badge badge-solid-blue',
        'À compléter': 'badge badge-solid-orange',
        Effectuée: 'badge badge-solid-orange',
        Validée: 'badge badge-solid-green',
        Ratée: 'badge badge-solid-red',
      },
    },
  ];
  readonly evaluationColumns: ColumnDefinition[] = [
    { def: 'date_evaluation', label: 'Date', type: 'dateCard' }, { def: 'titre', label: 'Évaluation', type: 'text' },
    { def: 'classe', label: 'Classe', type: 'text' }, { def: 'bareme', label: 'Barème', type: 'number' },
    { def: 'statut', label: 'État', type: 'status', statusBadgeMap: { Brouillon: 'badge badge-solid-blue', 'À corriger': 'badge badge-solid-orange', Corrigée: 'badge badge-solid-green' } },
  ];
  readonly evaluationResultColumns: ColumnDefinition[] = [
    { def: 'nom_complet', label: 'Élève', type: 'nameWithImage' },
    { def: 'matricule', label: 'Matricule', type: 'text' },
    { def: 'participation', label: 'Participation', type: 'evaluationParticipation', sortable: false },
    { def: 'score', label: 'Note', type: 'evaluationScore', sortable: false },
    { def: 'appreciation', label: 'Appréciation', type: 'evaluationComment', sortable: false },
    { def: 'piece_jointe', label: 'Copie PDF', type: 'evaluationFile', sortable: false },
  ];

  readonly seancesAVenir = computed(() => [...(this.espace()?.seances ?? [])]
    .filter((seance) => !['realisee', 'terminee', 'ratee'].includes(seance.statut))
    .sort((a, b) => this.dateHeureSeance(a) - this.dateHeureSeance(b))
    .slice(0, 5));
  readonly seancesARenseigner = computed(() => (this.espace()?.seances ?? []).filter((seance) => !seance.cahier_texte).length);
  readonly groupesEleves = computed(() => [...new Map((this.espace()?.eleves_groupes ?? []).map((eleve) => [eleve.groupe, eleve.groupe])).values()]);
  readonly evaluationsACorriger = computed(() => (this.espace()?.evaluations ?? []).filter((evaluation) => evaluation.statut !== 'corrigee').length);
  readonly titreVue = computed(() => this.menu.find((item) => item.id === this.vue())?.label ?? 'Espace enseignant');
  readonly afficherEnteteVue = computed(() => !['quran-followup', 'quran-lesson-history', 'quran-mouradja'].includes(this.vue()));
  readonly estDaara = computed(() => this.contexteActif()?.type_code === 'daara');
  readonly contexteActif = computed(() => this.espace()?.contexte ?? this.api.contexteEnseignant());
  readonly periodesAcademiques = computed(() => {
    const type = `${this.contexteActif()?.type_code ?? ''} ${this.contexteActif()?.type ?? ''}`.toLowerCase();
    return type.includes('primaire') ? ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'] : ['Semestre 1', 'Semestre 2'];
  });
  readonly libellePeriodeEvaluation = computed(() => this.periodesAcademiques()[0]?.startsWith('Trimestre') ? 'Trimestre' : 'Semestre');
  readonly doitChoisirEspace = computed(() => (this.espace()?.rattachements.length ?? 0) > 1);
  readonly emploiTempsParCreneau = computed(() => {
    const jours = [1, 2, 3, 4, 5, 6];
    const lignes = this.espace()?.emploi_temps ?? [];
    const creneaux = new Map<string, { debut: string; fin: string; cellules: Map<number, typeof lignes[number]> }>();
    for (const ligne of lignes) {
      const key = `${ligne.heure_debut}-${ligne.heure_fin}`;
      if (!creneaux.has(key)) creneaux.set(key, { debut: ligne.heure_debut, fin: ligne.heure_fin, cellules: new Map() });
      creneaux.get(key)!.cellules.set(Number(ligne.jour_semaine), ligne);
    }
    return [...creneaux.values()].map((creneau) => ({ ...creneau, jours }));
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const requested = params.get('vue');
      if (requested === 'programmes') {
        void this.router.navigate(['/enseignant', 'classes'], { replaceUrl: true });
        return;
      }
      if (this.menu.some((item) => item.id === requested) || requested === 'eleve-dossier' || requested === 'classe-matiere' || requested === 'seance-detail' || requested === 'evaluation-detail') this.vue.set(requested as VueEnseignant);
      const classeMatiereId = this.route.snapshot.queryParamMap.get('classe_matiere');
      if (requested === 'classe-matiere' && classeMatiereId) this.chargerClasseMatiere(classeMatiereId);
      const seanceId = this.route.snapshot.queryParamMap.get('seance');
      if (requested === 'seance-detail' && seanceId) this.chargerSeance(seanceId);
      const evaluationId = this.route.snapshot.queryParamMap.get('evaluation');
      if (requested === 'evaluation-detail' && evaluationId) this.chargerDetailEvaluation(evaluationId);
      const eleveId = this.route.snapshot.queryParamMap.get('eleve');
      if (requested === 'eleve-dossier' && eleveId) this.eleveDossierId.set(eleveId);
      this.charger();
    });
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    const contexteMemorise = this.api.contexteEnseignant();
    this.api.espaceEnseignant(contexteMemorise).subscribe({
      next: ({ data }) => {
        this.espace.set(data);
        this.actualiserDelaiSortie(data.pointages);
        this.api.memoriserRattachementsEnseignant(data.rattachements);
        this.affectationsSource.data = data.affectations;
        this.groupeActif.set('tous');
        this.groupeStudentsSource.data = this.formaterElevesGroupes(data.eleves_groupes ?? []);
        if (this.vue() === 'eleve-dossier' && this.eleveDossierId()) this.chargerSuiviCoranEleve(this.eleveDossierId()!);
        this.seancesSource.data = [...data.seances]
          .sort((a, b) => this.dateHeureSeance(a) - this.dateHeureSeance(b))
          .map((seance) => ({ ...seance, statut: this.libelleStatutSeance(seance.statut) }));
        this.evaluationsSource.data = data.evaluations.map((evaluation) => ({ ...evaluation, statut: this.libelleStatutEvaluation(evaluation.statut) }));

        if (!contexteMemorise && data.rattachements.length === 1) {
          this.api.memoriserContexteEnseignant(data.contexte, data.rattachements);
        }
        if (contexteMemorise) {
          this.api.memoriserContexteEnseignant(data.contexte, data.rattachements);
        }
        if (!contexteMemorise && data.rattachements.length > 1 && this.vue() !== 'espaces') {
          void this.router.navigate(['/enseignant', 'espaces'], { replaceUrl: true });
          return;
        }
        if (data.rattachements.length === 1 && this.vue() === 'espaces') {
          void this.router.navigate(['/enseignant', 'tableau-de-bord'], { replaceUrl: true });
        }
      },
      error: (response) => this.erreur.set(response.error?.message ?? 'Votre espace enseignant est momentanément indisponible.'),
      complete: () => this.chargement.set(false),
    });
  }

  ouvrir(vue: VueEnseignant): void { this.router.navigate(['/enseignant', vue]); }
  private actualiserDelaiSortie(pointages: PointageAvecHeures[]): void {
    if (this.sortieTimer !== null) window.clearInterval(this.sortieTimer);
    const aujourdHui = this.dateLocale();
    const ouvert = pointages.find((pointage) => pointage.date_pointage === aujourdHui && pointage.heure_entree_at && !pointage.heure_sortie_at);
    if (!ouvert?.heure_entree_at) { this.sortieDisponibleDansSecondes.set(0); return; }
    const entree = new Date(ouvert.heure_entree_at.replace(' ', 'T')).getTime();
    const sortiePossibleAt = entree + 15 * 60 * 1000;
    const actualiser = (): void => {
      const secondes = Math.max(0, Math.ceil((sortiePossibleAt - Date.now()) / 1000));
      this.sortieDisponibleDansSecondes.set(secondes);
      if (secondes === 0 && this.sortieTimer !== null) { window.clearInterval(this.sortieTimer); this.sortieTimer = null; }
    };
    actualiser();
    if (this.sortieDisponibleDansSecondes() > 0) this.sortieTimer = window.setInterval(actualiser, 1000);
  }
  private dateLocale(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  formatCompteRebours(secondes: number): string {
    return `${String(Math.floor(secondes / 60)).padStart(2, '0')}:${String(secondes % 60).padStart(2, '0')}`;
  }
  enregistrerPointage(): void {
    const jeton = this.pointageJeton().trim();
    if (!jeton || this.pointageEnvoi()) return;
    this.pointageEnvoi.set(true); this.pointageMessage.set(null); this.pointageErreur.set(null);
    this.api.scannerPointage(jeton).subscribe({
      next: (result) => { this.pointageEnvoi.set(false); this.arreterScanner(); this.pointageJeton.set(''); this.pointageMessage.set(`${result.message} à ${result.heure} · ${result.borne}`); this.charger(); },
      error: (response) => { this.pointageEnvoi.set(false); this.pointageErreur.set(response.error?.message ?? 'Le pointage n’a pas pu être enregistré.'); },
    });
  }
  demarrerScanner(): void {
    this.pointageScannerErreur.set(null);
    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect(video: HTMLVideoElement): Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor || !navigator.mediaDevices?.getUserMedia) {
      this.pointageScannerErreur.set('La lecture QR automatique n’est pas prise en charge par ce navigateur. Utilisez un appareil ou un navigateur compatible.');
      return;
    }
    this.pointageScannerActif.set(true);
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then((flux) => {
        this.pointageFlux = flux;
        const video = this.pointageVideo?.nativeElement;
        if (!video) return;
        video.srcObject = flux;
        void video.play();
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        const lire = (): void => {
          if (!this.pointageScannerActif() || !this.pointageVideo?.nativeElement) return;
          detector.detect(this.pointageVideo.nativeElement).then((codes) => {
            const valeur = codes[0]?.rawValue?.trim();
            if (valeur) { this.pointageJeton.set(valeur); this.arreterScanner(); this.enregistrerPointage(); return; }
            this.pointageScanTimer = window.setTimeout(lire, 250);
          }).catch(() => { this.pointageScanTimer = window.setTimeout(lire, 500); });
        };
        lire();
      }).catch(() => { this.pointageScannerActif.set(false); this.pointageScannerErreur.set('La caméra n’a pas pu être ouverte. Vérifiez l’autorisation du navigateur.'); });
    });
  }
  arreterScanner(): void {
    this.pointageScannerActif.set(false);
    if (this.pointageScanTimer !== null) { window.clearTimeout(this.pointageScanTimer); this.pointageScanTimer = null; }
    this.pointageFlux?.getTracks().forEach((track) => track.stop());
    this.pointageFlux = null;
    if (this.pointageVideo?.nativeElement) this.pointageVideo.nativeElement.srcObject = null;
  }
  ngOnDestroy(): void { this.arreterScanner(); if (this.sortieTimer !== null) window.clearInterval(this.sortieTimer); }
  choisirGroupeEleves(groupe: string): void {
    this.groupeActif.set(groupe);
    const eleves = this.espace()?.eleves_groupes ?? [];
    this.groupeStudentsSource.data = this.formaterElevesGroupes(groupe === 'tous' ? eleves : eleves.filter((eleve) => eleve.groupe === groupe));
  }
  ouvrirDossierEleve(row: { id?: string }): void {
    const eleveId = row.id;
    const eleveAutorise = (this.espace()?.eleves_groupes ?? []).some((eleve) => eleve.id === eleveId);
    if (!eleveId || !eleveAutorise) return;
    this.eleveDossierId.set(eleveId);
    void this.router.navigate(['/enseignant', 'eleve-dossier'], { queryParams: { eleve: eleveId } });
  }
  retourAuxEleves(): void { void this.router.navigate(['/enseignant', 'eleves']); }
  chargerSuiviCoranEleve(eleveId: string): void {
    const contexte = this.espace()?.contexte;
    if (!contexte?.campus_id || !contexte.annee_scolaire_centrale_id) return;
    this.eleveDossierLoading.set(true);
    this.eleveDossierError.set(null);
    this.eleveDossierSelectedLesson.set(null);
    this.eleveDossierReader.set(null);
    forkJoin({
      lecons: this.api.leconsCoranDaara(contexte.campus_id, contexte.annee_scolaire_centrale_id, { eleveId, mode: 'lecons' }),
      revisions: this.api.leconsCoranDaara(contexte.campus_id, contexte.annee_scolaire_centrale_id, { eleveId, mode: 'mouradja' }),
      reader: this.api.suiviCoranDaara(contexte.campus_id, contexte.annee_scolaire_centrale_id, 'all', 1),
    }).subscribe({
      next: ({ lecons, revisions, reader }) => {
        this.eleveDossierLeconsSource.data = this.formaterSuiviCoran(lecons.data.lecons);
        this.eleveDossierRevisionsSource.data = this.formaterSuiviCoran(revisions.data.lecons);
        this.eleveDossierReader.set(reader.data);
        this.eleveDossierLoading.set(false);
      },
      error: (response) => {
        this.eleveDossierLeconsSource.data = [];
        this.eleveDossierRevisionsSource.data = [];
        this.eleveDossierReader.set(null);
        this.eleveDossierError.set(response.error?.message ?? 'Le suivi Coran de cet élève est indisponible.');
        this.eleveDossierLoading.set(false);
      },
    });
  }
  private formaterSuiviCoran(lecons: Array<any>): Array<any> {
    return lecons.map((lecon) => ({
      ...lecon,
      start: lecon.debut?.cle_verset ?? '—',
      end: lecon.fin?.cle_verset ?? '—',
      sourates: `${lecon.debut?.sourate_latin || lecon.debut?.sourate_arabe || '—'} → ${lecon.fin?.sourate_latin || lecon.fin?.sourate_arabe || '—'}`,
      statutLabel: lecon.statut === 'deja_recite' ? 'Déjà récité' : 'À réciter',
      assignedDate: lecon.assigned_at,
      completedDate: lecon.completed_at,
      duration: this.formatDuree(lecon),
    }));
  }
  ouvrirTexteQuranEleve(lesson: any): void { this.eleveDossierSelectedLesson.set(lesson); }
  fermerTexteQuranEleve(): void { this.eleveDossierSelectedLesson.set(null); }
  private formatDuree(lesson: { assigned_at: string; completed_at: string | null; duree_jours: number | null }): string {
    if (lesson.duree_jours === null || !lesson.completed_at) return '—';
    const hours = Math.max(0, Math.floor((new Date(lesson.completed_at).getTime() - new Date(lesson.assigned_at).getTime()) / 3_600_000));
    if (hours < 24) return `${hours} heure${hours === 1 ? '' : 's'}`;
    const days = Math.max(1, Math.floor(hours / 24));
    return `${days} jour${days === 1 ? '' : 's'}`;
  }
  private formaterElevesGroupes(eleves: Array<any>): Array<any> {
    return eleves.map((eleve) => ({ ...eleve, name: `${eleve.prenom} ${eleve.nom}`.trim(), gender: eleve.sexe || '—', birthDate: eleve.date_naissance || '—', parentPhone: eleve.tuteur_telephone || '—', status: eleve.statut === 'actif' ? 'Actif' : 'En attente' }));
  }
  effectifGroupe(groupe: string): number {
    return (this.espace()?.eleves_groupes ?? []).filter((eleve) => eleve.groupe === groupe).length;
  }
  ouvrirSeance(seanceId: string): void {
    void this.router.navigate(['/enseignant', 'seance-detail'], { queryParams: { seance: seanceId } });
  }
  choisirEspace(contexte: ContexteEnseignant): void {
    this.api.memoriserContexteEnseignant(contexte, this.espace()?.rattachements ?? []);
    this.api.invaliderCache('enseignant:espace');
    void this.router.navigate(['/enseignant', 'tableau-de-bord']);
  }
  changerOngletDossier(onglet: OngletDossier): void { this.dossierTab.set(onglet); }
  ouvrirClasseMatiere(affectation: { classe_matiere_id: string }): void {
    void this.router.navigate(['/enseignant', 'classe-matiere'], { queryParams: { classe_matiere: affectation.classe_matiere_id } });
  }
  retourAuxClasses(): void { void this.router.navigate(['/enseignant', 'classes']); }
  retourAuxSeances(): void { void this.router.navigate(['/enseignant', 'seances']); }
  ouvrirDetailEvaluation(evaluationId: string): void {
    void this.router.navigate(['/enseignant', 'evaluation-detail'], { queryParams: { evaluation: evaluationId } });
  }
  retourAuxEvaluations(): void { void this.router.navigate(['/enseignant', 'evaluations']); }
  ouvrirCreationEvaluation(): void {
    const premiereAffectation = this.espace()?.affectations[0];
    const bareme = Number(premiereAffectation?.bareme ?? 20);
    this.erreurEvaluation.set(null);
    this.formulaireEvaluation.set({
      titre: '', date: new Date().toISOString().slice(0, 10), periode: this.periodesAcademiques()[0] ?? '',
      type: 'controle', classeMatiereId: premiereAffectation?.classe_matiere_id ?? '', bareme: Number.isFinite(bareme) && bareme > 0 ? bareme : 20,
    });
    this.afficherCreationEvaluation.set(true);
  }
  fermerCreationEvaluation(): void { this.afficherCreationEvaluation.set(false); this.erreurEvaluation.set(null); }
  modifierFormulaireEvaluation(champ: 'titre' | 'date' | 'periode' | 'type' | 'classeMatiereId' | 'bareme', valeur: string | number): void {
    this.formulaireEvaluation.update((formulaire) => ({ ...formulaire, [champ]: valeur }));
  }
  enregistrerEvaluation(): void {
    const formulaire = this.formulaireEvaluation();
    if (this.enregistrementEvaluation()) return;
    if (!formulaire.titre.trim() || !formulaire.date || !formulaire.periode || !formulaire.classeMatiereId || !Number.isFinite(Number(formulaire.bareme)) || Number(formulaire.bareme) <= 0) {
      this.erreurEvaluation.set('Renseignez le titre, la date, la période, la matière et la note maximale.');
      return;
    }
    this.enregistrementEvaluation.set(true);
    this.erreurEvaluation.set(null);
    this.api.creerEvaluationEnseignant({
      classe_matiere_id: formulaire.classeMatiereId, titre: formulaire.titre.trim(), type: formulaire.type,
      date_evaluation: formulaire.date, periode: formulaire.periode, bareme: Number(formulaire.bareme),
    }).subscribe({
      next: () => { this.enregistrementEvaluation.set(false); this.fermerCreationEvaluation(); this.charger(); },
      error: (response) => { this.enregistrementEvaluation.set(false); this.erreurEvaluation.set(response.error?.message ?? 'L’évaluation n’a pas pu être créée.'); },
    });
  }
  ouvrirAjoutLecon(): void { this.afficherAjoutLecon.set(true); }
  annulerAjoutLecon(): void { this.afficherAjoutLecon.set(false); }
  modifierLecon(champ: 'libelle' | 'objectifs' | 'periode' | 'nombre_seances_estime', valeur: string | number): void {
    this.formulaireLecon.update((formulaire) => ({ ...formulaire, [champ]: valeur }));
  }
  enregistrerLecon(): void {
    const detail = this.classeMatiere();
    const formulaire = this.formulaireLecon();
    if (!detail || !formulaire.libelle.trim() || this.enregistrementLecon()) return;
    this.enregistrementLecon.set(true);
    this.erreurClasseMatiere.set(null);
    this.api.ajouterLeconClasseMatiereEnseignant(detail.classe_matiere.classe_matiere_id, {
      libelle: formulaire.libelle.trim(), objectifs: formulaire.objectifs.trim() || null,
      periode: formulaire.periode.trim() || null, nombre_seances_estime: Number(formulaire.nombre_seances_estime) || 1,
    }).subscribe({
      next: () => {
        this.formulaireLecon.set({ libelle: '', objectifs: '', periode: '', nombre_seances_estime: 1 });
        this.afficherAjoutLecon.set(false);
        this.chargerClasseMatiere(detail.classe_matiere.classe_matiere_id);
      },
      error: (response) => this.erreurClasseMatiere.set(response.error?.message ?? 'La leçon n’a pas pu être ajoutée.'),
      complete: () => this.enregistrementLecon.set(false),
    });
  }
  private chargerClasseMatiere(classeMatiereId: string): void {
    this.chargementClasseMatiere.set(true);
    this.erreurClasseMatiere.set(null);
    this.api.classeMatiereEnseignant(classeMatiereId).subscribe({
      next: ({ data }) => { this.classeMatiere.set(data); this.elevesClasseSource.data = data.eleves; },
      error: (response) => this.erreurClasseMatiere.set(response.error?.message ?? 'Cette classe ou matière est indisponible.'),
      complete: () => this.chargementClasseMatiere.set(false),
    });
  }
  private chargerSeance(seanceId: string): void {
    this.chargementSeance.set(true);
    this.erreurSeance.set(null);
    this.api.seanceEnseignant(seanceId).subscribe({
      next: ({ data }) => {
        this.seanceDetail.set(data);
        this.cahierSeance.set({ contenu: data.cahier_texte?.contenu ?? '', travailMaison: data.cahier_texte?.travail_maison ?? '', leconId: data.cahier_texte?.lecon_id ?? '' });
        this.presencesSeance.set(Object.fromEntries(data.eleves.map((eleve) => [eleve.id, eleve.presence_statut ?? 'present'])));
        this.sessionStudentsSource.data = data.eleves.map((eleve) => ({
          ...eleve,
          nom_complet: `${eleve.prenom} ${eleve.nom}`.trim(),
          attendanceStatus: this.codePresence(eleve.presence_statut),
        }));
      },
      error: (response) => this.erreurSeance.set(response.error?.message ?? 'Le détail de la séance est indisponible.'),
      complete: () => this.chargementSeance.set(false),
    });
  }
  private chargerDetailEvaluation(evaluationId: string): void {
    this.chargementEvaluationDetail.set(true);
    this.erreurEvaluationDetail.set(null);
    this.api.detailEvaluationEnseignant(evaluationId).subscribe({
      next: ({ data }) => {
        this.evaluationDetail.set(data);
        this.evaluationResultsSource.data = data.resultats.map((resultat) => ({
          ...resultat,
          nom_complet: `${resultat.prenom} ${resultat.nom}`.trim(),
          participated: Boolean(resultat.a_participe),
          score: resultat.note === null ? null : Number(resultat.note),
          bareme: Number(resultat.bareme),
          appreciation: resultat.appreciation ?? '',
          piece_jointe: resultat.piece_jointe,
        }));
      },
      error: (response) => this.erreurEvaluationDetail.set(response.error?.message ?? 'Le détail de l’évaluation est indisponible.'),
      complete: () => this.chargementEvaluationDetail.set(false),
    });
  }
  modifierParticipationEvaluation(event: { row: any; participated: boolean }): void {
    this.evaluationResultsSource.data = this.evaluationResultsSource.data.map((ligne) => ligne.eleve_id === event.row.eleve_id
      ? { ...ligne, participated: event.participated, score: event.participated ? ligne.score : null }
      : ligne);
  }
  modifierNoteEvaluation(event: { row: any; score: number | null }): void {
    const note = event.score === null ? null : Math.min(Math.max(event.score, 0), Number(event.row.bareme));
    this.evaluationResultsSource.data = this.evaluationResultsSource.data.map((ligne) => ligne.eleve_id === event.row.eleve_id ? { ...ligne, score: note } : ligne);
  }
  modifierAppreciationEvaluation(event: { row: any; comment: string }): void {
    this.evaluationResultsSource.data = this.evaluationResultsSource.data.map((ligne) => ligne.eleve_id === event.row.eleve_id ? { ...ligne, appreciation: event.comment } : ligne);
  }
  ajouterCopieEvaluation(event: { row: any; file: File }): void {
    const detail = this.evaluationDetail();
    if (!detail) return;
    if (event.file.type !== 'application/pdf' && !event.file.name.toLowerCase().endsWith('.pdf')) {
      this.erreurEvaluationDetail.set('Seuls les fichiers PDF sont acceptés pour une copie d’évaluation.');
      return;
    }
    this.erreurEvaluationDetail.set(null);
    this.api.joindreCopieEvaluationEnseignant(detail.evaluation.id, event.row.eleve_id, event.file).subscribe({
      next: () => this.chargerDetailEvaluation(detail.evaluation.id),
      error: (response) => this.erreurEvaluationDetail.set(response.error?.message ?? 'La copie PDF n’a pas pu être ajoutée.'),
    });
  }
  enregistrerResultatsEvaluation(): void {
    const detail = this.evaluationDetail();
    if (!detail || this.enregistrementResultats()) return;
    this.enregistrementResultats.set(true);
    this.erreurEvaluationDetail.set(null);
    const resultats = this.evaluationResultsSource.data.map((ligne) => ({
      eleve_id: ligne.eleve_id, a_participe: Boolean(ligne.participated), note: ligne.participated ? ligne.score : null,
      appreciation: ligne.appreciation?.trim() || null,
    }));
    this.api.enregistrerResultatsEvaluationEnseignant(detail.evaluation.id, resultats).subscribe({
      next: ({ data }) => {
        this.enregistrementResultats.set(false);
        this.evaluationDetail.set(data);
        this.evaluationResultsSource.data = data.resultats.map((resultat) => ({ ...resultat, nom_complet: `${resultat.prenom} ${resultat.nom}`.trim(), participated: Boolean(resultat.a_participe), score: resultat.note === null ? null : Number(resultat.note), bareme: Number(resultat.bareme), appreciation: resultat.appreciation ?? '', piece_jointe: resultat.piece_jointe }));
        this.charger();
      },
      error: (response) => { this.enregistrementResultats.set(false); this.erreurEvaluationDetail.set(response.error?.message ?? 'Les résultats n’ont pas pu être enregistrés.'); },
    });
  }
  modifierCahierSeance(champ: 'contenu' | 'travailMaison' | 'leconId', value: string): void {
    this.cahierSeance.update((cahier) => ({ ...cahier, [champ]: value }));
  }
  joindrePieceSeance(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    const detail = this.seanceDetail();
    if (!fichier || !detail || this.televersementPieceSeance()) return;
    const extensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
    const extension = fichier.name.split('.').pop()?.toLowerCase() ?? '';
    if (fichier.size > 15 * 1024 * 1024) {
      this.erreurSeance.set('Le fichier ne doit pas dépasser 15 Mo.');
      input.value = '';
      return;
    }
    if (!extensions.includes(extension)) {
      this.erreurSeance.set('Formats acceptés : PDF, Word, Excel, JPG ou PNG.');
      input.value = '';
      return;
    }
    this.televersementPieceSeance.set(true);
    this.erreurSeance.set(null);
    this.api.joindrePieceSeanceEnseignant(detail.seance.id, fichier).subscribe({
      next: () => this.chargerSeance(detail.seance.id),
      error: (response) => { this.televersementPieceSeance.set(false); input.value = ''; this.erreurSeance.set(response.error?.message ?? 'Le document n’a pas pu être ajouté.'); },
      complete: () => { this.televersementPieceSeance.set(false); input.value = ''; },
    });
  }
  modifierPresence(eleveId: string, statut: string): void {
    this.presencesSeance.update((presences) => ({ ...presences, [eleveId]: statut }));
    this.sessionStudentsSource.data = this.sessionStudentsSource.data.map((eleve) => eleve.id === eleveId
      ? { ...eleve, attendanceStatus: this.codePresence(statut) }
      : eleve);
  }
  modifierPresenceTable(event: { row: any; status: 'P' | 'A' | 'R' }): void {
    const statut = event.status === 'P' ? 'present' : event.status === 'A' ? 'absent' : 'retard';
    this.modifierPresence(String(event.row.id), statut);
  }
  enregistrerDetailSeance(): void {
    const detail = this.seanceDetail();
    if (!detail || this.enregistrementSeance()) return;
    this.enregistrementSeance.set(true);
    const cahier = this.cahierSeance();
    this.api.enregistrerSeanceEnseignant(detail.seance.id, {
      cahier_texte: cahier.contenu.trim(), travail_maison: cahier.travailMaison.trim(), lecon_id: cahier.leconId || null,
      presences: detail.eleves.map((eleve) => ({ eleve_id: eleve.id, statut: this.presencesSeance()[eleve.id] ?? 'present' })),
    }).subscribe({
      next: () => { this.enregistrementSeance.set(false); this.retourAuxSeances(); this.charger(); },
      error: (response) => { this.enregistrementSeance.set(false); this.erreurSeance.set(response.error?.message ?? 'La séance n’a pas pu être enregistrée.'); },
    });
  }
  formatHeure(value: string | null): string { return value ? value.slice(0, 5) : '—'; }

  private codePresence(statut: string | null | undefined): 'P' | 'A' | 'R' {
    if (statut === 'absent') return 'A';
    if (statut === 'retard') return 'R';
    return 'P';
  }

  libelleStatutSeance(statut: string | null | undefined): 'Planifiée' | 'À compléter' | 'Effectuée' | 'Validée' | 'Ratée' {
    if (statut === 'ratee') return 'Ratée';
    if (statut === 'realisee') return 'Effectuée';
    if (statut === 'terminee') return 'Validée';
    if (statut === 'a_completer') return 'À compléter';
    return 'Planifiée';
  }
  private libelleStatutEvaluation(statut: string | null | undefined): 'Brouillon' | 'À corriger' | 'Corrigée' {
    if (statut === 'corrigee') return 'Corrigée';
    if (statut === 'brouillon') return 'Brouillon';
    return 'À corriger';
  }

  private dateHeureSeance(seance: { date_seance?: string | null; heure_debut?: string | null }): number {
    const date = seance.date_seance ?? '';
    const heure = seance.heure_debut ?? '00:00:00';
    const timestamp = Date.parse(`${date}T${heure}`);
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }
}
