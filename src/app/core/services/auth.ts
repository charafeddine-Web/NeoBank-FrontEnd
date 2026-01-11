import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { parseTokenRoles } from '../guards/token-utils';

export interface LoginRequest {
  // UI may provide email or username; we'll map to username for the backend
  email?: string | null;
  username?: string | null;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
  active?: boolean;
}

export interface AuthResponse {
  // backend returns `token` and `tokenType` in your example
  token?: string;
  tokenType?: string;
  accessToken?: string; // keep for compatibility
  refreshToken?: string;
  expiresIn?: number; // seconds
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  username?: string;
  email?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly ACCESS_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly EXPIRES_AT = 'token_expires_at';

  constructor(private http: HttpClient, private router: Router) {}

  // If frontend runs on localhost:4200 (dev), point requests to backend on localhost:8080
  private getApiUrl(path: string): string {
    try {
      const host = window.location.hostname || '';
      const port = window.location.port || '';
      const origin = window.location.origin || '';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const isDev4200 = isLocalhost && (port === '4200' || origin.includes(':4200'));
      const isDev = isDev4200 || origin.includes(':4200') || host === '';
      // In development, call backend directly (CORS should be enabled on the backend)
      const url = (isDev ? 'http://localhost:8080' : '') + path;
      console.debug(`[Auth] host=${host} port=${port} origin=${origin} -> calling ${url}`);
      return url;
    } catch (e) {
      // SSR or non-browser environment fallback
      return path;
    }
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    // Map email -> username if needed by backend
    const body: any = {
      username: payload.username ?? payload.email,
      password: payload.password,
    };
    const url = this.getApiUrl('/api/auth/login');
    // debug log to confirm final URL and payload
    console.debug('[Auth.login] POST', url, body);
    console.trace('[Auth.login] stack trace');
    return this.http.post<AuthResponse>(url, body).pipe(
      map((res) => {
        return res;
      })
    );
  }

  handleSuccessfulLogin(response: AuthResponse) {
    this.setTokens(response);

    // Small delay to let localStorage write + Angular change detection catch up
    setTimeout(() => {
      const role = (response.role || '').trim().toUpperCase();

      console.log('[Auth] handleSuccessfulLogin → resolved role:', role);

      if (role.includes('CLIENT')) {
        this.router.navigate(['/client']);
      }
      else if (role.includes('AGENT') || role.includes('AGENT_BANCAIRE')) {
        this.router.navigate(['/agent']);
      }
      else if (role.includes('ADMIN')) {
        this.router.navigate(['/admin']);
      }
      else {
        console.warn('[Auth] Unknown role, redirecting to home:', role);
        this.router.navigate(['/']);
      }
    }, 80); // 80–150ms → usually enough, you can try 150 if still issues
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    const url = this.getApiUrl('/api/auth/register');
    console.debug('[Auth.register] POST', url, payload);
    console.trace('[Auth.register] stack trace');
    return this.http.post<AuthResponse>(url, payload).pipe(
      map((res) => {
        this.setTokens(res);
        return res;
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  setTokens(res: AuthResponse) {
    if (!res) return;
    // backend may return token or accessToken
    const token = res.accessToken ?? res.token ?? null;
    if (token) {
      localStorage.setItem(this.ACCESS_KEY, token);
    }
    if (res.refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    }
    if (res.expiresIn) {
      const expiresAt = Date.now() + res.expiresIn * 1000;
      localStorage.setItem(this.EXPIRES_AT, String(expiresAt));
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const expires = localStorage.getItem(this.EXPIRES_AT);
    if (!expires) return true; // token present but no expiry info
    const expiresAt = Number(expires);
    return Date.now() < expiresAt;
  }

  clearTokens() {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.EXPIRES_AT);
  }

  // Helper: return role strings from saved token
  getRolesFromToken(): string[] {
    const token = this.getAccessToken();
    return parseTokenRoles(token);
  }
}
