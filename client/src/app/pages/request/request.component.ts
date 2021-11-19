import { ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiDocumentationPages } from '../../doc-config';
import { ApiService } from '../../services/api.service';
// @ts-ignore
import ApiSchema from '../../doc-config/schema.json';
import {Knob} from "../../doc-config/knobs/Knob";

@Component({
    selector: 'app-request',
    templateUrl: './request.component.html',
    styleUrls: ['./request.component.scss'],
})
export class RequestComponent {
    routeListener: Subscription;
    requestPath: string;
    requestKnobs: Array<Knob>;
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
                        this.requestKnobs = requestPage.knobs;
                        this.createResponseType(requestPage.responseSchema);
                        this.requestType = requestPage.requestType;

                        // Set parameter values (editable by user)
                        for (const param of this.requestKnobs) {
                            param.value = param.defaultValue;
                        }
                        break;
                    }
                }
            }
        });
    }

    /** Reading from the JSON schema found in the doc-service-config folder, creates a displayable response object. */
    createResponseType(dtoType: string): void {
        if (dtoType === 'string[]') {
            this.requestResponseType = { array: 'string' };
            return;
        }

        let isArray = false;
        if (dtoType && dtoType.includes('[]')) {
            isArray = true;
            dtoType = dtoType.split('[]')[0];
        }
        if (!ApiSchema || !ApiSchema.definitions || !ApiSchema.definitions[dtoType]) {
            return;
        }
        const responseType = {};
        const properties = ApiSchema.definitions[dtoType].properties;
        const requiredPropsL1 = ApiSchema.definitions[dtoType].required;

        // TODO: this needs to support multiple levels of props, maybe 4 deep.  Think recursive.
        for (const propL1 in properties) {
            const attributeL1 = `${propL1}${requiredPropsL1.includes(propL1) ? '' : '?'}`;
            responseType[attributeL1] = properties[propL1].type;
            if (properties[propL1].properties) {
                responseType[attributeL1] = {};
            }
            const requiredPropsL2 = properties[propL1].required;
            for (const propL2 in properties[propL1].properties) {
                const attributeL2 = `${propL2}${(requiredPropsL2 || []).includes(propL2) ? '' : '?'}`;
                responseType[attributeL1][attributeL2] = properties[propL1].properties[propL2].type;
            }
        }
        this.requestResponseType = isArray ? { array: responseType } : responseType;
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
                const width = scrollEl.clientWidth;
                if (width < 1833) {
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                }
            })
            .catch((err: any) => {
                this.requestResponse = err;
                this.isLoading = false;
            });
    }

    createRequestBody(): Object {
        const body = {};
        for (const param of this.requestKnobs) {
            if (
                param.value === undefined ||
                (param.value === false && (param.defaultValue === undefined || param.defaultValue === false)) ||
                (param.value === "" && (param.defaultValue === undefined || param.defaultValue === ""))
            ) {
                continue;
            }
            if (param.propertyType === 'array') {
                body[param.propertyName] = param.value.split(',');
            } else {
                body[param.propertyName] = param.value;
            }
        }
        return body;
    }

    isEmptyBody(): boolean {
        return JSON.stringify(this.createRequestBody()) === '{}';
    }
}
