import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { AuthRequest, authenticate, authorize } from '../auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  const { program_id, study_id, status, category, page = '1', pageSize = '50' } = req.query as Record<string, string>;

  const conditions: string[] = [];
  const params: any[] = [];

  if (program_id) { conditions.push('program_id = ?'); params.push(program_id); }
  if (study_id) { conditions.push('study_id = ?'); params.push(study_id); }
  if (status) { conditions.push('status = ?'); params.push(status); }
  if (category) { conditions.push('category = ?'); params.push(category); }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageNum = Math.max(1, parseInt(page));
  const size = Math.min(100, Math.max(1, parseInt(pageSize)));
  const offset = (pageNum - 1) * size;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM milestones ${whereClause}`).get(...params) as any;
  const rows = db.prepare(`SELECT * FROM milestones ${whereClause} ORDER BY planned_date ASC LIMIT ? OFFSET ?`).all(...params, size, offset);

  res.json({
    data: rows,
    total: countRow.total,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(countRow.total / size),
  });
});

// POST /api/milestones
router.post('/', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const { program_id, study_id, title, description, category, status, planned_date, actual_date } = req.body;

  if (!program_id || !title || !category) {
    res.status(400).json({ error: 'Missing required fields: program_id, title, category' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO milestones (id, program_id, study_id, title, description, category, status, planned_date, actual_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, program_id, study_id || null, title, description || null, category, status || 'Pending', planned_date || null, actual_date || null);

  const created = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT /api/milestones/:id
router.put('/:id', authenticate, authorize('admin', 'portfolio_manager'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }

  const { title, description, category, status, planned_date, actual_date } = req.body;

  db.prepare(`
    UPDATE milestones SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      status = COALESCE(?, status),
      planned_date = COALESCE(?, planned_date),
      actual_date = COALESCE(?, actual_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(title || null, description || null, category || null, status || null, planned_date || null, actual_date || null, req.params.id);

  const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/milestones/:id
router.delete('/:id', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  const existing = db.prepare('SELECT id FROM milestones WHERE id = ?').get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'Milestone not found' });
    return;
  }
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Milestone deleted' });
});

export default router;
