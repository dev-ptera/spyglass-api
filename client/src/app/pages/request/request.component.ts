import { ChangeDetectorRef, Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { apiDocumentationPages } from '../../doc-config';
import { ApiService } from '../../services/api.service';
import { Knob } from '../../doc-config/knobs/Knob';
import { RequestService } from './request.service';
import { UserAgentService } from '../../services/user-agent.service';

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
    flipAutoShowRaw = false;
    requestType: 'POST' | 'GET';

    constructor(
        private readonly _userAgentService: UserAgentService,
        private readonly _requestService: RequestService,
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
    createResponseType(schema: string): void {
        this.requestResponseType = this._requestService.parseDtoSchema(schema);
    }

    createRequestBody(): Object {
        return this._requestService.createRequestBody(this.requestKnobs);
    }

    getDynamicPath(): string {
        if (this.requestType === 'GET' && this.requestKnobs.length > 0) {
            return this._requestService.getDynamicPath(this.requestKnobs, this.requestPath);
        }
        return this.requestPath;
    }

    isEmptyBody(): boolean {
        return this.requestType === 'GET' || JSON.stringify(this.createRequestBody()) === '{}';
    }

    showResponseType(): boolean {
        return this.requestPath !== 'account/export' && this.requestPath !== 'distribution/rich-list-snapshot';
    }

    sendRequest(): void {
        if (this.isLoading) {
            return;
        }

        if (this.flipAutoShowRaw) {
            this.showRawResponse = false;
        }
        this.flipAutoShowRaw = false;

        this.isLoading = true;
        this.requestResponse = undefined;
        this._apiService
            .send(this.getDynamicPath(), this.requestType, this.createRequestBody())
            .then((data) => {
                this.requestResponse = data;
                this.isLoading = false;
                this._ref.detectChanges();
                const scrollEl = document.getElementsByClassName('mat-sidenav-content')[0];
                const contentEl = document.getElementById('response-content');
                const width = scrollEl.clientWidth;
                if (width < 1833 && !this._userAgentService.isMobileDevice()) {
                    scrollEl.scrollTo({ top: contentEl.offsetTop + 32, behavior: 'smooth' });
                }

                /* Whenever showing an empty array as the response, show the raw response. */
                if (data && data.length === 0) {
                    this.showRawResponse = true;
                    this.flipAutoShowRaw = true;
                }
            })
            .catch((err: any) => {
                this.requestResponse = err.error;
                this.isLoading = false;
            });
    }
}
