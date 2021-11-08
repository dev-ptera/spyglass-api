import { Component } from '@angular/core';
import { DrawerLayoutVariantType } from '@pxblue/angular-components';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { APP_NAV_ITEMS, NavItem } from './nav-items';
import { ViewportService } from '../services/viewport.service';
import { DrawerStateService } from '../services/drawer-state.service';
import * as Colors from '@pxblue/colors';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
    colors = Colors;
    isCollapsed: boolean;

    scrollContainerClassName = {
        name: 'mat-sidenav-content',
        index: 0,
    };
    toolbarTitle: string;
    routeListener: Subscription;
    variant: DrawerLayoutVariantType;
    navItems = [APP_NAV_ITEMS.representative, APP_NAV_ITEMS.supply, APP_NAV_ITEMS.network];

    scrollEl: Element;

    constructor(
        public vp: ViewportService,
        private readonly _router: Router,
        private readonly _stateService: DrawerStateService
    ) {
        this._listenForRouteChanges();
    }

    navigate(url: string): void {
        void this._router.navigateByUrl(url);
    }

    isOpen(): boolean {
        return this._stateService.getDrawerOpen();
    }

    selectItem(navItem: NavItem): void {
        if (navItem.children && navItem.children.length > 0) {
            return;
        }
        this.navigate(navItem.route);
        if (this.vp.isMediumOrLess()) {
            this._stateService.setDrawerOpen(false);
        }
    }

    selectNestedNavItem(parent: NavItem, child: NavItem): void {
        this.navigate(`${parent.route}/${child.route}`);
        if (this.vp.isMediumOrLess()) {
            this._stateService.setDrawerOpen(false);
        }
    }

    toggleDrawerOpen(): void {
        this._stateService.setDrawerOpen(!this._stateService.getDrawerOpen());
    }

    closeDrawer(): void {
        this._stateService.setDrawerOpen(false);
    }

    openDrawer(): void {
        this._stateService.setDrawerOpen(true);
    }

    getSelectedItem(): string {
        return this._stateService.getSelectedItem();
    }

    // Observes route changes and determines which PXB Auth page to show via route name.
    private _listenForRouteChanges(): void {
        this.routeListener = this._router.events.subscribe((route) => {
            if (route instanceof NavigationEnd) {
                const url = route.urlAfterRedirects;
                for (const route in APP_NAV_ITEMS) {
                    const routeObj = APP_NAV_ITEMS[route];
                    if (this.matchesRoute(url, routeObj)) {
                        return;
                    }
                    for (const child of routeObj.children || []) {
                        if (this.matchesRoute(url, routeObj, child)) {
                            return;
                        }
                    }
                }
            }
        });
    }

    /** Returns tree if it found the active route. */
    private matchesRoute(url: string, routeObj: NavItem, child?: NavItem): boolean {
        if (routeObj && url === `/${routeObj.route}`) {
            this.toolbarTitle = routeObj.title;
            this._stateService.setSelectedItem(routeObj.title);
            return true;
        }
        if (routeObj && child && url === `/${routeObj.route}/${child.route}`) {
            this.toolbarTitle = child.title;
            this._stateService.setSelectedItem(`${routeObj.route}/${child.route}`);
            return true;
        }
        return false;
    }

    getVariant(): DrawerLayoutVariantType {
        if (this.variant === 'persistent' && this.vp.isMediumOrLess()) {
            this._stateService.setDrawerOpen(false);
        } else if (this.variant === 'temporary' && !this.vp.isMediumOrLess()) {
            this._stateService.setDrawerOpen(true);
        }
        this.variant = this.vp.isMediumOrLess() ? 'temporary' : 'persistent';
        return this.variant;
    }
}
