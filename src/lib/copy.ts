/**
 * Central strings dictionary for Detective Bureau.
 * Swap / extend these with your own in-world copy — the landing page
 * pulls everything from here so nothing is hardcoded in the JSX.
 */
export const copy = {
  brand: {
    mark: 'DB',
    wordmark: 'Detective Bureau',
  },
  nav: {
    cases: 'Official Cases',
    how: 'How It Works',
    about: 'About',
    enter: 'Enter the Bureau',
  },
  hero: {
    headline: 'Detective Bureau',
    tagline: 'Investigate. Analyze. Uncover.',
    body: 'No multiple choice. No dialogue trees. No scripted path. Question anyone, in any order, in your own words — and earn every truth you find.',
    cta: 'Enter the Bureau',
    ctaHref: '/cases',
    typingLines: [
      'You may question anyone.',
      'In any order you choose.',
      'In your own words.',
      'Nothing here is handed to you.',
      'Every case is dealt once.',
      'The accusation is yours to make.',
    ] as string[],
  },
  directive: {
    kicker: 'Bureau Directive No. 001',
    title: 'Terms of the Investigation',
    stamp: 'ISSUED UNDER SEAL',
    clauses: [
      {
        no: 'I',
        heading: 'Freedom of Inquiry',
        text: 'You are not confined to a list of questions. Address any suspect or witness directly, in plain language, and pursue whatever thread you deem worthy.',
      },
      {
        no: 'II',
        heading: 'Evidence Is Earned',
        text: 'Nothing is placed in your hands. Facts surface only through the questions you think to ask. A thread left unpulled stays hidden.',
      },
      {
        no: 'III',
        heading: 'The Accusation Is Binding',
        text: 'To name a killer is a formal act. Two wrong accusations and the case goes cold — closed, filed, and beyond your reach.',
      },
      {
        no: 'IV',
        heading: 'Every File Is Singular',
        text: 'No two cases share a killer, a motive, or a truth. Each dossier is generated once and never repeats.',
      },
    ],
  },
  demo: {
    kicker: 'Field Transcript — Live',
    title: 'A Conversation, Not a Menu',
    subtitle:
      'This is a real exchange. Ask for what you want, the way you would ask a person. The file answers in kind.',
    caseTag: 'CASE 04-117 · RIVERSIDE',
    prompt: 'I want to see all the CCTV footage covering this stretch of the promenade the night she died.',
    thinking: 'Bureau file cross-referencing surveillance records',
    response:
      "Three cameras cover the promenade. The municipal unit at the pier faces north and logged continuous footage until 23:14, when it cuts to static — maintenance ticket filed the same afternoon. A private camera at the Marlowe Hotel caught the victim passing at 22:47, alone, carrying a dark satchel that never appears in the recovered evidence. The third, a shop unit two doors down, was angled at its own doorway; useless for the walkway, but its timestamp overlaps a man loitering in-frame for eleven minutes. He's not in your suspect list. Yet.",
    followups: [
      'Who filed that maintenance ticket?',
      'Describe the man loitering.',
      'Where is the satchel now?',
    ],
  },
  archive: {
    kicker: 'Case Archive',
    title: 'Open Files',
    subtitle: 'Select a dossier to begin. Each is complete, self-contained, and dealt only once.',
    cta: 'Browse All Files',
    ctaHref: '/cases',
  },
  finalCta: {
    kicker: 'The Bureau Is Waiting',
    title: 'A Case Has Your Name On It',
    body: 'The file is sealed. The suspects are seated. Nothing will be solved until you start asking.',
    cta: 'Enter the Bureau',
    ctaHref: '/cases',
  },
  footer: {
    line: 'Detective Bureau — Investigative Division',
    note: 'All cases fictional. All confessions earned.',
  },
} as const

export type CaseFile = {
  id: string
  classification: 'RESTRICTED' | 'CONFIDENTIAL' | 'EYES ONLY'
  status: 'OPEN' | 'ARCHIVED'
  title: string
  location: string
  evidence: number
  difficulty: 'Routine' | 'Complex' | 'Cold'
}

export const caseFiles: CaseFile[] = [
  {
    id: '04-117',
    classification: 'CONFIDENTIAL',
    status: 'OPEN',
    title: 'The Promenade Drowning',
    location: 'Riverside District',
    evidence: 14,
    difficulty: 'Complex',
  },
  {
    id: '02-089',
    classification: 'RESTRICTED',
    status: 'OPEN',
    title: 'A Death at the Gala',
    location: 'Halloway Estate',
    evidence: 9,
    difficulty: 'Routine',
  },
  {
    id: '07-231',
    classification: 'EYES ONLY',
    status: 'OPEN',
    title: 'The Last Tenant',
    location: 'Ashcroft Apartments',
    evidence: 21,
    difficulty: 'Cold',
  },
  {
    id: '01-044',
    classification: 'CONFIDENTIAL',
    status: 'ARCHIVED',
    title: 'Nightshift at the Cannery',
    location: 'Dockside',
    evidence: 12,
    difficulty: 'Complex',
  },
  {
    id: '05-160',
    classification: 'RESTRICTED',
    status: 'OPEN',
    title: 'The Understudy',
    location: 'Orpheum Theatre',
    evidence: 16,
    difficulty: 'Complex',
  },
  {
    id: '03-102',
    classification: 'EYES ONLY',
    status: 'ARCHIVED',
    title: 'Cold Coffee, Colder Motive',
    location: 'Financial Quarter',
    evidence: 18,
    difficulty: 'Cold',
  },
]
