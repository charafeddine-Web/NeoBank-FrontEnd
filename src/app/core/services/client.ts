import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Operation {
    id: number;
    date: string;
    type: string;
    amount: number;
    status: string;
    isPositive: boolean;
    hasFile: boolean;
    description?: string;
}

export interface ClientProfile {
    id: number;
    fullName: string;
    email: string;
    accountNumber: string;
    balance: number;
    pendingOperations: number;
    monthlyChange: number;
    createdAt: string;
    lastLogin?: string;
    lastIp?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private apiUrl = 'http://localhost:8080/api/client/operations';

    constructor(private http: HttpClient) { }

    getOperations(): Observable<Operation[]> {
        return this.http.get<Operation[]>(this.apiUrl);
    }

    createOperation(operation: any): Observable<Operation> {
        return this.http.post<Operation>(this.apiUrl, operation);
    }

    getOperationDocument(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/document`, { responseType: 'blob' });
    }

    uploadDocument(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('document', file);
        return this.http.post(`${this.apiUrl}/${id}/document`, formData);
    }
}
