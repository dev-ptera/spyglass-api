import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RequestBodyParameters, requestPages } from './requestPages';
import {ApiService} from "../../services/api.service";

@Component({
    selector: 'app-request',
    templateUrl: './request.component.html',
    styleUrls: ['./request.component.scss'],
})
export class RequestComponent {
    routeListener: Subscription;
    requestPath: string;
    requestBodyParameters: Array<RequestBodyParameters>;
    requestResponse: any;

    constructor(private readonly _router: Router,
                private readonly _apiService: ApiService) {
        this._listenForRouteChanges();
    }

    // Observes route changes, updates active requestPath and requestParams based on active route.
    private _listenForRouteChanges(): void {
        this.routeListener = this._router.events.subscribe((route) => {
            if (route instanceof NavigationEnd) {
                const url = route.urlAfterRedirects;
                console.log(url);
                for (const requestPage of requestPages) {
                    if (url === `/${requestPage.route}`) {
                        this.requestPath = requestPage.requestPath;
                        this.requestBodyParameters = requestPage.body;
                        break;
                    }
                }
            }
        });
    }

    sendRequest(): void {

        this._apiService.send(this.requestPath).then((data) => {
            console.log(data);
            this.requestResponse = data;
        });
    }
}
