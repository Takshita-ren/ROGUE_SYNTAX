import { WorkoutSessionSummary, StatsSummary } from '../types/pose';
import { UserProfile, WeeklyWorkoutPlan, PlanProgressMap } from '../types/plan';

export interface DbTableStatus {
  name: string;
  row_count: number;
  columns: string[];
}

export interface DbStatusResponse {
  status: string;
  database_url_masked: string;
  dialect: string;
  total_records: number;
  tables: Record<string, DbTableStatus>;
}

// Convert frontend UserProfile (camelCase) to backend UserProfileCreate (snake_case)
export const profileToBackend = (p: UserProfile, userId = 'default_user') => ({
  user_id: userId,
  height: p.height,
  height_unit: p.heightUnit,
  height_ft: p.heightFt ?? null,
  height_in: p.heightIn ?? null,
  weight: p.weight,
  weight_unit: p.weightUnit,
  age_range: p.ageRange ?? null,
  fitness_level: p.fitnessLevel,
  main_goal: p.mainGoal,
  workout_days_per_week: p.workoutDaysPerWeek,
  equipment: p.equipment,
});

// Convert backend UserProfileResponse to frontend UserProfile
export const profileFromBackend = (data: any): UserProfile => ({
  height: Number(data.height),
  heightUnit: (data.height_unit || data.heightUnit || 'cm') as 'cm' | 'ft_in',
  heightFt: data.height_ft !== undefined && data.height_ft !== null ? Number(data.height_ft) : data.heightFt,
  heightIn: data.height_in !== undefined && data.height_in !== null ? Number(data.height_in) : data.heightIn,
  weight: Number(data.weight),
  weightUnit: (data.weight_unit || data.weightUnit || 'kg') as 'kg' | 'lbs',
  ageRange: data.age_range || data.ageRange,
  fitnessLevel: data.fitness_level || data.fitnessLevel,
  mainGoal: data.main_goal || data.mainGoal,
  workoutDaysPerWeek: Number(data.workout_days_per_week || data.workoutDaysPerWeek || 3),
  equipment: data.equipment || [],
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
});

// Convert frontend WeeklyWorkoutPlan to backend WorkoutPlanCreate
export const planToBackend = (p: WeeklyWorkoutPlan, userId = 'default_user') => ({
  plan_id: p.id,
  user_id: userId,
  user_goal: p.userGoal,
  fitness_level: p.fitnessLevel,
  workout_days_per_week: p.workoutDaysPerWeek,
  equipment: p.equipment,
  days: p.days,
  weekly_guidance: p.weeklyGuidance,
  safety_disclaimer: p.safetyDisclaimer,
});

// Convert backend WorkoutPlanResponse to frontend WeeklyWorkoutPlan
export const planFromBackend = (data: any): WeeklyWorkoutPlan => ({
  id: data.plan_id || String(data.id || 'default-plan'),
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
  userGoal: data.user_goal || data.userGoal,
  fitnessLevel: data.fitness_level || data.fitnessLevel,
  workoutDaysPerWeek: Number(data.workout_days_per_week || data.workoutDaysPerWeek || 3),
  equipment: data.equipment || [],
  days: data.days || [],
  weeklyGuidance: data.weekly_guidance || data.weeklyGuidance || '',
  safetyDisclaimer: data.safety_disclaimer || data.safetyDisclaimer || '',
});

// Convert backend PlanProgressResponse to frontend PlanProgressMap
export const progressFromBackend = (res: { progress?: Record<string, any> } | null | undefined): PlanProgressMap => {
  const map: PlanProgressMap = {};
  if (!res || !res.progress) return map;
  for (const [dayNumStr, val] of Object.entries(res.progress)) {
    const dayNum = parseInt(dayNumStr, 10);
    if (!isNaN(dayNum)) {
      map[dayNum] = {
        isCompleted: Boolean(val?.is_completed),
        completedAt: val?.completed_at,
        completedExercises: Array.isArray(val?.completed_exercises) ? val.completed_exercises : [],
      };
    }
  }
  return map;
};

const RAW_API_URL: string = (import.meta.env.VITE_API_URL || '').trim();
// Strip trailing slash to prevent double-slash redirects (e.g., //api/stats/summary)
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => API_BASE_URL;

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url: string;
    if (API_BASE_URL) {
      url = `${API_BASE_URL}${cleanEndpoint}`;
    } else if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
      url = `${window.location.origin}${cleanEndpoint}`;
    } else {
      url = cleanEndpoint;
    }
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

  // Health & Database Diagnostics
  public async getHealth(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/api/health');
  }

  public async getDbStatus(): Promise<DbStatusResponse> {
    return this.request('/api/db/status');
  }

  // Workouts & Stats
  public async getStatsSummary(params: { exercise_id?: string } = {}): Promise<StatsSummary> {
    const query = new URLSearchParams();
    if (params.exercise_id) query.set('exercise_id', params.exercise_id);
    const qs = query.toString();
    return this.request(`/api/stats/summary${qs ? `?${qs}` : ''}`);
  }

  public async getWorkouts(params: {
    skip?: number;
    limit?: number;
    sort_by?: string;
    order?: string;
    exercise_id?: string;
  } = {}): Promise<WorkoutSessionSummary[]> {
    const query = new URLSearchParams();
    if (params.skip !== undefined) query.set('skip', params.skip.toString());
    if (params.limit !== undefined) query.set('limit', params.limit.toString());
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.order) query.set('order', params.order);
    if (params.exercise_id) query.set('exercise_id', params.exercise_id);

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

  // User Profile
  public async getUserProfile(userId = 'default_user'): Promise<UserProfile | null> {
    const data = await this.request<any>(`/api/profile?user_id=${encodeURIComponent(userId)}`);
    if (!data) return null;
    return profileFromBackend(data);
  }

  public async saveUserProfile(profile: UserProfile, userId = 'default_user'): Promise<UserProfile> {
    const payload = profileToBackend(profile, userId);
    const res = await this.request<any>(`/api/profile?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return profileFromBackend(res);
  }

  public async deleteUserProfile(userId = 'default_user'): Promise<{ message: string }> {
    return this.request(`/api/profile?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }

  // Workout Plan
  public async getWorkoutPlan(userId = 'default_user'): Promise<WeeklyWorkoutPlan | null> {
    const data = await this.request<any>(`/api/plan?user_id=${encodeURIComponent(userId)}`);
    if (!data) return null;
    return planFromBackend(data);
  }

  public async saveWorkoutPlan(plan: WeeklyWorkoutPlan, userId = 'default_user'): Promise<WeeklyWorkoutPlan> {
    const payload = planToBackend(plan, userId);
    const res = await this.request<any>(`/api/plan?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return planFromBackend(res);
  }

  public async updatePlanVariation(
    dayNumber: number,
    exerciseId: string,
    variationId: string,
    userId = 'default_user'
  ): Promise<WeeklyWorkoutPlan> {
    const res = await this.request<any>(`/api/plan/variation?user_id=${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify({
        day_number: dayNumber,
        exercise_id: exerciseId,
        variation_id: variationId,
      }),
    });
    return planFromBackend(res);
  }

  // Plan Progress
  public async getPlanProgress(userId = 'default_user'): Promise<PlanProgressMap> {
    const res = await this.request<{ progress: Record<string, any> }>(
      `/api/plan/progress?user_id=${encodeURIComponent(userId)}`
    );
    return progressFromBackend(res);
  }

  public async markDayCompleted(
    dayNumber: number,
    isCompleted: boolean,
    userId = 'default_user'
  ): Promise<PlanProgressMap> {
    const res = await this.request<{ progress: Record<string, any> }>(
      `/api/plan/progress/day?user_id=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          day_number: dayNumber,
          is_completed: isCompleted,
        }),
      }
    );
    return progressFromBackend(res);
  }

  public async toggleExerciseCompleted(
    dayNumber: number,
    exerciseId: string,
    userId = 'default_user'
  ): Promise<PlanProgressMap> {
    const res = await this.request<{ progress: Record<string, any> }>(
      `/api/plan/progress/exercise?user_id=${encodeURIComponent(userId)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          day_number: dayNumber,
          exercise_id: exerciseId,
        }),
      }
    );
    return progressFromBackend(res);
  }

  public async resetPlanProgress(userId = 'default_user'): Promise<{ message: string; deleted_count: number }> {
    return this.request(`/api/plan/progress?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

