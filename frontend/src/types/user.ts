export interface UserProgressDetail {
  user_id: string;
  current_incident_id: string | null;
  incidents_completed: number;
  total_attempts: number;
  hints_used: number;
  updated_at: string;
  current_incident_title: string | null;
  completed_incident_ids: string[];
}