import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Pipe } from '@angular/core';

@Pipe({ name: 'safe' })
export class SafeHtmlPipe {
    constructor(private readonly _sanitizer: DomSanitizer) {}

    transform(html: string): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(html);
    }
}
