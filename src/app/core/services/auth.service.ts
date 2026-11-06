import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Owner } from '../../models/pg.models';
import { HttpApiService } from './http-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Owner | null>(this.loadStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private httpApi: HttpApiService, private router: Router) {}

  private loadStoredUser(): Owner | null {
    const stored = localStorage.getItem('pg_current_user');
    const token = localStorage.getItem('pg_access_token');
    if (stored && token) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  public get currentUserValue(): Owner | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    const user = this.currentUserSubject.value;
    const token = localStorage.getItem('pg_access_token');
    return !!(user && token);
  }

  register(ownerData: any): Observable<Owner> {
    return this.httpApi.post<Owner>('auth/register', ownerData).pipe(
      tap(owner => this.setSession(owner)),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<Owner> {
    return this.httpApi.post<Owner>('auth/login', credentials).pipe(
      tap(owner => this.setSession(owner)),
      catchError(err => {
        // Strict real error propagation: No fallback, restrict invalid users
        return throwError(() => err);
      })
    );
  }

  public getUserRole(): string {
    const user = this.currentUserSubject.value;
    return user?.role || 'Owner';
  }

  public hasRole(roles: string[]): boolean {
    const role = this.getUserRole();
    return roles.includes(role);
  }

  public getBranchIds(): string[] {
    const user = this.currentUserSubject.value;
    return user?.branchIds || [];
  }

  public canAccessBranch(branchId: string): boolean {
    const branchIds = this.getBranchIds();
    // If empty or user is Owner, they typically have full access across their branches
    if (this.getUserRole() === 'Owner') return true;
    return branchIds.includes(branchId);
  }

  logout(): void {
    const current = this.currentUserSubject.value;
    const refreshToken = current?.refreshToken || localStorage.getItem('pg_refresh_token');
    if (refreshToken) {
      this.httpApi.post('auth/logout', { refreshToken }).subscribe({
        next: () => {},
        error: () => {}
      });
    }
    localStorage.removeItem('pg_current_user');
    localStorage.removeItem('pg_access_token');
    localStorage.removeItem('pg_refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  private setSession(owner: Owner): void {
    localStorage.setItem('pg_current_user', JSON.stringify(owner));
    if (owner.token) {
      localStorage.setItem('pg_access_token', owner.token);
    }
    if (owner.refreshToken) {
      localStorage.setItem('pg_refresh_token', owner.refreshToken);
    }
    this.currentUserSubject.next(owner);
  }
}
