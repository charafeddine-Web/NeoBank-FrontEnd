import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, LoginRequest } from '../../core/services/auth';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = false;
  serverError: string | null = null;

  submit() {

    console.log('Submit clicked! Form value:', this.form.value);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.serverError = null;

    this.auth.login(this.form.value as LoginRequest).subscribe({
      next: (res) => {
        this.loading = false;
        this.auth.handleSuccessfulLogin(res);
      },
      error: (err) => {
        console.log('HTTP ERROR object:', err);
        this.loading = false;
        if (err && err.status === 401) {
          this.serverError = 'Email ou mot de passe invalide';
        } else if (err && err.error && err.error.message) {
          this.serverError = err.error.message;
        } else {
          this.serverError = 'Erreur réseau, réessayez plus tard';
        }
      },
    });
  }
}
