import { Component } from '@angular/core';

@Component({
    selector: 'app-home',
    template: `
        <div class="page-container" responsive>
            <div>
                <div class="mat-display-1" style="margin-bottom: 16px">Overview</div>
                <div class="section-body">
                    <div class="mat-h3">
                        Spyglass API is an open-source & free-to-use REST API that can be used to fuel apps in the
                        <a href="https://banano.cc/" target="_blank" class="link">banano</a> ecosystem.
                    </div>
                    <div class="mat-h3" style="margin-bottom: 0">
                        It is rate-limited at 20 requests per minute per IP address & has semi-reliable uptime.  Use at your own risk in a production environment.
                    </div>
                </div>
            </div>

            <div style="margin-top: 64px">
                <div class="mat-display-1" style="margin-bottom: 16px">How to Use</div>
                <div class="section-body" style="margin-bottom: 12px">
                    <div class="mat-h3">
                        Use the navigation menu to view details about each endpoint & what data it returns.
                    </div>
                    <div class="mat-h3">
                        Each endpoint returns data through a <span style="font-family: monospace">GET</span> or
                        <span style="font-family: monospace">POST</span> request.
                    </div>
                    <div class="mat-h3" style="margin-bottom: 0">
                        Each request uses the root url below, combined with a specific API path.
                    </div>
                </div>

                <div class="section-body">
                    <div class="mat-h2 link" style="margin-bottom: 0; word-break: break-all">https://api.spyglass.pw/banano/&#60;request-path&#62;</div>
                </div>
            </div>

            <div style="margin-top: 64px">
                <div class="mat-display-1" style="margin-bottom: 16px">Contact</div>
                <div class="section-body">
                    <div class="mat-h3">
                        Suggestions or issues? Please let me know, my contact information is below. Also please feel free to post an issue
                        directly on the
                        <a href="https://github.com/dev-ptera/spyglass-api" target="_blank" class="link">github</a>.
                    </div>
                    <ul>
                        <li>
                            <div class="mat-h3"><span style="font-family: monospace">dev.ptera@gmail.com</span></div>
                        </li>
                        <li>
                            <span style="font-family: monospace; word-break: break-all">
                                https://www.reddit.com/user/dev-ptera
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
