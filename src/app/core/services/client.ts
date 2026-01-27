import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Operation {
    id: number;
    date: string;
    createdAt?: string; // from backend
    type: string;
    amount: number;
    status: string;
    isPositive: boolean;
    hasFile: boolean;
    description?: string;
    clientName?: string;
    clientEmail?: string;
}

export interface AccountInfo {
    accountNumber: string;
    balance: number;
}

@Injectable({
    providedIn: 'root'
})
export class ClientService {
    private apiUrl = 'http://localhost:8080/api/client/operations';
    private accountUrl = 'http://localhost:8080/api/client/operations/account';

    constructor(private http: HttpClient) { }

    getAccountInfo(): Observable<AccountInfo> {
        return this.http.get<AccountInfo>(this.accountUrl);
    }

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
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/${id}/document`, formData);
    }
}
