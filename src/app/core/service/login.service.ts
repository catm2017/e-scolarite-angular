import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '@core/models/interface';
import { of } from 'rxjs';
import { LocalStorageService } from '@shared/services';
import { JWT } from './JWT';
const jwt = new JWT();

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  protected http = inject(HttpClient);
  private store = inject(LocalStorageService);

  private users: User[] = [
    {
      id: 1,
      username: 'admin',
      password: 'admin@123',
      name: 'Sarah Smith',
      email: 'admin@school.org',
      roles: [
        {
          name: 'ADMIN',
          priority: 1,
        },
      ],
      permissions: ['canAdd', 'canDelete', 'canEdit', 'canRead'],
      avatar: 'admin.jpg',
    },
    {
      id: 2,
      username: 'teacher',
      password: 'teacher@123',
      name: 'Ashton Cox',
      email: 'teacher@school.org',
      roles: [
        {
          name: 'TEACHER',
          priority: 2,
        },
      ],
      permissions: ['canAdd', 'canEdit', 'canRead'],
      avatar: 'teacher.jpg',
      refresh_token: true,
    },
    {
      id: 3,
      username: 'student',
      password: 'student@123',
      name: 'Cara Stevens',
      email: 'student@school.org',
      roles: [
        {
          name: 'STUDENT',
          priority: 3,
        },
      ],
      permissions: ['canRead'],
      avatar: 'student.jpg',
      refresh_token: true,
    },
    {
      id: 4,
      username: 'parent',
      password: 'parent@123',
      name: 'James Parker',
      email: 'parent@school.org',
      roles: [
        {
          name: 'PARENT',
          priority: 4,
        },
      ],
      permissions: ['canRead'],
      avatar: 'parent.jpg',
      refresh_token: true,
    },
  ];

  login(username: string, password: string, _rememberMe = false) {
    // Simulate a login API call
    const user = this.users.find(
      (u) => u['username'] === username && u['password'] === password,
    );
    if (!user) {
      return of({ status: 401, body: {} });
    }

    if (user['password'] !== password) {
      const result = {
        status: 422,
        error: {
          errors: { password: ['The provided password is incorrect.'] },
        },
      };
      return of(Object.assign(result));
    }

    const currentUser = Object.assign({}, user);
    delete currentUser['password'];

    if (user) {
      const userResponse = {
        user: currentUser,
        token: jwt.generate(currentUser),
        status: 200,
      };

      return of(userResponse);
    } else {
      return of({ error: 'Invalid credentials' });
    }
  }

  refresh() {
    const user = Object.assign({}, this.store.get('currentUser'));

    const result = user
      ? { status: 200, body: jwt.generate(user) }
      : { status: 401, body: {} };

    return of(result);
  }

  logout() {
    this.store.clear();
    return of({ success: false });
  }

  user() {
    return this.http.get<User>('/user');
  }
}
