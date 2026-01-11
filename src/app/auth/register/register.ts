import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, RegisterRequest } from '../../core/services/auth';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  loading = false;
  serverError: string | null = null;

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.serverError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;
    this.serverError = null;
    const payload: RegisterRequest & { role?: string; active?: boolean } = {
      username: (this.form.value.username as string).trim(),
      email: (this.form.value.email as string).trim(),
      password: (this.form.value.password as string),
      role: 'CLIENT',
      active: true,
    };

    console.debug('[Register] POST', payload);

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        console.debug('[Register] success', res);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/client';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        console.error('[Register] error', err);
        if (err && err.status === 400 && err.error) {
          const msg = err.error.message || JSON.stringify(err.error);
          this.serverError = msg;
        } else if (err && err.error && err.error.message) {
          this.serverError = err.error.message;
        } else {
          this.serverError = "Erreur lors de l'inscription";
        }
      },
    });
  }
}
