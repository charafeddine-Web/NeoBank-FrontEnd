import { Routes } from  '@angular/router';

export const AUTH_ROUTES: Routes=[
    {
        path : "login",
        loadComponent : ()=>{ return import('./login/login').then(c => c.Login);}
    },
    {
        path : "register",
        loadComponent : ()=>{
            return import('./register/register')
                .then(c => c.Register);
        }
    }
]
