import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticate, authorize } from '../auth';
import { ProgramFilters, ProgramWithStats, Program } from '../types';

const router = Router();

// GET /api/programs — list with filtering, search, pagination
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const {
    phase,
    therapeutic_area,
    status,
    search,
    page = '1',
    pageSize = '20',
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const offset = (pageNum - 1) * size;

  const conditions: string[] = [];
  const params: any[] = [];

  if (phase) {
    conditions.push('p.phase = ?');
    params.push(phase);
  }
  if (therapeutic_area) {
    conditions.push('p.therapeutic_area = ?');
    params.push(therapeutic_area);
  }
  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  }
  if (search) {
    conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.indication LIKE ? OR p.target LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Validate sort column
  const allowedSorts = ['name', 'code', 'phase', 'therapeutic_area', 'status', 'start_date', 'created_at', 'updated_at'];
  const sort = allowedSorts.includes(sortBy) ? sortBy : 'name';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM programs p ${whereClause}`).get(...params) as any;
  const total = countRow.total;

  const rows = db.prepare(`
    SELECT p.*,
      COALESCE(s.study_count, 0) as study_count,
      COALESCE(s.current_enrollment, 0) as total_enrollment,
      COALESCE(s.target_enrollment, 0) as target_enrollment,
      COALESCE(m.milestone_count, 0) as milestone_count,
      COALESCE(m.completed_milestones, 0) as completed_milestones
    FROM programs p
    LEFT JOIN (
      SELECT program_id,
        COUNT(*) as study_count,
        SUM(current_enrollment) as current_enrollment,
        SUM(target_enrollment) as target_enrollment
      FROM studies GROUP BY program_id
    ) s ON s.program_id = p.id
    LEFT JOIN (
      SELECT program_id,
        COUNT(*) as milestone_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_milestones
      FROM milestones GROUP BY program_id
    ) m ON m.program_id = p.id
    ${whereClause}
    ORDER BY p.${sort} ${order}
    LIMIT ? OFFSET ?
  `).all(...params, size, offset) as ProgramWithStats[];

  res.json({
    data: rows,
    total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
});

// GET /api/programs/filters — get unique filter values
router.get('/filters', authenticate, (req: AuthRequest, res: Response): void => {
  const phases = db.prepare('SELECT DISTINCT phase FROM programs ORDER BY phase').all() as any[];
  const areas = db.prepare('SELECT DISTINCT therapeutic_area FROM programs ORDER BY therapeutic_area').all() as any[];
  const statuses = db.prepare('SELECT DISTINCT status FROM programs ORDER BY status').all() as any[];

  res.json({
    phases: phases.map((r: any) => r.phase),
    therapeutic_areas: areas.map((r: any) => r.therapeutic_area),
    statuses: statuses.map((r: any) => r.status),
  });
});

// GET /api/programs/:id — single program with studies & milestones
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id) as Program | undefined;
  if (!program) {
    res.status(404).json({ error: 'Program not found' });
    return;
  }

  const studies = db.prepare('SELECT * FROM studies WHERE program_id = ? ORDER BY start_date DESC').all(req.params.id);
  const milestones = db.prepare('SELECT * FROM milestones WHERE program_id = ? ORDER BY planned_date ASC').all(req.params.id);

  res.json({ ...program, studies, milestones });
});

// POST /api/programs — create program (admin, portfolio_manager)
router.post('/', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const { name, code, therapeutic_area, phase, status, indication, molecule_type, target, description, lead, start_date, expected_end_date } = req.body;

  if (!name || !code || !therapeutic_area || !phase || !indication) {
    res.status(400).json({ error: 'Missing required fields: name, code, therapeutic_area, phase, indication' });
    return;
  }

  const existing = db.prepare('SELECT id FROM programs WHERE code = ?').get(code);
  if (existing) {
    res.status(409).json({ error: 'Program code already exists' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO programs (id, name, code, therapeutic_area, phase, status, indication, molecule_type, target, description, lead, start_date, expected_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, code, therapeutic_area, phase, status || 'Active', indication, molecule_type || null, target || null, description || null, lead || null, start_date || null, expected_end_date || null);

  const created = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT /api/programs/:id — update program (admin, portfolio_manager)
router.put('/:id', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id) as Program | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Program not found' });
    return;
  }

  const { name, therapeutic_area, phase, status, indication, molecule_type, target, description, lead, start_date, expected_end_date } = req.body;

  db.prepare(`
    UPDATE programs SET
      name = COALESCE(?, name),
      therapeutic_area = COALESCE(?, therapeutic_area),
      phase = COALESCE(?, phase),
      status = COALESCE(?, status),
      indication = COALESCE(?, indication),
      molecule_type = COALESCE(?, molecule_type),
      target = COALESCE(?, target),
      description = COALESCE(?, description),
      lead = COALESCE(?, lead),
      start_date = COALESCE(?, start_date),
      expected_end_date = COALESCE(?, expected_end_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || null, therapeutic_area || null, phase || null, status || null,
    indication || null, molecule_type || null, target || null, description || null,
    lead || null, start_date || null, expected_end_date || null, req.params.id
  );

  const updated = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/programs/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM programs WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Program not found' });
    return;
  }

  db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Program deleted' });
});

export default router;
