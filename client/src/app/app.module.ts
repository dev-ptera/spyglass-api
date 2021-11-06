import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FlexLayoutModule} from '@angular/flex-layout';

import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatDividerModule} from '@angular/material/divider';

import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {DrawerModule, EmptyStateModule, SpacerModule,} from '@pxblue/angular-components';
import {ResponsiveDirective} from './directive/responsive.directive';
import {NavigationComponent} from './navigation/navigation.component';
import {RouterModule} from '@angular/router';
import {AppRoutingModule} from './app.routing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RequestComponent} from './pages/request/request.component';
import {NgxJsonViewerModule} from 'ngx-json-viewer';
import {MatCheckboxModule} from "@angular/material/checkbox";


@NgModule({
    declarations: [AppComponent, RequestComponent, ResponsiveDirective, NavigationComponent],
    imports: [
        NgxJsonViewerModule,
        DrawerModule,
        BrowserModule,
        CommonModule,
        FlexLayoutModule,
        HttpClientModule,
        MatButtonModule,
        MatDividerModule,
        MatToolbarModule,
        MatIconModule,
        SpacerModule,
        EmptyStateModule,
        RouterModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatCheckboxModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
