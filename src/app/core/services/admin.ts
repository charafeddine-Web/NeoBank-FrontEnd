import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = 'http://localhost:8080/api/admin/users';

    constructor(private http: HttpClient) { }

    listUsers(): Observable<UserResponse[]> {
        return this.http.get<UserResponse[]>(this.apiUrl);
    }

    createUser(user: any): Observable<UserResponse> {
        return this.http.post<UserResponse>(this.apiUrl, user);
    }

    updateUser(id: number, user: any): Observable<UserResponse> {
        return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, user);
    }

    activateUser(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/activate`, {});
    }

    suspendUser(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/suspend`, {});
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Operation Management
    private opApiUrl = 'http://localhost:8080/api/admin/operations';

    listOperations(status?: string): Observable<any[]> {
        const url = status ? `${this.opApiUrl}?status=${status}` : this.opApiUrl;
        return this.http.get<any[]>(url);
    }

    forceApprove(id: number, comment?: string): Observable<any> {
        return this.http.put<any>(`${this.opApiUrl}/${id}/force-approve`, comment || "Approbation forcée par l'administrateur");
    }

    forceReject(id: number, comment: string): Observable<any> {
        return this.http.put<any>(`${this.opApiUrl}/${id}/force-reject`, comment);
    }
}
