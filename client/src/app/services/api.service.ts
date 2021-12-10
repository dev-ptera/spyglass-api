import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
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
            return this.saveRichListSnapshot(path, 'balances.json');
        }
        if (path === 'account/export') {
            return this.saveAccountTransactions(path, `tx-${body.address}.csv`, body);
        }

        if (type === 'GET') {
            return this._http.get<void>(`${this.url}/${path}`).toPromise();
        } else {
            return this._http.post<void>(`${this.url}/${path}`, body).toPromise();
        }
    }

    // distribution/rich-list-snapshot
    saveRichListSnapshot(path: string, fileName: string): Promise<void> {
        return this._http
            .get<any>(`${this.url}/${path}`)
            .toPromise()
            .then((data) => {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                saveAs(blob, fileName);
                return Promise.resolve();
            }).catch((err) => Promise.reject(err));
    }

    // account/export
    saveAccountTransactions(path: string, fileName: string, body): Promise<void> {
       return this._http
            .post(`${this.url}/${path}`, body, { responseType: 'text' })
            .toPromise()
            .then((data) => {
                console.log(data);
                const blob = new Blob([data], { type: 'application/text' });
                saveAs(blob, fileName);
                return Promise.resolve();
            }).catch((err) => {
                const jsonErr = JSON.parse(err.error);
                return Promise.reject(jsonErr);
           });
    }
}
