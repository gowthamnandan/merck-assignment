import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticate, authorize } from '../auth';
import { Study } from '../types';

const router = Router();

// GET /api/studies?program_id=xxx — list studies for a program
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { program_id, status, page = '1', pageSize = '50' } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: any[] = [];

  if (program_id) {
    conditions.push('program_id = ?');
    params.push(program_id);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageNum = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const offset = (pageNum - 1) * size;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM studies ${whereClause}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM studies ${whereClause} ORDER BY start_date DESC LIMIT ? OFFSET ?`).all(...params, size, offset);

  res.json({
    data: rows,
    total: countRow.total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(countRow.total / size),
  });
});

// GET /api/studies/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  const study = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
  if (!study) {
    res.status(404).json({ error: 'Study not found' });
    return;
  }
  const milestones = db.prepare('SELECT * FROM milestones WHERE study_id = ? ORDER BY planned_date ASC').all(req.params.id);
  res.json({ ...(study as any), milestones });
});

// POST /api/studies
router.post('/', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const { program_id, name, protocol_number, phase, status, target_enrollment, current_enrollment, start_date, end_date, sites_count, countries, description } = req.body;

  if (!program_id || !name || !protocol_number || !phase) {
    res.status(400).json({ error: 'Missing required fields: program_id, name, protocol_number, phase' });
    return;
  }

  const program = db.prepare('SELECT id FROM programs WHERE id = ?').get(program_id);
  if (!program) {
    res.status(404).json({ error: 'Program not found' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO studies (id, program_id, name, protocol_number, phase, status, target_enrollment, current_enrollment, start_date, end_date, sites_count, countries, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, program_id, name, protocol_number, phase, status || 'Planned', target_enrollment || 0, current_enrollment || 0, start_date || null, end_date || null, sites_count || 0, countries || null, description || null);

  const created = db.prepare('SELECT * FROM studies WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT /api/studies/:id
router.put('/:id', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Study not found' });
    return;
  }

  const { name, phase, status, target_enrollment, current_enrollment, start_date, end_date, sites_count, countries, description } = req.body;

  db.prepare(`
    UPDATE studies SET
      name = COALESCE(?, name),
      phase = COALESCE(?, phase),
      status = COALESCE(?, status),
      target_enrollment = COALESCE(?, target_enrollment),
      current_enrollment = COALESCE(?, current_enrollment),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      sites_count = COALESCE(?, sites_count),
      countries = COALESCE(?, countries),
      description = COALESCE(?, description),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || null, phase || null, status || null,
    target_enrollment ?? null, current_enrollment ?? null,
    start_date || null, end_date || null,
    sites_count ?? null, countries || null, description || null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM studies WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/studies/:id
router.delete('/:id', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM studies WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Study not found' });
    return;
  }
  db.prepare('DELETE FROM studies WHERE id = ?').run(req.params.id);
  res.json({ message: 'Study deleted' });
});

export default router;
