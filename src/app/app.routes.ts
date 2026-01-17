import { Routes } from '@angular/router';
import { clientGuard } from './core/guards/client-guard';
import { agentGuard } from './core/guards/agent-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [

  {path:'' , redirectTo :'login' , pathMatch :'full'},
  {
    path:'',
    loadChildren : () =>import('./auth/auth.routes').then(r => r.AUTH_ROUTES)
  },
  {
    path: 'client',
    loadComponent: () => import('./client/client-dashboard').then(c => c.ClientDashboard),
    canActivate: [clientGuard]
  },
  {
    path: 'agent',
    loadComponent: () => import('./agent/agent-dashboard').then(c => c.AgentDashboard),
    canActivate: [agentGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-dashboard').then(c => c.AdminDashboard),
    canActivate: [adminGuard]
  }


];
