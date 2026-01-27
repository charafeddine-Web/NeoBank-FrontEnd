import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClientService, Operation } from '../core/services/client';
import { Auth } from '../core/services/auth';
import { Subscription } from 'rxjs';
import { routes } from '../app.routes';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-dashboard.html',
  styleUrls: ['./client-dashboard.css'],
})
export class ClientDashboard implements OnInit, OnDestroy {
  currentSection = 'dashboard';
  isMobileMenuOpen = false;
  activeModal: string | null = null;
  amountForFileCheck = 0;
  showFileSection = false;
  selectedFile: File | null = null;
  private authSub: Subscription | null = null;

  accountInfo: any = {
    fullName: 'Chargement...',
    role: '',
    email: '',
    accountNumber: '...',
    balance: 0,
    pendingOperations: 0,
    createdAt: '--/--/----',
    lastLogin: 'Session active',
    lastIp: '--'
  };
  errorMessage: string | null = null;
  recentOperations: Operation[] = [];
  allOperations: Operation[] = [];

  constructor(
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
        this.cdr.markForCheck();
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
      this.accountInfo.role = user.role || 'Client';
    }
  }

  loadData() {
    this.clientService.getOperations().subscribe({
      next: (data) => {
        const mappedInfo = data.map((op: any) => ({
          ...op,
          date: this.formatDate(op.createdAt),
          isPositive: op.type === 'DEPOSIT' || (op.type === 'TRANSFER' && op.destinationAccountNumber === this.accountInfo.accountNumber),
          hasFile: op.hasFile || false,
          status: (op.status || '').toLowerCase(),
          originalType: op.type,
          type: this.getFriendlyType(op.type)
        }));

        this.allOperations = mappedInfo.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        this.recentOperations = this.allOperations.slice(0, 4);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching operations', err)
    });

    this.clientService.getAccountInfo().subscribe({
      next: (data) => {
        this.accountInfo.accountNumber = data.accountNumber;
        this.accountInfo.balance = data.balance;
        this.errorMessage = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching account info', err);
        this.errorMessage = "Votre compte bancaire n'a pas été trouvé. Veuillez contacter un agent.";
        this.cdr.markForCheck();
      }
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  handleOperation(type: string, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const amountInput = form.querySelector('input[type="number"]') as HTMLInputElement;
    const descriptionInput = form.querySelector('textarea') as HTMLTextAreaElement;
    const beneficiaryInput = form.querySelector('input[placeholder*="RIB"]') as HTMLInputElement;

    const amount = parseFloat(amountInput?.value || '0');
    const description = descriptionInput?.value || '';
    const beneficiary = beneficiaryInput?.value || '';

    if (amount <= 0) return;

    if ((type === 'withdrawal' || type === 'transfer') && amount > this.accountInfo.balance) {
      alert(`Opération impossible : Solde insuffisant. Votre solde actuel est de ${this.accountInfo.balance.toFixed(2)} DH.`);
      return;
    }

    if (this.showFileSection && !this.selectedFile) {
      alert('Veuillez téléverser un justificatif pour les opérations supérieures à 10 000 DH.');
      return;
    }

    const operationDto = {
      amount: amount,
      type: type.toUpperCase(),
      sourceAccountNumber: this.accountInfo.accountNumber,
      destinationAccountNumber: beneficiary,
      description: beneficiary ? `Virement vers: ${beneficiary}. ${description}` : description,
      date: new Date().toISOString()
    };

    this.clientService.createOperation(operationDto).subscribe({
      next: (newItem) => {
        if (this.showFileSection && this.selectedFile) {
          this.clientService.uploadDocument(newItem.id, this.selectedFile).subscribe({
            next: () => {
              alert('Opération créée et document téléversé avec succès!');
              this.finalizeOperation();
            },
            error: (err) => {
              console.error('Error uploading document', err);
              alert('Opération créée mais erreur lors de l\'envoi du document.');
              this.finalizeOperation();
            }
          });
        } else {
          alert('Opération créée avec succès!');
          this.finalizeOperation();
        }
      },
      error: (err) => {
        console.error('Error creating operation', err);
        const serverMsg = err.error?.message || 'Erreur lors de la création de l\'opération.';
        alert(`Échec de l'opération : ${serverMsg}`);
      }
    });
  }

  private finalizeOperation() {
    this.closeModal();
    this.loadData();
    this.selectedFile = null;
    this.showFileSection = false;
    this.amountForFileCheck = 0;
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
