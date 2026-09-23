import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild, inject } from '@angular/core';
import { PrimarySchoolComponent } from '../primary-school/primary-school.component';
import { PrimaryWorkspaceService } from '../primary-school/primary-workspace.service';

/**
 * Le Daara utilise le socle administratif et financier commun, mais son
 * parcours pédagogique est consacré au suivi de mémorisation du Coran.
 */
@Component({
  selector: 'app-daara',
  standalone: true,
  imports: [PrimarySchoolComponent],
  template: '<app-primary-school />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaaraComponent implements OnInit, AfterViewInit {
  private readonly workspace = inject(PrimaryWorkspaceService);
  @ViewChild(PrimarySchoolComponent) private school?: PrimarySchoolComponent;

  ngOnInit(): void {
    this.workspace.configureEstablishment('daara');
  }

  ngAfterViewInit(): void {
    // Une seule unité pédagogique, sans trimestres ni semestres.
    if (this.school) this.school.schoolLevelSettings = [{ id: 'daara', code: 'DAARA', label: 'Daara' }];
  }
}
