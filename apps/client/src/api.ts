import axios from 'axios';
import type { TracesResponse, TraceResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SearchFilters {
  workflow_name?: string;
  group_id?: string;
  metadata?: Record<string, string>;
  start_date?: string;
  end_date?: string;
}

export const tracesApi = {
  getTraces: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<TracesResponse>('/traces', {
      params: { page, limit },
    });
    return response.data;
  },

  searchTraces: async (
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10
  ) => {
    const params: any = { page, limit };
    
    if (filters.workflow_name) {
      params.workflow_name = filters.workflow_name;
    }
    if (filters.group_id) {
      params.group_id = filters.group_id;
    }
    if (filters.metadata) {
      Object.entries(filters.metadata).forEach(([key, value]) => {
        params[`metadata.${key}`] = value;
      });
    }
    if (filters.start_date) {
      params.start_date = filters.start_date;
    }
    if (filters.end_date) {
      params.end_date = filters.end_date;
    }

    const response = await api.get<TracesResponse>('/traces/search', {
      params,
    });
    return response.data;
  },

  getTraceById: async (id: string) => {
    const response = await api.get<TraceResponse>(`/traces/${id}`);
    return response.data;
  },
};

