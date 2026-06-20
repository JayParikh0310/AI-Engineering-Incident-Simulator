export interface UserProgress {
  user_id: string;
  skills: Record<string, { mastery: number; attempts: number }>;
  total_attempts: number;
  passed_attempts: number;
  pass_rate: number;
}
