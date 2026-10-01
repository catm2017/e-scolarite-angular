import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CentralApiService, EspaceInstitut, PointageInstitutApi } from '../central-api.service';

@Component({
  selector: 'app-my-pointage',
  standalone: true,
  imports: [DatePipe, BreadcrumbComponent],
  templateUrl: './my-pointage.component.html',
  styleUrl: './my-pointage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPointageComponent implements OnInit, OnDestroy {
  private readonly api = inject(CentralApiService);
  readonly espace = signal<EspaceInstitut | null>(null);
  readonly etablissementsActifs = computed(() => this.espace()?.etablissements.filter((etablissement) => etablissement.active).length ?? 0);
  readonly pointages = signal<PointageInstitutApi[]>([]);
  readonly chargement = signal(true);
  readonly envoi = signal(false);
  readonly jeton = signal('');
  readonly message = signal<string | null>(null);
  readonly erreur = signal<string | null>(null);
  readonly scannerActif = signal(false);
  readonly scannerErreur = signal<string | null>(null);
  readonly sortieDisponibleDansSecondes = signal(0);
  @ViewChild('pointageVideo') private pointageVideo?: ElementRef<HTMLVideoElement>;
  private flux: MediaStream | null = null;
  private scanTimer: number | null = null;
  private sortieTimer: number | null = null;

  ngOnInit(): void {
    this.api.espaceInstitut().subscribe({
      next: (espace) => this.espace.set(espace),
    });
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.api.mesPointages().subscribe({
      next: ({ data }) => { this.pointages.set(data); this.actualiserDelaiSortie(data); this.chargement.set(false); },
      error: (response) => { this.erreur.set(response.error?.message ?? 'Vos pointages ne sont pas disponibles pour le moment.'); this.chargement.set(false); },
    });
  }

  private actualiserDelaiSortie(pointages: PointageInstitutApi[]): void {
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

  enregistrer(): void {
    const valeur = this.jeton().trim();
    if (valeur.length !== 64 || this.envoi()) return;
    this.envoi.set(true); this.message.set(null); this.erreur.set(null);
    this.api.scannerPointage(valeur).subscribe({
      next: (result) => { this.envoi.set(false); this.arreterScanner(); this.jeton.set(''); this.message.set(`${result.message} à ${result.heure} · ${result.borne}`); this.charger(); },
      error: (response) => { this.envoi.set(false); this.erreur.set(response.error?.message ?? 'Le pointage n’a pas pu être enregistré.'); },
    });
  }

  demarrerScanner(): void {
    this.scannerErreur.set(null);
    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (options?: { formats: string[] }) => { detect(video: HTMLVideoElement): Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!BarcodeDetectorCtor || !navigator.mediaDevices?.getUserMedia) {
      this.scannerErreur.set('La lecture QR automatique n’est pas prise en charge par ce navigateur. Utilisez un appareil ou un navigateur compatible.');
      return;
    }
    this.scannerActif.set(true);
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then((flux) => {
        this.flux = flux;
        const video = this.pointageVideo?.nativeElement;
        if (!video) return;
        video.srcObject = flux;
        void video.play();
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        const lire = (): void => {
          if (!this.scannerActif() || !this.pointageVideo?.nativeElement) return;
          detector.detect(this.pointageVideo.nativeElement).then((codes) => {
            const valeur = codes[0]?.rawValue?.trim();
            if (valeur) { this.jeton.set(valeur); this.arreterScanner(); this.enregistrer(); return; }
            this.scanTimer = window.setTimeout(lire, 250);
          }).catch(() => { this.scanTimer = window.setTimeout(lire, 500); });
        };
        lire();
      }).catch(() => { this.scannerActif.set(false); this.scannerErreur.set('La caméra n’a pas pu être ouverte. Vérifiez son autorisation dans le navigateur.'); });
    });
  }

  arreterScanner(): void {
    this.scannerActif.set(false);
    if (this.scanTimer !== null) { window.clearTimeout(this.scanTimer); this.scanTimer = null; }
    this.flux?.getTracks().forEach((track) => track.stop());
    this.flux = null;
    if (this.pointageVideo?.nativeElement) this.pointageVideo.nativeElement.srcObject = null;
  }

  ngOnDestroy(): void { this.arreterScanner(); if (this.sortieTimer !== null) window.clearInterval(this.sortieTimer); }
}
