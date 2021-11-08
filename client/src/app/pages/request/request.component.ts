import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiDocumentationPages } from '../../doc-config';
import { ApiService } from '../../services/api.service';
import { RequestBodyParameters } from '../../doc-config/request-params';
import { ViewportService } from '../../services/viewport.service';

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
    requestResponseType: any;
    requestType: 'POST' | 'GET';

    constructor(
        public vp: ViewportService,
        private readonly _router: Router,
        private readonly _apiService: ApiService
    ) {
        this._listenForRouteChanges();
    }

    // Observes route changes, updates active requestPath and requestParams based on active route.
    private _listenForRouteChanges(): void {
        this.routeListener = this._router.events.subscribe((route) => {
            if (route instanceof NavigationEnd) {
                const url = route.urlAfterRedirects;
                this.requestResponse = undefined;
                for (const requestPage of apiDocumentationPages) {
                    if (url === `/${requestPage.route}`) {
                        this.requestPath = requestPage.apiPath;
                        this.requestBodyParameters = requestPage.requestParameters;
                        this.requestResponseType = requestPage.responseType;
                        this.requestType = requestPage.requestType;

                        // Set parameter values (editable by user)
                        for (const param of this.requestBodyParameters) {
                            param.value = param.defaultValue;
                        }
                        break;
                    }
                }
            }
        });
    }

    sendRequest(): void {
        this.requestResponse = undefined;
        this._apiService.send(this.requestPath, this.requestType, this.createRequestBody()).then((data) => {
            this.requestResponse = data;
        });
    }

    createRequestBody(): Object {
        const body = {};
        for (const param of this.requestBodyParameters) {
            if (
                param.value === undefined ||
                (param.value === false && (param.defaultValue === undefined || param.defaultValue === false))
            ) {
                continue;
            }
            body[param.propertyName] = param.value;
        }
        return body;
    }

    isEmptyBody(): boolean {
        return JSON.stringify(this.createRequestBody()) === '{}';
    }
}
