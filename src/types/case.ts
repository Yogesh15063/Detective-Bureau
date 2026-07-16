// ============================================================
// LOCKED SCHEMA — field names are fixed forever.
// Derived from case_grey_harbor_MASTER / PLAYER.
// Counts are flexible; structure is not.
// ============================================================

export interface CaseMeta {
  id: string;
  title: string;
  town: string;
  population: number;
  date_body_discovered: string;
  date_of_death: string;
  central_mystery: string;
  victim_name: string;
  why_no_direct_evidence_exists: string;
  target_evidence_count: number;
}

// Master-only fields on top of CaseMeta
export interface CaseMetaMaster extends CaseMeta {
  design_intent: string;
  pacing_guide: {
    act_1_0_to_25_percent: string;
    act_2_25_to_50_percent: string;
    act_3_50_to_70_percent: string;
    act_4_70_to_90_percent: string;
    final_10_percent: string;
  };
  note_to_ai_running_this_game: string;
}

// Player-only field on top of CaseMeta
export interface CaseMetaPlayer extends CaseMeta {
  note_for_player: string;
}

export interface WeatherLogEntry {
  date: string;
  time: string;
  condition: string;
}

export interface Weather {
  general_pattern: string;
  log: WeatherLogEntry[];
  relevance_to_case: string;
}

export interface Victim {
  name: string;
  age: number;
  occupation: string;
  physical_description: string;
  personality: string;
  family: Record<string, string>;
  current_project: string;
  last_seen_alive: string;
  missing_items: string;
}

export interface Suspect {
  id: string;
  name: string;
  age: number;
  role: string;
  relationship_to_victim: string;
  personality: string;
  motive_on_paper: string;
  secret: string;
  alibi_claim: string;
  alibi_evidence: string; // master: full truth. player: generic pointer to "check elsewhere in file"
}

export interface Witness {
  id: string;
  name: string;
  role: string;
  statement: string;
  truthfulness: string;
  reliability: string;
}

export interface Vehicle {
  owner: string;
  vehicle: string;
  relevant_movement: string;
}

export interface CctvEntry {
  camera: string;
  time_range: string;
  footage: string;
  status: string;
}

export interface PhoneCall {
  from: string;
  to: string;
  time: string;
  duration: string;
  content_summary: string;
}

export interface Message {
  from: string;
  to: string;
  time: string;
  text: string;
}

export interface Email {
  from: string;
  to: string;
  time: string;
  content_summary: string;
}

export interface BankRecord {
  account_holder: string;
  transaction: string;
  amount: string;
  purpose_established: string;
  relevance: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  searchable_objects: string[];
  possible_tests: string[];
  hidden_items: string[]; // master: real hidden finds. player: should be empty/redacted until discovered
  repeat_search_changes: string;
}

export interface BuildingLayout {
  [buildingKey: string]: {
    ground_floor?: string[];
    access_summary: string;
    [extraFloor: string]: string[] | string | undefined;
  };
}

export interface CrimeScene {
  location: string;
  condition_on_discovery: string;
  initial_assumption: string;
  actual_nature: string; // master only — reveals staging. player version should redact this.
  key_scene_contradiction: string;
}

export interface Autopsy {
  victim: string;
  cause_of_death: string;
  time_of_death_estimate: string;
  additional_findings: string[];
  conclusion: string;
}

export interface ForensicsEntry {
  item: string;
  finding: string;
  plausibility_note: string;
}

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
  location: string;
  discoverable: boolean;
  required_action: string;
  linked_evidence: string[];
  importance: "critical" | "high" | "medium" | "low";
  why_it_exists: string; // master only, ideally omitted/redacted in player.json
}

export interface RelationshipEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface TimelineEntry {
  time: string;
  event: string;
  [key: string]: unknown;
}

export interface InterrogationRecord {
  initial_interview: string;
  contradictions_presented?: string[];
  contradictions_presented_early?: string;
  contradictions_presented_late?: string[];
  pressure_points: string[];
  breaking_point?: string; // master only
  final_admission_summary?: string; // master only
  resolution_only_no_confession_summary?: string; // master only
}

export interface GameStateTemplate {
  case_id: string;
  player_progress: {
    locations_visited: string[];
    locations_researched_second_pass: string[];
    evidence_discovered: string[];
    forensic_tests_requested: string[];
    warrants_obtained: string[];
    witnesses_interviewed: string[];
    witnesses_reinterviewed: string[];
    suspects_interrogated: string[];
    contradictions_presented_to_suspects: Record<string, string[]>;
    timeline_reconstructed_percent: number;
    case_solved: boolean;
    accused_suspect: string | null;
    accusation_correct: boolean | null;
    suggested_minimum_progress_before_accusation_is_allowed_to_feel_earned: string;
    // Additional per-case boolean milestone flags (e.g. "town_dock_staging_identified")
    // are allowed and vary by case — stored as an open index signature:
    [milestoneFlag: string]: unknown;
  };
  available_actions: string[];
  win_condition: string;
  lose_condition: string;
}

// ============================================================
// Shared body — everything both master.json and player.json carry,
// modulo the master-only "solution" / "hidden_truth" sections and
// the redaction differences noted above.
// ============================================================
interface CaseBody {
  weather: Weather;
  victim: Victim;
  suspects: Suspect[];
  witnesses: Witness[];
  vehicles: Vehicle[];
  cctv: CctvEntry[];
  phone_calls: PhoneCall[];
  messages: Message[];
  emails: Email[];
  bank_records: BankRecord[];
  locations: Location[];
  building_layout: BuildingLayout;
  crime_scene: CrimeScene;
  autopsy: Autopsy;
  forensics: ForensicsEntry[];
  evidence: EvidenceItem[];
  timeline: TimelineEntry[];
  relationship_graph: RelationshipEdge[];
  interrogations: Record<string, InterrogationRecord>;
  game_state_template: GameStateTemplate;
}

// ============================================================
// MASTER CASE — full source of truth. Never sent to the AI/player.
// ============================================================
export interface MasterCase extends CaseBody {
  case: CaseMetaMaster;
  solution: {
    killer: string;
    role_cover: string;
    true_identity: string;
    true_motive: string;
    how_it_happened: string;
    weapon: string;
    time_of_death: string;
    why_no_direct_evidence_exists_for_this_specific_killer: string;
    key_proof_chain: string[];
    how_case_is_broken: string;
  };
  hidden_truth: {
    full_narrative: string;
    why_every_suspect_lied: Record<string, string>;
    why_every_red_herring_exists: string;
    exact_reasoning_path_required_to_solve_the_case: string[];
  };
}

// ============================================================
// PLAYER CASE — the only version that reaches the AI narrator.
// No "solution", no "hidden_truth", no killer flags.
// ============================================================
export interface PlayerCase extends CaseBody {
  case: CaseMetaPlayer;
}