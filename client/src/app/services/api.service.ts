import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { saveAs } from 'file-saver';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    url = environment.api;

    constructor(private readonly _http: HttpClient) {}

    send(path: string, type: 'GET' | 'POST', body: any = {}): Promise<any> {
        // Custom Headers Resolved here.
        if (path === 'distribution/rich-list-snapshot') {
            return this.downloadData(path, 'balances.json');
        }

        if (type === 'GET') {
            return this._http.get<void>(`${this.url}/${path}`).toPromise();
        } else {
            return this._http.post<void>(`${this.url}/${path}`, body).toPromise();
        }
    }

    downloadData(path: string, fileName: string): Promise<void> {
        this._http
            .get<any>(`${this.url}/${path}`)
            .toPromise()
            .then((data) => {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                saveAs(blob, fileName);
            });
        return Promise.resolve();
    }
}
