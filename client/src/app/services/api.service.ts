import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProgramWithStats, ProgramDetail, Study, Milestone,
  PaginatedResponse, FilterValues, DashboardStats, Program
} from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly API = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/dashboard`);
  }

  // Programs
  getPrograms(params: Record<string, string | number>): Observable<PaginatedResponse<ProgramWithStats>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http.get<PaginatedResponse<ProgramWithStats>>(`${this.API}/programs`, { params: httpParams });
  }

  getFilterValues(): Observable<FilterValues> {
    return this.http.get<FilterValues>(`${this.API}/programs/filters`);
  }

  getProgram(id: string): Observable<ProgramDetail> {
    return this.http.get<ProgramDetail>(`${this.API}/programs/${id}`);
  }

  createProgram(data: Partial<Program>): Observable<Program> {
    return this.http.post<Program>(`${this.API}/programs`, data);
  }

  updateProgram(id: string, data: Partial<Program>): Observable<Program> {
    return this.http.put<Program>(`${this.API}/programs/${id}`, data);
  }

  deleteProgram(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/programs/${id}`);
  }

  // Studies
  getStudies(params: Record<string, string | number>): Observable<PaginatedResponse<Study>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http.get<PaginatedResponse<Study>>(`${this.API}/studies`, { params: httpParams });
  }

  updateStudy(id: string, data: Partial<Study>): Observable<Study> {
    return this.http.put<Study>(`${this.API}/studies/${id}`, data);
  }

  // Milestones
  getMilestones(params: Record<string, string | number>): Observable<PaginatedResponse<Milestone>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        httpParams = httpParams.set(key, String(val));
      }
    });
    return this.http.get<PaginatedResponse<Milestone>>(`${this.API}/milestones`, { params: httpParams });
  }

  updateMilestone(id: string, data: Partial<Milestone>): Observable<Milestone> {
    return this.http.put<Milestone>(`${this.API}/milestones/${id}`, data);
  }
}
