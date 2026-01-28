import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Operation } from './client';

export interface OperationValidationRequest {
    comment?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AgentService {
    private apiUrl = 'http://localhost:8080/api/agent/operations';

    constructor(private http: HttpClient) { }

    getPendingOperations(): Observable<Operation[]> {
        return this.http.get<Operation[]>(`${this.apiUrl}/pending`);
    }

    approveOperation(id: number, comment?: string): Observable<Operation> {
        const body: OperationValidationRequest = { comment };
        return this.http.put<Operation>(`${this.apiUrl}/${id}/approve`, body);
    }

    rejectOperation(id: number, comment?: string): Observable<Operation> {
        const body: OperationValidationRequest = { comment };
        return this.http.put<Operation>(`${this.apiUrl}/${id}/reject`, body);
    }
}
