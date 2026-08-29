import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, merge, Observable, of, share, switchMap } from 'rxjs';
import { signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { User } from '@core/models/interface';
import { LocalStorageService } from '@shared/services';
import { TokenService } from './token.service';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenService = inject(TokenService);
  private loginService = inject(LoginService);
  private store = inject(LocalStorageService);

  currentUser = signal<User>(this.store.get('currentUser') || {});
  currentUser$ = toObservable(this.currentUser);

  private change$ = this.currentUser$;

  change() {
    return this.change$;
  }

  login(username: string, password: string, rememberMe = false) {
    return this.loginService.login(username, password, rememberMe).pipe(
      switchMap((response) => {
        const returnValue = JSON.parse(JSON.stringify(response))['token'];
        this.tokenService.set(returnValue);
        const roleData: [] = JSON.parse(JSON.stringify(response))['user'][
          'roles'
        ];
        roleData.sort((a: any, b: any) => {
          const aPri: number = a['priority'];
          const bPri: number = b['priority'];
          if (aPri > bPri) return 1;
          else if (aPri < bPri) return -1;
          else return 0;
        });
        this.tokenService.roleArray = roleData;
        this.tokenService.permissionArray = JSON.parse(
          JSON.stringify(response)
        )['user']['permissions'];

        this.store.set('currentUser', response.user);
        this.currentUser.set(response.user);

        // Store role names in a new array
        const roleNames = this.tokenService.roleArray.map(
          (role: { name: string }) => role.name
        );

        const roleNamesJSON = JSON.stringify(roleNames);

        // Store the JSON string in LocalStorage
        this.store.set('roleNames', roleNamesJSON);

        return of(response); // Return the response to be handled in the component
      })
    );
  }

  logout() {
    // remove user from local storage to log user out
    this.store.clear();
    // this.currentUserSubject.next(this.currentUserValue);
    return of({ success: false });
  }

  assignUser(): Observable<User> {
    const user = this.store.get('currentUser') || {};
    this.currentUser.set(user); 
    return of(user);
  }
}
