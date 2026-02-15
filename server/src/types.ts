export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'portfolio_manager' | 'viewer';
  full_name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  therapeutic_area: string;
  phase: Phase;
  status: ProgramStatus;
  indication: string;
  molecule_type?: string;
  target?: string;
  description?: string;
  lead?: string;
  start_date?: string;
  expected_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramWithStats extends Program {
  study_count: number;
  total_enrollment: number;
  target_enrollment: number;
  milestone_count: number;
  completed_milestones: number;
}

export interface Study {
  id: string;
  program_id: string;
  name: string;
  protocol_number: string;
  phase: string;
  status: StudyStatus;
  target_enrollment: number;
  current_enrollment: number;
  start_date?: string;
  end_date?: string;
  sites_count: number;
  countries?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  program_id: string;
  study_id?: string;
  title: string;
  description?: string;
  category: MilestoneCategory;
  status: MilestoneStatus;
  planned_date?: string;
  actual_date?: string;
  created_at: string;
  updated_at: string;
}

export type Phase = 'Discovery' | 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Filed' | 'Approved';
export type ProgramStatus = 'Active' | 'On Hold' | 'Terminated' | 'Completed';
export type StudyStatus = 'Planned' | 'Recruiting' | 'Active' | 'Completed' | 'Terminated' | 'Suspended';
export type MilestoneCategory = 'Regulatory' | 'Clinical' | 'Manufacturing' | 'Commercial' | 'Other';
export type MilestoneStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed' | 'Cancelled';
export type UserRole = 'admin' | 'portfolio_manager' | 'viewer';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProgramFilters {
  phase?: string;
  therapeutic_area?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalPrograms: number;
  byPhase: Record<string, number>;
  byTherapeuticArea: Record<string, number>;
  byStatus: Record<string, number>;
  totalStudies: number;
  totalEnrollment: number;
  upcomingMilestones: Milestone[];
}
