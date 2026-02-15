import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats } from '../../models/types';
import {
  RowComponent, ColComponent, CardComponent, CardHeaderComponent,
  CardBodyComponent, ProgressComponent, TableDirective,
  BadgeComponent, TextColorDirective, WidgetStatFComponent,
  TemplateIdDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    RowComponent, ColComponent, CardComponent, CardHeaderComponent,
    CardBodyComponent, ProgressComponent, TableDirective,
    BadgeComponent, TextColorDirective, WidgetStatFComponent,
    TemplateIdDirective, IconDirective
  ],
  templateUrl: './dashboard.component.html',
  })
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  Math = Math;

  phaseEntries = signal<[string, number][]>([]);
  areaEntries = signal<[string, number][]>([]);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getDashboard().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.phaseEntries.set(Object.entries(data.byPhase).sort((a, b) => b[1] - a[1]));
        this.areaEntries.set(Object.entries(data.byTherapeuticArea).sort((a, b) => b[1] - a[1]));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getEnrollmentPct(): number {
    const s = this.stats();
    if (!s || s.targetEnrollment === 0) return 0;
    return (s.totalEnrollment / s.targetEnrollment) * 100;
  }

  getPhaseColor(phase: string): string {
    const colors: Record<string, string> = {
      'Discovery': 'dark', 'Preclinical': 'secondary',
      'Phase I': 'info', 'Phase II': 'primary',
      'Phase III': 'success', 'Filed': 'warning', 'Approved': 'danger',
    };
    return colors[phase] || 'secondary';
  }

  getCategoryBadgeColor(cat: string): string {
    const m: Record<string, string> = {
      'Regulatory': 'info', 'Clinical': 'success',
      'Manufacturing': 'warning', 'Commercial': 'primary',
    };
    return m[cat] || 'secondary';
  }

  getStatusBadgeColor(status: string): string {
    const m: Record<string, string> = {
      'Completed': 'success', 'On Track': 'primary',
      'At Risk': 'warning', 'Delayed': 'danger',
      'Pending': 'secondary', 'Not Started': 'light',
    };
    return m[status] || 'secondary';
  }
}
