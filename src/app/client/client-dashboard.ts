import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClientService, Operation } from '../core/services/client';
import { Auth } from '../core/services/auth';
import { routes } from '../app.routes';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css'],
})
export class ClientDashboard implements OnInit {
  currentSection = 'dashboard';
  isMobileMenuOpen = false;
  activeModal: string | null = null;
  amountForFileCheck = 0;
  showFileSection = false;

  accountInfo: any = {
    fullName: 'Chargement...',
    email: '',
    accountNumber: '...',
    balance: 0,
    pendingOperations: 0,
    monthlyChange: 0,
    createdAt: '--/--/----',
    lastLogin: 'Session active',
    lastIp: '--'
  };

  recentOperations: Operation[] = [];
  allOperations: Operation[] = [];

  constructor(
    private clientService: ClientService,
    private auth: Auth,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadUserInfo();
    this.loadData();
  }

  loadUserInfo() {
    const user = this.auth.getUserInfo();
    if (user) {
      this.accountInfo.fullName = user.name;
      this.accountInfo.email = user.email;
      // Note: accountNumber and balance are not currently provided by the API
    }
  }

  loadData() {
    this.clientService.getOperations().subscribe({
      next: (data) => {
        this.allOperations = data;
        this.recentOperations = data.slice(0, 4);

        // Optional: Calculate totals from operations if needed
        this.calculateBalance(data);
      },
      error: (err) => console.error('Error fetching operations', err)
    });
  }

  calculateBalance(ops: Operation[]) {
    // Basic logic to calculate balance if not provided by backend
    this.accountInfo.balance = ops.reduce((acc, op) => {
      return op.isPositive ? acc + op.amount : acc - op.amount;
    }, 0);
  }

  showSection(sectionName: string) {
    this.currentSection = sectionName;
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  openModal(modalType: string) {
    this.activeModal = modalType;
    this.amountForFileCheck = 0;
    this.showFileSection = false;
  }

  closeModal() {
    this.activeModal = null;
  }

  onAmountChange(event: any) {
    const amount = parseFloat(event.target.value);
    this.showFileSection = amount > 10000;
  }

  handleOperation(type: string, event: Event) {
    event.preventDefault();
    const amount = (event.target as any).querySelector('input[type="number"]')?.value;
    alert(`${type} de ${amount} DH créé avec succès!\n${parseFloat(amount) > 10000 ? 'En attente de validation (montant > 10 000 DH)' : 'Validé automatiquement'}`);
    this.closeModal();
  }

  viewDocument(id: number) {
    this.clientService.getOperationDocument(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url);
      },
      error: (err) => alert('Impossible de charger le document.')
    });
  }

  logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.auth.logout();
    }
  }
}
