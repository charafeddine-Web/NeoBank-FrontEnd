import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClientService, Operation } from '../core/services/client';
import { AgentService } from '../core/services/agent';
import { Auth } from '../core/services/auth';
import { Subscription } from 'rxjs';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agent-dashboard.html',
  styleUrls: ['./agent-dashboard.css'],
})
export class AgentDashboard implements OnInit, OnDestroy {
  currentSection = 'dashboard';
  isMobileMenuOpen = false;
  activeModal: string | null = null;
  selectedOperation: Operation | null = null;
  rejectionComment = '';

  accountInfo: any = {
    fullName: 'Chargement...',
    role: 'Agent Bancaire',
    email: '',
    lastLogin: 'Session active',
    lastIp: '--'
  };

  pendingOperations: Operation[] = [];
  stats = {
    totalPending: 0,
    totalValidated: 0,
    totalRejected: 0
  };

  private authSub: Subscription | null = null;

  constructor(
    private agentService: AgentService,
    private clientService: ClientService,
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
      this.accountInfo.role = user.role || 'Agent';
    }
  }

  loadData() {
    this.agentService.getPendingOperations().subscribe({
      next: (data) => {
        this.pendingOperations = data.map((op: any) => ({
          ...op,
          date: this.formatDate(op.createdAt),
          isPositive: op.type === 'DEPOSIT',
          hasFile: op.hasFile || false,
          status: (op.status || '').toLowerCase(),
          originalType: op.type,
          type: this.getFriendlyType(op.type)
        })).sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.stats.totalPending = this.pendingOperations.length;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching pending operations', err)
    });
  }

  showSection(sectionName: string) {
    this.currentSection = sectionName;
    this.isMobileMenuOpen = false;
    if (sectionName === 'pending') {
      this.loadData();
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openModal(modalType: string, op: Operation) {
    this.activeModal = modalType;
    this.selectedOperation = op;
    this.rejectionComment = '';
  }

  closeModal() {
    this.activeModal = null;
    this.selectedOperation = null;
  }

  approve(id: number) {
    if (confirm('Voulez-vous vraiment approuver cette opération ?')) {
      this.agentService.approveOperation(id).subscribe({
        next: () => {
          alert('Opération approuvée avec succès.');
          this.loadData();
          this.closeModal();
        },
        error: (err) => alert('Erreur lors de l\'approbation.')
      });
    }
  }

  reject(id: number, comment: string) {
    this.agentService.rejectOperation(id, comment).subscribe({
      next: () => {
        alert('Opération rejetée.');
        this.loadData();
        this.closeModal();
      },
      error: (err) => alert('Erreur lors du rejet.')
    });
  }

  viewDocument(id: number) {
    this.clientService.getOperationDocument(id).subscribe({
      next: (blob) => {
        if (blob.type.includes('text/html')) {
          alert('Le document semble corrompu ou inaccessible (Session expirée ?).');
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `justificatif_op_${id}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => alert('Impossible de charger le document.')
    });
  }

  private formatDate(dateStr: any): string {
    if (!dateStr) return '---';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  private getFriendlyType(type: string): string {
    switch (type?.toUpperCase()) {
      case 'DEPOSIT': return 'Dépôt';
      case 'WITHDRAWAL': return 'Retrait';
      case 'TRANSFER': return 'Virement';
      default: return type || 'Autre';
    }
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.auth.logout();
    }
  }
}
