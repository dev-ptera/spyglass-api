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
    description: string;
    pathDescriptionMap = new Map<string, string>();

    constructor(
        private readonly _userAgentService: UserAgentService,
        private readonly _requestService: RequestService,
        private readonly _ref: ChangeDetectorRef,
        private readonly _router: Router,
        private readonly _apiService: ApiService
    ) {
        this._listenForRouteChanges();
    }

    ngOnInit(): void {
        this.fetchAndParseDescriptions();
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
                        this.applyDescription(requestPage.apiPath);
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
        return (
            this.requestPath &&
            !this.requestPath.includes('account/export') &&
            !this.requestPath.includes('distribution/rich-list-snapshot')
        );
    }

    /** Using the current request path, iterates through the api->description map to find the correct description. */
    applyDescription(apiPath: string): void {
        const keys = [];
        for (const [key] of this.pathDescriptionMap) {
            keys.push(key);
        }

        const sortedByLength = keys.sort(function (a, b) {
            return b.length - a.length;
        });

        for (const route of sortedByLength) {
            if (apiPath.includes(route)) {
                console.log(route);
                this.description = this.pathDescriptionMap.get(route);
                break;
            }
        }
    }

    /** Fetches a file that has all routes & api descriptions.  Parses this file to create a map of apiPath->description */
    fetchAndParseDescriptions(): void {
        this._apiService
            .fetchDescriptions()
            .then((text) => {
                const split = text.split('####');
                const trimmed = split.map((entry) => entry.trim());
                const cleaned = trimmed.map((entry) => entry.replace(/`/g, '').split(/\r\n\r\n/));
                cleaned.map((entry) => {
                    if (entry[0].trim().length > 0) {
                        this.pathDescriptionMap.set(entry[0], entry[1]);
                    }
                });
                this.applyDescription(this.requestPath);
            })
            .catch((err) => {
                console.error('unable to fetch api descriptions');
                console.error(err);
            });
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
                // The number is determined by the screen width when the break occurs.
                if (width < 1828 + 16 && !this._userAgentService.isMobileDevice()) {
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
