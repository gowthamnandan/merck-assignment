export interface User {
  id: string;
  username: string;
  role: 'admin' | 'portfolio_manager' | 'viewer';
  full_name: string;
  email?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type Phase = 'Discovery' | 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Filed' | 'Approved';
export type ProgramStatus = 'Active' | 'On Hold' | 'Terminated' | 'Completed';
export type StudyStatus = 'Planned' | 'Recruiting' | 'Active' | 'Completed' | 'Terminated' | 'Suspended';
export type MilestoneCategory = 'Regulatory' | 'Clinical' | 'Manufacturing' | 'Commercial' | 'Other';
export type MilestoneStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed' | 'Cancelled';

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

export interface ProgramDetail extends Program {
  studies: Study[];
  milestones: Milestone[];
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
  program_name?: string;
  program_code?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterValues {
  phases: string[];
  therapeutic_areas: string[];
  statuses: string[];
}

export interface DashboardStats {
  totalPrograms: number;
  totalStudies: number;
  totalEnrollment: number;
  targetEnrollment: number;
  byPhase: Record<string, number>;
  byTherapeuticArea: Record<string, number>;
  byStatus: Record<string, number>;
  upcomingMilestones: Milestone[];
  enrollmentByPhase: { phase: string; current_enrollment: number; target_enrollment: number }[];
}
