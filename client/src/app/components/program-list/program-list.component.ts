import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ProgramWithStats, FilterValues } from '../../models/types';
import {
  RowComponent, ColComponent, CardComponent, CardHeaderComponent,
  CardBodyComponent, FormControlDirective, FormSelectDirective,
  FormLabelDirective, InputGroupComponent, InputGroupTextDirective,
  BadgeComponent, ProgressComponent, ButtonDirective, TableDirective,
  PaginationComponent, PageItemComponent, PageLinkDirective
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-program-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    RowComponent, ColComponent, CardComponent, CardHeaderComponent,
    CardBodyComponent, FormControlDirective, FormSelectDirective,
    FormLabelDirective, InputGroupComponent, InputGroupTextDirective,
    BadgeComponent, ProgressComponent, ButtonDirective, TableDirective,
    PaginationComponent, PageItemComponent, PageLinkDirective, IconDirective
  ],
  templateUrl: './program-list.component.html',
})
export class ProgramListComponent implements OnInit {
  programs = signal<ProgramWithStats[]>([]);
  filters = signal<FilterValues | null>(null);
  loading = signal(true);
  total = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 12;
  Math = Math;

  search = '';
  filterPhase = '';
  filterArea = '';
  filterStatus = '';
  sortBy = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';

  private debounceTimer: any;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit() {
    this.api.getFilterValues().subscribe(f => this.filters.set(f));
    this.loadPrograms();
  }

  onFilterChange() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.currentPage.set(1);
      this.loadPrograms();
    }, 300);
  }

  loadPrograms() {
    this.loading.set(true);
    this.api.getPrograms({
      page: this.currentPage(),
      pageSize: this.pageSize,
      search: this.search,
      phase: this.filterPhase,
      therapeutic_area: this.filterArea,
      status: this.filterStatus,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    }).subscribe({
      next: (res) => {
        this.programs.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPrograms();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  hasActiveFilters(): boolean {
    return !!(this.filterPhase || this.filterArea || this.filterStatus);
  }

  clearFilters() {
    this.filterPhase = '';
    this.filterArea = '';
    this.filterStatus = '';
    this.search = '';
    this.onFilterChange();
  }

  getPhaseColor(phase: string): string {
    const m: Record<string, string> = {
      'Discovery': 'dark', 'Preclinical': 'secondary',
      'Phase I': 'info', 'Phase II': 'primary',
      'Phase III': 'success', 'Filed': 'warning', 'Approved': 'danger',
    };
    return m[phase] || 'secondary';
  }

  getStatusColor(status: string): string {
    const m: Record<string, string> = {
      'Active': 'success', 'On Hold': 'warning',
      'Completed': 'primary', 'Terminated': 'danger',
      'Planning': 'info',
    };
    return m[status] || 'secondary';
  }
}
