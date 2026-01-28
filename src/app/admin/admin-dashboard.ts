import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService, UserResponse } from '../core/services/admin';
import { Auth } from '../core/services/auth';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
})
export class AdminDashboard implements OnInit, OnDestroy {
  currentSection = 'dashboard';
  isMobileMenuOpen = false;
  activeModal: string | null = null;
  selectedUser: any = null;
  selectedOperation: any = null;
  rejectionComment = '';

  userForm: any = {
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'CLIENT',
    active: true
  };

  accountInfo: any = {
    fullName: 'Administrateur',
    role: 'Admin',
    email: '',
    lastLogin: 'Session active'
  };

  users: UserResponse[] = [];
  allOperations: any[] = [];
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalOperations: 0,
    systemVolume: 0
  };

  private authSub: Subscription | null = null;

  constructor(
    private adminService: AdminService,
    public auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.authSub = this.auth.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserInfo();
        this.loadData();
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  loadUserInfo() {
    const user = this.auth.getUserInfo();
    if (user) {
      this.accountInfo.fullName = user.name;
      this.accountInfo.email = user.email;
    }
  }

  loadData() {
    this.adminService.listUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.stats.totalUsers = data.length;
        this.stats.activeUsers = data.filter(u => u.active).length;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching users', err)
    });

    this.adminService.listOperations().subscribe({
      next: (data) => {
        this.allOperations = data.map(op => ({
          ...op,
          date: this.formatDate(op.createdAt),
          isPositive: op.type === 'DEPOSIT',
          status: (op.status || '').toLowerCase()
        })).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.stats.totalOperations = data.length;
        this.stats.systemVolume = data.reduce((acc, op) => acc + (op.amount || 0), 0);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching operations', err)
    });
  }

  showSection(sectionName: string) {
    this.currentSection = sectionName;
    this.isMobileMenuOpen = false;
    this.loadData();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openModal(modalType: string, data?: any) {
    this.activeModal = modalType;
    if (modalType === 'editUser' && data) {
      this.selectedUser = data;
      this.userForm = { ...data };
    } else if (modalType === 'createUser') {
      this.userForm = { username: '', email: '', name: '', password: '', role: 'CLIENT', active: true };
    } else if (modalType === 'rejectOp' && data) {
      this.selectedOperation = data;
      this.rejectionComment = '';
    }
  }

  closeModal() {
    this.activeModal = null;
    this.selectedUser = null;
    this.selectedOperation = null;
  }

  handleUserSubmit() {
    if (this.activeModal === 'createUser') {
      this.adminService.createUser(this.userForm).subscribe({
        next: () => {
          alert('Utilisateur créé avec succès.');
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Erreur lors de la création.')
      });
    } else {
      this.adminService.updateUser(this.selectedUser.id, this.userForm).subscribe({
        next: () => {
          alert('Utilisateur mis à jour.');
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Erreur lors de la mise à jour.')
      });
    }
  }

  activate(id: number) {
    this.adminService.activateUser(id).subscribe({
      next: () => {
        alert('Compte activé.');
        this.loadData();
      },
      error: (err) => alert('Erreur lors de l’activation.')
    });
  }

  suspend(id: number) {
    if (confirm('Suspendre cet utilisateur ?')) {
      this.adminService.suspendUser(id).subscribe({
        next: () => {
          alert('Compte suspendu.');
          this.loadData();
        },
        error: (err) => alert('Erreur lors de la suspension.')
      });
    }
  }

  delete(id: number) {
    if (confirm('Supprimer définitivement cet utilisateur ?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => {
          alert('Utilisateur supprimé.');
          this.loadData();
        },
        error: (err) => alert('Erreur lors de la suppression.')
      });
    }
  }

  forceApprove(id: number) {
    if (confirm('APPEL ADMIN : Confirmer cette opération manuellement ?')) {
      this.adminService.forceApprove(id).subscribe({
        next: () => {
          alert('Opération approuvée (ADMIN).');
          this.loadData();
        },
        error: (err) => alert('Erreur lors de l’approbation forcée.')
      });
    }
  }

  forceReject(id: number, comment: string) {
    this.adminService.forceReject(id, comment).subscribe({
      next: () => {
        alert('Opération rejetée (ADMIN).');
        this.loadData();
        this.closeModal();
      },
      error: (err) => alert('Erreur lors du rejet forcée.')
    });
  }

  private formatDate(dateStr: any): string {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return dateStr; }
  }

  logout() {
    if (confirm('Se déconnecter de l’administration ?')) {
      this.auth.logout();
    }
  }
}

