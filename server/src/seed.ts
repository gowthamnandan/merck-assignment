import db, { initializeDatabase } from './database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

initializeDatabase();

// Clear existing data
db.exec('DELETE FROM milestones; DELETE FROM studies; DELETE FROM programs; DELETE FROM users;');

// ─── Users ─────────────────────────────────────────
const users = [
  { username: 'admin', password: 'admin123', role: 'admin', full_name: 'System Admin', email: 'admin@pharma.com' },
  { username: 'pm_jones', password: 'pass123', role: 'portfolio_manager', full_name: 'Dr. Sarah Jones', email: 'sjones@pharma.com' },
  { username: 'pm_smith', password: 'pass123', role: 'portfolio_manager', full_name: 'Dr. Robert Smith', email: 'rsmith@pharma.com' },
  { username: 'viewer', password: 'view123', role: 'viewer', full_name: 'Jane Viewer', email: 'jviewer@pharma.com' },
];

const insertUser = db.prepare('INSERT INTO users (id, username, password_hash, role, full_name, email) VALUES (?, ?, ?, ?, ?, ?)');
for (const u of users) {
  insertUser.run(uuidv4(), u.username, bcrypt.hashSync(u.password, 10), u.role, u.full_name, u.email);
}
console.log(`✓ Seeded ${users.length} users`);

// ─── Therapeutic areas & indications ────────────────
const therapeuticAreas = ['Oncology', 'Immunology', 'Neuroscience', 'Cardiovascular', 'Rare Diseases', 'Infectious Diseases', 'Metabolic Disorders', 'Ophthalmology'];
const phases = ['Discovery', 'Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved'] as const;
const statuses = ['Active', 'On Hold', 'Terminated', 'Completed'] as const;
const moleculeTypes = ['Small Molecule', 'Monoclonal Antibody', 'Bispecific Antibody', 'ADC', 'Gene Therapy', 'Cell Therapy', 'mRNA', 'Peptide'];

const indicationsByArea: Record<string, string[]> = {
  'Oncology': ['Non-Small Cell Lung Cancer', 'Breast Cancer', 'Colorectal Cancer', 'Melanoma', 'Hepatocellular Carcinoma', 'Pancreatic Cancer', 'Prostate Cancer', 'Ovarian Cancer'],
  'Immunology': ['Rheumatoid Arthritis', 'Psoriasis', 'Lupus', 'Atopic Dermatitis', 'Ulcerative Colitis', "Crohn's Disease", 'Multiple Sclerosis'],
  'Neuroscience': ["Alzheimer's Disease", "Parkinson's Disease", 'Major Depressive Disorder', 'Schizophrenia', 'Migraine', 'Epilepsy', 'ALS'],
  'Cardiovascular': ['Heart Failure', 'Atrial Fibrillation', 'Hypertension', 'Atherosclerosis', 'Pulmonary Arterial Hypertension'],
  'Rare Diseases': ['Spinal Muscular Atrophy', 'Duchenne Muscular Dystrophy', "Fabry Disease", "Gaucher Disease", 'Hemophilia A', 'PKU'],
  'Infectious Diseases': ['HIV', 'Hepatitis B', 'RSV', 'Influenza', 'Tuberculosis', 'COVID-19'],
  'Metabolic Disorders': ['Type 2 Diabetes', 'Obesity', 'NASH', 'Dyslipidemia', 'Gout'],
  'Ophthalmology': ['Age-Related Macular Degeneration', 'Diabetic Retinopathy', 'Glaucoma', 'Dry Eye Disease'],
};

const targets: Record<string, string[]> = {
  'Oncology': ['PD-1', 'PD-L1', 'HER2', 'EGFR', 'KRAS G12C', 'VEGF', 'CDK4/6', 'FGFR', 'MET', 'BRAF V600E'],
  'Immunology': ['TNF-α', 'IL-17', 'IL-23', 'JAK1', 'JAK1/2', 'IL-4/IL-13', 'S1P Receptor', 'BTK'],
  'Neuroscience': ['Amyloid-β', 'Tau', 'NMDA Receptor', 'CGRP', 'SV2A', 'α-Synuclein', 'GLP-1R'],
  'Cardiovascular': ['PCSK9', 'SGLT2', 'Angiotensin II', 'Factor Xa', 'Endothelin Receptor'],
  'Rare Diseases': ['SMN2', 'Dystrophin', 'GLA', 'GBA', 'Factor VIII'],
  'Infectious Diseases': ['Integrase', 'Protease', 'Neuraminidase', 'Spike Protein', 'Reverse Transcriptase'],
  'Metabolic Disorders': ['GLP-1R', 'GIP/GLP-1R', 'FXR', 'PPAR', 'URAT1'],
  'Ophthalmology': ['VEGF-A', 'Ang-2', 'C5', 'Complement Factor D'],
};

const leads = ['Dr. Sarah Jones', 'Dr. Robert Smith', 'Dr. Emily Chen', 'Dr. Michael Patel', 'Dr. Lisa Wang', 'Dr. James Wilson', 'Dr. Maria Garcia', 'Dr. David Kim'];

function randomDate(startYear: number, endYear: number): string {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Programs (50 programs) ────────────────────────
const insertProgram = db.prepare(`
  INSERT INTO programs (id, name, code, therapeutic_area, phase, status, indication, molecule_type, target, description, lead, start_date, expected_end_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertStudy = db.prepare(`
  INSERT INTO studies (id, program_id, name, protocol_number, phase, status, target_enrollment, current_enrollment, start_date, end_date, sites_count, countries, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMilestone = db.prepare(`
  INSERT INTO milestones (id, program_id, study_id, title, description, category, status, planned_date, actual_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const programIds: string[] = [];
const studyStatuses = ['Planned', 'Recruiting', 'Active', 'Completed', 'Terminated', 'Suspended'] as const;
const milestoneCategories = ['Regulatory', 'Clinical', 'Manufacturing', 'Commercial', 'Other'] as const;
const milestoneStatuses = ['Pending', 'In Progress', 'Completed', 'Delayed'] as const;

const seedTransaction = db.transaction(() => {
  let programCount = 0;
  let studyCount = 0;
  let milestoneCount = 0;

  for (let i = 0; i < 50; i++) {
    const area = therapeuticAreas[i % therapeuticAreas.length];
    const indications = indicationsByArea[area];
    const areaTargets = targets[area];
    const phase = phases[Math.floor(Math.random() * phases.length)];
    const status = Math.random() > 0.15 ? 'Active' : pick([...statuses]);
    const programId = uuidv4();
    programIds.push(programId);

    const code = `${area.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
    const indication = pick(indications);
    const mol = pick(moleculeTypes);
    const tgt = pick(areaTargets);
    const startDate = randomDate(2019, 2024);
    const endDate = randomDate(2025, 2030);

    insertProgram.run(
      programId,
      `${mol} ${tgt} for ${indication}`,
      code,
      area,
      phase,
      status,
      indication,
      mol,
      tgt,
      `A ${phase.toLowerCase()} program investigating ${mol.toLowerCase()} targeting ${tgt} for the treatment of ${indication.toLowerCase()}.`,
      pick(leads),
      startDate,
      endDate
    );
    programCount++;

    // 2-5 studies per program
    const numStudies = 2 + Math.floor(Math.random() * 4);
    const studyIds: string[] = [];

    for (let j = 0; j < numStudies; j++) {
      const studyId = uuidv4();
      studyIds.push(studyId);
      const studyPhase = phase === 'Discovery' || phase === 'Preclinical' ? phase : phase;
      const studyStatus = pick([...studyStatuses]);
      const targetEnroll = (Math.floor(Math.random() * 10) + 1) * 50;
      const currentEnroll = studyStatus === 'Completed' ? targetEnroll : Math.floor(Math.random() * targetEnroll);
      const sites = Math.floor(Math.random() * 150) + 5;
      const countryList = ['US', 'UK', 'Germany', 'Japan', 'Canada', 'France', 'Australia', 'Brazil', 'India', 'China', 'South Korea', 'Spain', 'Italy'];
      const numCountries = Math.floor(Math.random() * 6) + 1;
      const selectedCountries = countryList.sort(() => Math.random() - 0.5).slice(0, numCountries).join(', ');

      insertStudy.run(
        studyId,
        programId,
        `${code}-Study-${j + 1}: ${indication} ${studyPhase} Trial`,
        `${code}-${String(j + 1).padStart(2, '0')}`,
        studyPhase,
        studyStatus,
        targetEnroll,
        currentEnroll,
        randomDate(2020, 2024),
        studyStatus === 'Completed' ? randomDate(2024, 2025) : null,
        sites,
        selectedCountries,
        `A ${studyPhase.toLowerCase()} clinical study evaluating ${mol.toLowerCase()} in patients with ${indication.toLowerCase()}.`
      );
      studyCount++;
    }

    // 4-8 milestones per program
    const numMilestones = 4 + Math.floor(Math.random() * 5);
    const milestoneTemplates = [
      { title: 'IND Filing', category: 'Regulatory' },
      { title: 'First Patient In', category: 'Clinical' },
      { title: 'Interim Analysis', category: 'Clinical' },
      { title: 'Primary Endpoint Readout', category: 'Clinical' },
      { title: 'NDA/BLA Submission', category: 'Regulatory' },
      { title: 'FDA Advisory Committee', category: 'Regulatory' },
      { title: 'PDUFA Date', category: 'Regulatory' },
      { title: 'Manufacturing Scale-Up', category: 'Manufacturing' },
      { title: 'Commercial Launch Planning', category: 'Commercial' },
      { title: 'EMA Submission', category: 'Regulatory' },
      { title: 'Phase Transition Review', category: 'Clinical' },
      { title: 'Data Safety Monitoring Board Review', category: 'Clinical' },
    ];

    const selected = milestoneTemplates.sort(() => Math.random() - 0.5).slice(0, numMilestones);
    for (const tmpl of selected) {
      const mStatus = pick([...milestoneStatuses]);
      const plannedDate = randomDate(2023, 2028);
      const actualDate = mStatus === 'Completed' ? randomDate(2023, 2025) : null;

      insertMilestone.run(
        uuidv4(),
        programId,
        Math.random() > 0.5 ? pick(studyIds) : null,
        tmpl.title,
        `${tmpl.title} for ${code}`,
        tmpl.category as string,
        mStatus,
        plannedDate,
        actualDate
      );
      milestoneCount++;
    }
  }

  console.log(`✓ Seeded ${programCount} programs`);
  console.log(`✓ Seeded ${studyCount} studies`);
  console.log(`✓ Seeded ${milestoneCount} milestones`);
});

seedTransaction();
console.log('\n✅ Database seeded successfully!');
console.log('\nLogin credentials:');
console.log('  Admin:             admin / admin123');
console.log('  Portfolio Manager: pm_jones / pass123');
console.log('  Portfolio Manager: pm_smith / pass123');
console.log('  Viewer:            viewer / view123');
