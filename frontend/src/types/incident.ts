export type Difficulty = 'easy' | 'medium' | 'hard';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentScenario {
  service: string;
  severity: Severity;
  summary: string;
}

export interface IncidentCurrentResponse {
  id: string;
  title: string;
  difficulty: Difficulty;
  scenario: IncidentScenario;
  logs: string[];
  visible_files: string[];
  files: Record<string, string>;
}

export interface IncidentHintResponse {
  level: number;
  text: string;
}
