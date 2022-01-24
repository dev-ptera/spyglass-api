import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import {
    AppBarModule,
    DrawerModule,
    EmptyStateModule,
    SpacerModule,
    ThreeLinerModule,
} from '@brightlayer-ui/angular-components';
import { ResponsiveDirective } from './directives/responsive.directive';
import { NavigationComponent } from './navigation/navigation.component';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RequestComponent } from './pages/request/request.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HomeComponent } from './pages/home/home.component';

@NgModule({
    declarations: [AppComponent, RequestComponent, ResponsiveDirective, NavigationComponent, HomeComponent],
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
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatBadgeModule,
        AppBarModule,
        ThreeLinerModule,
        MatProgressSpinnerModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
