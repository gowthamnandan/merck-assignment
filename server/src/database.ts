import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'portfolio.db');
const db: Database.Database = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'portfolio_manager', 'viewer')),
      full_name TEXT NOT NULL,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      therapeutic_area TEXT NOT NULL,
      phase TEXT NOT NULL CHECK(phase IN ('Discovery', 'Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved')),
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'On Hold', 'Terminated', 'Completed')),
      indication TEXT NOT NULL,
      molecule_type TEXT,
      target TEXT,
      description TEXT,
      lead TEXT,
      start_date TEXT,
      expected_end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS studies (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      name TEXT NOT NULL,
      protocol_number TEXT UNIQUE NOT NULL,
      phase TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned', 'Recruiting', 'Active', 'Completed', 'Terminated', 'Suspended')),
      target_enrollment INTEGER NOT NULL DEFAULT 0,
      current_enrollment INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      sites_count INTEGER DEFAULT 0,
      countries TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      study_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL CHECK(category IN ('Regulatory', 'Clinical', 'Manufacturing', 'Commercial', 'Other')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Completed', 'Delayed', 'Cancelled')),
      planned_date TEXT,
      actual_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE SET NULL
    );

    -- Indexes for fast filtering and pagination
    CREATE INDEX IF NOT EXISTS idx_programs_phase ON programs(phase);
    CREATE INDEX IF NOT EXISTS idx_programs_therapeutic_area ON programs(therapeutic_area);
    CREATE INDEX IF NOT EXISTS idx_programs_status ON programs(status);
    CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);
    CREATE INDEX IF NOT EXISTS idx_studies_program_id ON studies(program_id);
    CREATE INDEX IF NOT EXISTS idx_studies_status ON studies(status);
    CREATE INDEX IF NOT EXISTS idx_milestones_program_id ON milestones(program_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_study_id ON milestones(study_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
  `);
}

export default db;
