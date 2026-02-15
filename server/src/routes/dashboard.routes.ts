import { Router, Response } from 'express';
import db from '../database';
import { AuthRequest, authenticate } from '../auth';

const router = Router();

// GET /api/dashboard — aggregate stats
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const totalPrograms = (db.prepare('SELECT COUNT(*) as c FROM programs').get() as any).c;
  const totalStudies = (db.prepare('SELECT COUNT(*) as c FROM studies').get() as any).c;
  const enrollmentRow = db.prepare('SELECT COALESCE(SUM(current_enrollment), 0) as total, COALESCE(SUM(target_enrollment), 0) as target FROM studies').get() as any;

  const byPhaseRows = db.prepare('SELECT phase, COUNT(*) as count FROM programs GROUP BY phase ORDER BY phase').all() as any[];
  const byPhase: Record<string, number> = {};
  byPhaseRows.forEach((r: any) => { byPhase[r.phase] = r.count; });

  const byAreaRows = db.prepare('SELECT therapeutic_area, COUNT(*) as count FROM programs GROUP BY therapeutic_area ORDER BY therapeutic_area').all() as any[];
  const byTherapeuticArea: Record<string, number> = {};
  byAreaRows.forEach((r: any) => { byTherapeuticArea[r.therapeutic_area] = r.count; });

  const byStatusRows = db.prepare('SELECT status, COUNT(*) as count FROM programs GROUP BY status ORDER BY status').all() as any[];
  const byStatus: Record<string, number> = {};
  byStatusRows.forEach((r: any) => { byStatus[r.status] = r.count; });

  const upcomingMilestones = db.prepare(`
    SELECT m.*, p.name as program_name, p.code as program_code
    FROM milestones m
    JOIN programs p ON p.id = m.program_id
    WHERE m.status IN ('Pending', 'In Progress')
    AND m.planned_date IS NOT NULL
    ORDER BY m.planned_date ASC
    LIMIT 10
  `).all();

  const enrollmentByPhase = db.prepare(`
    SELECT p.phase,
      COALESCE(SUM(s.current_enrollment), 0) as current_enrollment,
      COALESCE(SUM(s.target_enrollment), 0) as target_enrollment
    FROM programs p
    LEFT JOIN studies s ON s.program_id = p.id
    GROUP BY p.phase ORDER BY p.phase
  `).all();

  res.json({
    totalPrograms,
    totalStudies,
    totalEnrollment: enrollmentRow.total,
    targetEnrollment: enrollmentRow.target,
    byPhase,
    byTherapeuticArea,
    byStatus,
    upcomingMilestones,
    enrollmentByPhase,
  });
});

export default router;
