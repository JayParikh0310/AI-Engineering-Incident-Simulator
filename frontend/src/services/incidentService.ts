import api from './api';
import type { IncidentCurrentResponse, IncidentHintResponse } from '../types/incident';

export const incidentService = {
  async getCurrentIncident(): Promise<IncidentCurrentResponse> {
    const response = await api.get<IncidentCurrentResponse>('/incidents/current');
    return response.data;
  },

  async getHint(incidentId: string): Promise<IncidentHintResponse> {
    const response = await api.post<IncidentHintResponse>(`/incidents/${incidentId}/hint`);
    return response.data;
  }
};
