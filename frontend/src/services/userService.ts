import api from './api';
import type { UserProgressDetail } from '../types/user';
import type { UserProgress } from '../types/progress';

export const userService = {
  async getMyProgress(): Promise<UserProgressDetail> {
    const response = await api.get<UserProgressDetail>('/users/me/progress');
    return response.data;
  },

  async getProgressReport(): Promise<UserProgress> {
    const response = await api.get<UserProgress>('/reports/me/progress');
    return response.data;
  },

  async assignIncident(incidentId: string): Promise<void> {
    await api.post(`/users/me/assign/${incidentId}`);
  }
};