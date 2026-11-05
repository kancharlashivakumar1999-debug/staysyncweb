import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HttpApiService } from '../services/http-api.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private httpApi: HttpApiService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // 1. Attach Access Token if available
    const accessToken = localStorage.getItem('pg_access_token');
    let authReq = request;
    if (accessToken && !request.headers.has('Authorization')) {
      authReq = this.addToken(request, accessToken);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // 2. Intercept 401 Unauthorized errors and attempt silent refresh
        if (error.status === 401 && !request.url.includes('auth/login') && !request.url.includes('auth/refresh-token')) {
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const currentUser = this.authService.currentUserValue;
      const refreshToken = currentUser?.refreshToken || localStorage.getItem('pg_refresh_token');

      if (refreshToken) {
        return this.httpApi.post<any>('auth/refresh-token', { refreshToken }).pipe(
          switchMap((response: any) => {
            this.isRefreshing = false;
            // Store new tokens
            localStorage.setItem('pg_access_token', response.token);
            if (response.refreshToken) {
              localStorage.setItem('pg_refresh_token', response.refreshToken);
            }
            this.refreshTokenSubject.next(response.token);
            return next.handle(this.addToken(request, response.token));
          }),
          catchError((err) => {
            this.isRefreshing = false;
            // Both access and refresh tokens expired -> redirect to login
            this.authService.logout();
            return throwError(() => err);
          })
        );
      } else {
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => new Error('No refresh token available.'));
      }
    } else {
      // Queue requests until token refresh completes
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }
}
