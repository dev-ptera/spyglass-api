import { ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiDocumentationPages } from '../../doc-config';
import { ApiService } from '../../services/api.service';
import { RequestBodyParameters } from '../../doc-config/request-params';
import { ViewportService } from '../../services/viewport.service';
// @ts-ignore
import ApiSchema from '../../doc-config/schema.json';

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
    isLoading = false;
    showRawResponse = false;
    requestType: 'POST' | 'GET';

    constructor(
        private readonly _ref: ChangeDetectorRef,
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
                        this.createResponseType(requestPage.responseSchema);
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

    /** Reading from the JSON schema found in the doc-config folder, creates a displayable response object. */
    createResponseType(dtoType: string): void {
        let isArrray = false;
        if (dtoType && dtoType.includes('[]')) {
            isArrray = true;
            dtoType = dtoType.split('[]')[0];
        }
        const responseType = {};
        const properties = ApiSchema.definitions[dtoType].properties;
        const requiredProps = ApiSchema.definitions[dtoType].required;
        for (const prop in properties) {
            const isRequired = requiredProps.includes(prop);
            responseType[`${prop}${isRequired ? '' : '?'}`] = properties[prop].type;
        }
        this.requestResponseType = isArrray ? { array: responseType } : responseType;
    }

    sendRequest(): void {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        this.requestResponse = undefined;
        this._apiService
            .send(this.requestPath, this.requestType, this.createRequestBody())
            .then((data) => {
                this.requestResponse = data;
                this.isLoading = false;
                this._ref.detectChanges();
                const scrollEl = document.getElementsByClassName('mat-sidenav-content')[0];
                scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
            })
            .catch((err: any) => {
                this.requestResponse = err;
                this.isLoading = false;
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
