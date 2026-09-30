import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdmissionCampusApi, AdmissionClasseApi, AdmissionOptionsApi, CentralApiService } from '../central-api.service';

@Component({ selector: 'app-admission-form', imports: [FormsModule], templateUrl: './admission-form.component.html', styleUrl: './admission-form.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AdmissionFormComponent implements OnInit {
  private readonly api = inject(CentralApiService);
  private readonly route = inject(ActivatedRoute);
  readonly options = signal<AdmissionOptionsApi | null>(null);
  readonly chargement = signal(true);
  readonly envoi = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly succes = signal<string | null>(null);
  typeEtablissement = '';
  campusId = '';
  classeId = '';
  prenom = '';
  nom = '';
  sexe = '';
  dateNaissance = '';
  telephoneEleve = '';
  lieuNaissance = '';
  nationalite = '';
  adresse = '';
  prenomTuteur = '';
  nomTuteur = '';
  telephoneTuteur = '';
  emailTuteur = '';
  professionTuteur = '';
  adresseTuteur = '';
  message = '';

  ngOnInit(): void {
    const domaine = this.route.snapshot.queryParamMap.get('domaine') || window.location.hostname;
    this.api.admissionOptions(domaine).subscribe({ next: ({ data }) => { this.options.set(data); this.typeEtablissement = data.types[0]?.code ?? ''; this.campusId = this.campusesPourType()[0]?.id ?? ''; this.chargement.set(false); }, error: () => { this.erreur.set('Le formulaire d’admission n’est pas disponible pour le moment.'); this.chargement.set(false); } });
  }

  campusesPourType(): AdmissionCampusApi[] { const type = this.options()?.types.find((item) => item.code === this.typeEtablissement); return (this.options()?.campuses ?? []).filter((campus) => !type || campus.type_etablissement_ids.includes(type.id)); }
  classesDisponibles(): AdmissionClasseApi[] { return (this.options()?.classes ?? []).filter((item) => item.type_etablissement_code === this.typeEtablissement && item.campus_id === this.campusId); }
  changerType(code: string): void { this.typeEtablissement = code; this.campusId = this.campusesPourType()[0]?.id ?? ''; this.classeId = ''; }
  changerCampus(id: string): void { this.campusId = id; this.classeId = ''; }
  private reinitialiserFormulaire(): void {
    this.prenom = '';
    this.nom = '';
    this.telephoneEleve = '';
    this.sexe = '';
    this.dateNaissance = '';
    this.lieuNaissance = '';
    this.nationalite = '';
    this.adresse = '';
    this.prenomTuteur = '';
    this.nomTuteur = '';
    this.telephoneTuteur = '';
    this.emailTuteur = '';
    this.professionTuteur = '';
    this.adresseTuteur = '';
    this.message = '';
    this.typeEtablissement = this.options()?.types[0]?.code ?? '';
    this.campusId = this.campusesPourType()[0]?.id ?? '';
    this.classeId = '';
  }
  soumettre(): void {
    this.erreur.set(null); this.succes.set(null); this.envoi.set(true);
    const domaine = this.route.snapshot.queryParamMap.get('domaine') || window.location.hostname;
    this.api.deposerAdmission(domaine, { prenom: this.prenom, nom: this.nom, telephone_eleve: this.telephoneEleve || null, sexe: this.sexe || null, date_naissance: this.dateNaissance || null, lieu_naissance: this.lieuNaissance || null, nationalite: this.nationalite || null, adresse: this.adresse || null, type_etablissement: this.typeEtablissement, campus_id: this.campusId, classe_id: this.classeId, prenom_tuteur: this.prenomTuteur, nom_tuteur: this.nomTuteur, telephone_tuteur: this.telephoneTuteur, email_tuteur: this.emailTuteur || null, profession_tuteur: this.professionTuteur || null, adresse_tuteur: this.adresseTuteur || null, message: this.message || null }).subscribe({ next: ({ message }) => { this.reinitialiserFormulaire(); this.succes.set(message); this.envoi.set(false); }, error: (error) => { this.erreur.set(error?.error?.message ?? 'Vérifiez les informations saisies puis réessayez.'); this.envoi.set(false); } });
  }
}
