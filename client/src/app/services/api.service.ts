import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({
    providedIn: 'root',
})
export class ApiService {
    url = environment.api;

    constructor(private readonly _http: HttpClient) {}

    send(path: string, body: any = {}): Promise<any> {
        return this._http.post<void>(`${this.url}/${path}`, body).toPromise();
    }
}
