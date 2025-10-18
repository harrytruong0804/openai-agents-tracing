import axios from 'axios';
import type { TracesResponse, TraceResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface SearchFilters {
  workflow_name?: string;
  group_id?: string;
  metadata?: Record<string, string>;
  start_date?: string;
  end_date?: string;
}

export interface LoginResponse {
  token: string;
}

export interface SetupStatusResponse {
  completed: boolean;
}

export interface SetupResponse {
  message: string;
  token: string;
}

export const authApi = {
  getSetupStatus: async () => {
    const response = await api.get<SetupStatusResponse>('/auth/setup-status');
    return response.data;
  },

  setup: async (email: string, password: string) => {
    const response = await api.post<SetupResponse>('/auth/setup', {
      email,
      password,
      role: 'ADMIN',
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};

export const tracesApi = {
  getTraces: async (
    page: number = 1,
    limit: number = 10,
    filters?: SearchFilters
  ) => {
    const params: any = { page, limit };

    if (filters) {
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
    }

    const response = await api.get<TracesResponse>('/traces', {
      params,
    });
    return response.data;
  },

  searchTraces: async (
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10
  ) => {
    return tracesApi.getTraces(page, limit, filters);
  },

  getTraceById: async (id: string) => {
    const response = await api.get<TraceResponse>(`/traces/${id}`);
    return response.data;
  },
};

export interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  prefix: string;
  suffix: string;
  createdBy: { email: string };
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  suffix: string;
  expiresAt: string | null;
  createdAt: string;
}

export const apiKeysApi = {
  createApiKey: async (name: string, expiresIn: string) => {
    const response = await api.post<CreateApiKeyResponse>('/api-keys', {
      name,
      expiresIn,
    });
    return response.data;
  },

  getApiKeys: async () => {
    const response = await api.get<{ data: ApiKey[] }>('/api-keys');
    return response.data;
  },

  getApiKeyById: async (id: string) => {
    const response = await api.get<ApiKey>(`/api-keys/${id}`);
    return response.data;
  },

  deleteApiKey: async (id: string) => {
    const response = await api.delete(`/api-keys/${id}`);
    return response.data;
  },
};

