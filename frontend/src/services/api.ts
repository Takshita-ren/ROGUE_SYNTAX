import { WorkoutSessionSummary, StatsSummary } from '../types/pose';

const RAW_API_URL: string = (import.meta.env.VITE_API_URL || '').trim();
// Strip trailing slash to prevent double-slash redirects (e.g., //api/stats/summary)
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => API_BASE_URL;

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        const target = API_BASE_URL || window.location.origin;
        throw new Error(
          `Unable to connect to backend server at ${target}. The server may be waking up (Render cold starts take ~45s) or offline.`
        );
      }
      throw err;
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async getHealth(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/api/health');
  }

  public async getStatsSummary(): Promise<StatsSummary> {
    return this.request('/api/stats/summary');
  }

  public async getWorkouts(params: {
    skip?: number;
    limit?: number;
    sort_by?: string;
    order?: string;
  } = {}): Promise<WorkoutSessionSummary[]> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set('skip', params.skip.toString());
    if (params.limit !== undefined) query.set('limit', params.limit.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.order) query.set('order', params.order);

    const qs = query.toString();
    return this.request(`/api/workouts${qs ? `?${qs}` : ''}`);
  }

  public async getWorkout(id: number): Promise<WorkoutSessionSummary> {
    return this.request(`/api/workouts/${id}`);
  }

  public async saveWorkout(workout: WorkoutSessionSummary): Promise<WorkoutSessionSummary> {
    return this.request('/api/workouts', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  }

  public async deleteWorkout(id: number): Promise<{ message: string; id: number }> {
    return this.request(`/api/workouts/${id}`, {
      method: 'DELETE',
    });
  }

  public async clearAllWorkouts(): Promise<{ message: string; deleted_count: number }> {
    return this.request('/api/workouts', {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
