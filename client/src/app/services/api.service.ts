import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
    providedIn: 'root',
})
export class ApiService {
    url = environment.api;

    constructor(private readonly _http: HttpClient) {}

    send(path: string, type: 'GET' | 'POST', body: any = {}): Promise<any> {
        if (type === 'GET') {
            return this._http.get<void>(`${this.url}/${path}`).toPromise();
        } else {
            return this._http.post<void>(`${this.url}/${path}`, body).toPromise();
        }
    }
}
