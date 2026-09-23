import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild, inject } from '@angular/core';
import { PrimarySchoolComponent } from '../primary-school/primary-school.component';
import { PrimaryWorkspaceService } from '../primary-school/primary-workspace.service';

/**
 * Espace préscolaire : même socle administratif et financier que le primaire,
 * avec une navigation volontairement allégée. Les vues pédagogiques fondées
 * sur les séances, évaluations et bulletins ne sont pas proposées ici.
 */
@Component({
  selector: 'app-preschool',
  standalone: true,
  imports: [PrimarySchoolComponent],
  template: '<app-primary-school />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreschoolComponent implements OnInit, AfterViewInit {
  private readonly workspace = inject(PrimaryWorkspaceService);
  @ViewChild(PrimarySchoolComponent) private readonly school!: PrimarySchoolComponent;

  ngOnInit(): void {
    this.workspace.configureEstablishment('prescolaire');
  }

  ngAfterViewInit(): void {
    // La proposition reste visible avant le premier enregistrement des
    // paramètres, puis le référentiel de l'institut prend naturellement le
    // relais dès qu'il est disponible.
    if (this.school.schoolLevelSettings.every((niveau) => ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'].includes(niveau.code))) {
      this.school.schoolLevelSettings = [
        { id: 'ps', code: 'PS', label: 'Petite section' },
        { id: 'ms', code: 'MS', label: 'Moyenne section' },
        { id: 'gs', code: 'GS', label: 'Grande section' },
      ];
      this.school.preparerPropositionsClasses(true);
    }
  }
}
