import api from './api';
import type { IncidentCurrentResponse, IncidentHintResponse, IncidentPublic } from '../types/incident';

export const incidentService = {
  async getAllIncidents(): Promise<IncidentPublic[]> {
    const response = await api.get<IncidentPublic[]>('/incidents');
    return response.data;
  },

  async getCurrentIncident(): Promise<IncidentCurrentResponse> {
    const response = await api.get<IncidentCurrentResponse>('/incidents/current');
    return response.data;
  },

  async getHint(incidentId: string): Promise<IncidentHintResponse> {
    const response = await api.post<IncidentHintResponse>(`/incidents/${incidentId}/hint`);
    return response.data;
  }
};
