import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, Role } from '@core';
import { User } from '@core/models/interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LocalStorageService } from '@shared/services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-locked',
  templateUrl: './locked.component.html',
  styleUrls: ['./locked.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
  ],
})
export class LockedComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private store = inject(LocalStorageService);

  authForm!: FormGroup;
  submitted = false;
  userImg!: string;
  userFullName!: string;
  hide = true;

  ngOnInit() {
    this.authForm = this.formBuilder.group({
      password: ['', Validators.required],
    });
    const avatar = this.authService.currentUser().avatar;
    this.userImg = avatar ? 'assets/images/user/' + avatar : '';
    this.userFullName = this.authService.currentUser().name || '';
  }

  get f() {
    return this.authForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.authForm.invalid) {
      return;
    } else {
      const currentUser = this.store.get('currentUser') as User;
      const role = currentUser?.roles?.[0]?.name;
      if (role === Role.Admin) {
        this.router.navigate(['/admin/dashboard/main']);
      } else if (role === Role.Teacher) {
        this.router.navigate(['/teacher/dashboard']);
      } else if (role === Role.Student) {
        this.router.navigate(['/student/dashboard']);
      } else {
        this.router.navigate(['/authentication/signin']);
      }
    }
  }
}
