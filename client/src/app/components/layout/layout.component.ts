import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  SidebarModule,
  ContainerComponent, HeaderComponent,
  HeaderTogglerDirective, HeaderNavComponent, NavItemComponent, NavLinkDirective,
  AvatarComponent, DropdownComponent, DropdownToggleDirective,
  DropdownMenuDirective, DropdownItemDirective, DropdownDividerDirective,
  BadgeComponent, BreadcrumbRouterComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { INavData } from '@coreui/angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    SidebarModule,
    ContainerComponent, HeaderComponent,
    HeaderTogglerDirective, HeaderNavComponent, NavItemComponent, NavLinkDirective,
    AvatarComponent, DropdownComponent, DropdownToggleDirective,
    DropdownMenuDirective, DropdownItemDirective, DropdownDividerDirective,
    BadgeComponent, BreadcrumbRouterComponent, IconDirective
  ],
  styles: [`
    :host {
      display: block;
    }
    .wrapper {
      margin-left: 256px;
      min-height: 100vh;
      transition: margin-left 0.3s;
    }
    @media (max-width: 991.98px) {
      .wrapper {
        margin-left: 0;
      }
    }
  `],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  navItems: INavData[] = [
    {
      name: 'Dashboard',
      url: '/dashboard',
      iconComponent: { name: 'cil-speedometer' },
    },
    {
      title: true,
      name: 'Portfolio'
    },
    {
      name: 'Programs',
      url: '/programs',
      iconComponent: { name: 'cil-applications' },
    },
  ];

  constructor(public auth: AuthService) {}

  getInitials(): string {
    const name = this.auth.currentUser()?.full_name || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatRole(role?: string): string {
    return role?.replace('_', ' ') || '';
  }
}
