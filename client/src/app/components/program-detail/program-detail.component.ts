import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ProgramDetail, Study, Milestone } from '../../models/types';
import {
  RowComponent, ColComponent, CardComponent, CardHeaderComponent,
  CardBodyComponent, BadgeComponent, ProgressComponent, ButtonDirective,
  TableDirective, FormControlDirective, FormSelectDirective,
  FormLabelDirective, AlertComponent, NavComponent, NavItemComponent,
  NavLinkDirective, TabContentComponent, TabPaneComponent
} from '@coreui/angular';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    RowComponent, ColComponent, CardComponent, CardHeaderComponent,
    CardBodyComponent, BadgeComponent, ProgressComponent, ButtonDirective,
    TableDirective, FormControlDirective, FormSelectDirective,
    FormLabelDirective, AlertComponent, NavComponent, NavItemComponent,
    NavLinkDirective, TabContentComponent, TabPaneComponent
  ],
  templateUrl: './program-detail.component.html',
})
export class ProgramDetailComponent implements OnInit {
  program = signal<ProgramDetail | null>(null);
  loading = signal(true);
  editing = signal(false);
  saving = signal(false);
  activeTab = signal<'studies' | 'milestones'>('studies');
  editingMilestone = signal<string | null>(null);
  successMessage = signal('');

  editData: any = {};
  editMilestoneStatus = '';
  editMilestoneDate = '';

  phases = ['Discovery', 'Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved'];
  statuses = ['Active', 'On Hold', 'Terminated', 'Completed'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadProgram(id);
  }

  loadProgram(id: string) {
    this.loading.set(true);
    this.api.getProgram(id).subscribe({
      next: (data) => {
        this.program.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goBack() {
    this.router.navigate(['/programs']);
  }

  startEdit() {
    const p = this.program()!;
    this.editData = {
      name: p.name,
      phase: p.phase,
      status: p.status,
      therapeutic_area: p.therapeutic_area,
      indication: p.indication,
      molecule_type: p.molecule_type || '',
      target: p.target || '',
      description: p.description || '',
      lead: p.lead || '',
      start_date: p.start_date || '',
      expected_end_date: p.expected_end_date || '',
    };
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  saveEdit() {
    this.saving.set(true);
    this.api.updateProgram(this.program()!.id, this.editData).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.successMessage.set('Program updated successfully');
        setTimeout(() => this.successMessage.set(''), 3000);
        this.loadProgram(this.program()!.id);
      },
      error: () => this.saving.set(false)
    });
  }

  startEditMilestone(m: Milestone) {
    this.editingMilestone.set(m.id);
    this.editMilestoneStatus = m.status;
    this.editMilestoneDate = m.actual_date || '';
  }

  saveMilestone(m: Milestone) {
    this.api.updateMilestone(m.id, {
      status: this.editMilestoneStatus as any,
      actual_date: this.editMilestoneDate || undefined,
    }).subscribe({
      next: () => {
        this.editingMilestone.set(null);
        this.successMessage.set('Milestone updated');
        setTimeout(() => this.successMessage.set(''), 3000);
        this.loadProgram(this.program()!.id);
      }
    });
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
      'Planning': 'info', 'Recruiting': 'info',
      'Enrolling': 'primary',
    };
    return m[status] || 'secondary';
  }

  getCategoryColor(cat: string): string {
    const m: Record<string, string> = {
      'Regulatory': 'info', 'Clinical': 'success',
      'Manufacturing': 'warning', 'Commercial': 'primary',
    };
    return m[cat] || 'secondary';
  }

  getMilestoneStatusColor(status: string): string {
    const m: Record<string, string> = {
      'Pending': 'secondary', 'In Progress': 'info',
      'Completed': 'success', 'Delayed': 'danger', 'Cancelled': 'dark',
    };
    return m[status] || 'secondary';
  }

  getEnrollmentPct(study: Study): number {
    if (!study.target_enrollment) return 0;
    return Math.min(100, (study.current_enrollment / study.target_enrollment) * 100);
  }

  getEnrollmentColor(study: Study): string {
    const pct = this.getEnrollmentPct(study);
    if (pct >= 90) return 'success';
    if (pct >= 50) return 'primary';
    if (pct >= 25) return 'warning';
    return 'danger';
  }
}
