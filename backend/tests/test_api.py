import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database for testing with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "RepRight API"

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "app" in response.json()

def test_empty_stats_summary(client):
    response = client.get("/api/stats/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_workouts"] == 0
    assert data["total_reps"] == 0
    assert data["total_duration_seconds"] == 0.0
    assert data["latest_workout"] is None
    assert len(data["weekly_activity"]) == 7

def test_create_and_get_workout(client):
    start = datetime.now(timezone.utc) - timedelta(minutes=5)
    end = datetime.now(timezone.utc)
    payload = {
        "session_id": "test-session-001",
        "exercise_type": "squat",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "duration_seconds": 300.5,
        "valid_reps": 12,
        "incomplete_attempts": 2,
        "feedback_summary": [
            {"message": "Go a little deeper", "count": 3},
            {"message": "Good depth", "count": 12}
        ],
        "rep_data": [
            {
                "rep_number": 1,
                "duration_seconds": 2.4,
                "min_knee_angle": 88.5,
                "completed_at": end.isoformat(),
                "feedback": ["Good depth"],
                "side_used": "both"
            }
        ]
    }

    # Create workout
    response = client.post("/api/workouts", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["id"] is not None
    assert created["session_id"] == "test-session-001"
    assert created["valid_reps"] == 12
    assert created["incomplete_attempts"] == 2
    assert len(created["rep_data"]) == 1

    # Retrieve by ID
    get_res = client.get(f"/api/workouts/{created['id']}")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["session_id"] == "test-session-001"

    # Verify stats updated
    stats_res = client.get("/api/stats/summary")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_workouts"] == 1
    assert stats["total_reps"] == 12
    assert stats["total_duration_seconds"] == 300.5
    assert stats["latest_workout"]["id"] == created["id"]

def test_idempotent_session_creation(client):
    start = datetime.now(timezone.utc)
    end = start + timedelta(minutes=2)
    payload = {
        "session_id": "idempotent-session",
        "exercise_type": "squat",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "duration_seconds": 120.0,
        "valid_reps": 5,
        "incomplete_attempts": 0,
        "feedback_summary": [],
        "rep_data": []
    }

    res1 = client.post("/api/workouts", json=payload)
    assert res1.status_code == 201

    # Repeat with same session_id
    res2 = client.post("/api/workouts", json=payload)
    assert res2.status_code == 201
    assert res1.json()["id"] == res2.json()["id"]

    # Still only 1 workout in DB
    list_res = client.get("/api/workouts")
    assert len(list_res.json()) == 1

def test_validation_errors(client):
    # Missing required session_id and negative reps
    invalid_payload = {
        "exercise_type": "squat",
        "duration_seconds": -10,
        "valid_reps": -5
    }
    response = client.post("/api/workouts", json=invalid_payload)
    assert response.status_code == 422

def test_missing_workout_returns_404(client):
    response = client.get("/api/workouts/99999")
    assert response.status_code == 404

def test_update_workout(client):
    start = datetime.now(timezone.utc)
    payload = {
        "session_id": "session-to-update",
        "exercise_type": "squat",
        "start_time": start.isoformat(),
        "end_time": start.isoformat(),
        "duration_seconds": 60.0,
        "valid_reps": 8,
        "incomplete_attempts": 1,
        "feedback_summary": [],
        "rep_data": []
    }
    create_res = client.post("/api/workouts", json=payload)
    w_id = create_res.json()["id"]

    update_res = client.put(f"/api/workouts/{w_id}", json={"valid_reps": 10})
    assert update_res.status_code == 200
    assert update_res.json()["valid_reps"] == 10

def test_delete_workout(client):
    start = datetime.now(timezone.utc)
    payload = {
        "session_id": "session-to-delete",
        "exercise_type": "squat",
        "start_time": start.isoformat(),
        "end_time": start.isoformat(),
        "duration_seconds": 45.0,
        "valid_reps": 4,
        "incomplete_attempts": 0,
        "feedback_summary": [],
        "rep_data": []
    }
    create_res = client.post("/api/workouts", json=payload)
    w_id = create_res.json()["id"]

    del_res = client.delete(f"/api/workouts/{w_id}")
    assert del_res.status_code == 200

    # Ensure deleted
    get_res = client.get(f"/api/workouts/{w_id}")
    assert get_res.status_code == 404

def test_clear_all_workouts(client):
    start = datetime.now(timezone.utc)
    for i in range(3):
        payload = {
            "session_id": f"batch-session-{i}",
            "exercise_type": "squat",
            "start_time": start.isoformat(),
            "end_time": start.isoformat(),
            "duration_seconds": 30.0,
            "valid_reps": i + 1,
            "incomplete_attempts": 0,
            "feedback_summary": [],
            "rep_data": []
        }
        client.post("/api/workouts", json=payload)

    list_res = client.get("/api/workouts")
    assert len(list_res.json()) == 3

    clear_res = client.delete("/api/workouts")
    assert clear_res.status_code == 200
    assert clear_res.json()["deleted_count"] == 3

    list_res_after = client.get("/api/workouts")
    assert len(list_res_after.json()) == 0

def test_top_level_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "RepRight API"

def test_cors_preflight(client):
    deployed_origin = "https://rogue-syntax-mggsr6lev-rougue.vercel.app"
    response = client.options(
        "/api/stats/summary",
        headers={
            "Origin": deployed_origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type,Accept",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == deployed_origin
    assert "GET" in response.headers.get("access-control-allow-methods", "")

def test_cors_vercel_preview_regex(client):
    preview_origin = "https://rogue-syntax-preview-123.vercel.app"
    response = client.options(
        "/api/workouts",
        headers={
            "Origin": preview_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == preview_origin

def test_create_multiexercise_workouts(client):
    now = datetime.now(timezone.utc)
    
    # 1. Push-up (reps)
    pushup_res = client.post("/api/workouts", json={
        "session_id": "pushup-session-1",
        "exercise_id": "pushup",
        "exercise_type": "pushup",
        "start_time": now.isoformat(),
        "end_time": now.isoformat(),
        "duration_seconds": 90.0,
        "valid_reps": 15,
        "reps": 15,
        "hold_seconds": None,
        "incomplete_attempts": 1
    })
    assert pushup_res.status_code == 201
    data = pushup_res.json()
    assert data["exercise_id"] == "pushup"
    assert data["reps"] == 15
    assert data["hold_seconds"] is None

    # 2. Plank (hold mode)
    plank_res = client.post("/api/workouts", json={
        "session_id": "plank-session-1",
        "exercise_id": "plank",
        "exercise_type": "plank",
        "start_time": now.isoformat(),
        "end_time": now.isoformat(),
        "duration_seconds": 65.0,
        "valid_reps": 0,
        "reps": 0,
        "hold_seconds": 60.5,
        "incomplete_attempts": 0
    })
    assert plank_res.status_code == 201
    plank_data = plank_res.json()
    assert plank_data["exercise_id"] == "plank"
    assert plank_data["hold_seconds"] == 60.5

def test_exercise_filtering_and_stats(client):
    now = datetime.now(timezone.utc)
    
    # Create squat workout
    client.post("/api/workouts", json={
        "session_id": "filter-squat-1",
        "exercise_id": "squat",
        "start_time": now.isoformat(),
        "end_time": now.isoformat(),
        "duration_seconds": 100.0,
        "valid_reps": 20,
        "reps": 20
    })
    # Create pushup workout
    client.post("/api/workouts", json={
        "session_id": "filter-pushup-1",
        "exercise_id": "pushup",
        "start_time": now.isoformat(),
        "end_time": now.isoformat(),
        "duration_seconds": 80.0,
        "valid_reps": 10,
        "reps": 10
    })

    # Filter workouts by exercise_id
    pushup_list = client.get("/api/workouts?exercise_id=pushup").json()
    assert len(pushup_list) == 1
    assert pushup_list[0]["exercise_id"] == "pushup"

    squat_list = client.get("/api/workouts?exercise_id=squat").json()
    assert len(squat_list) == 1
    assert squat_list[0]["exercise_id"] == "squat"

    # Filter stats by exercise_id
    pushup_stats = client.get("/api/stats/summary?exercise_id=pushup").json()
    assert pushup_stats["total_workouts"] == 1
    assert pushup_stats["total_reps"] == 10
    assert pushup_stats["total_duration_seconds"] == 80.0

    # Overall stats includes exercise_stats breakdown
    all_stats = client.get("/api/stats/summary").json()
    assert all_stats["total_workouts"] == 2
    assert "pushup" in all_stats["exercise_stats"]
    assert all_stats["exercise_stats"]["pushup"]["workouts"] == 1
    assert all_stats["exercise_stats"]["pushup"]["reps"] == 10
    assert "squat" in all_stats["exercise_stats"]
    assert all_stats["exercise_stats"]["squat"]["workouts"] == 1
    assert all_stats["exercise_stats"]["squat"]["reps"] == 20

def test_old_row_compatibility_defaults_to_squat(client):
    from app.models.workout import Workout
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)
    # Simulate a legacy database row where exercise_id is NULL
    legacy_workout = Workout(
        session_id="legacy-old-row-1",
        exercise_type="squat",
        exercise_id=None,
        start_time=now,
        end_time=now,
        duration_seconds=150.0,
        valid_reps=10,
        incomplete_attempts=0
    )
    db.add(legacy_workout)
    db.commit()
    db.refresh(legacy_workout)
    workout_id = legacy_workout.id
    db.close()

    # Querying legacy row by ID should default exercise_id to squat in response
    res = client.get(f"/api/workouts/{workout_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["exercise_id"] == "squat"

    # Querying workouts with exercise_id=squat should include the legacy row
    squat_res = client.get("/api/workouts?exercise_id=squat")
    assert squat_res.status_code == 200
    matching = [w for w in squat_res.json() if w["session_id"] == "legacy-old-row-1"]
    assert len(matching) == 1

def test_db_status_endpoint(client):
    res = client.get("/api/db/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["dialect"] == "sqlite"
    assert "workouts" in data["tables"]
    assert "user_profiles" in data["tables"]
    assert "workout_plans" in data["tables"]
    assert "plan_progress" in data["tables"]

def test_profile_crud_endpoints(client):
    # 1. No profile initially
    res = client.get("/api/profile")
    assert res.status_code == 200
    assert res.json() is None

    # 2. Create profile
    payload = {
        "user_id": "default_user",
        "height": 178.5,
        "height_unit": "cm",
        "weight": 74.0,
        "weight_unit": "kg",
        "age_range": "26-35",
        "fitness_level": "intermediate",
        "main_goal": "weight_loss",
        "workout_days_per_week": 4,
        "equipment": ["bodyweight", "dumbbells"]
    }
    create_res = client.post("/api/profile", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["id"] is not None
    assert created["height"] == 178.5
    assert created["main_goal"] == "weight_loss"

    # 3. Retrieve profile
    get_res = client.get("/api/profile")
    assert get_res.status_code == 200
    retrieved = get_res.json()
    assert retrieved["id"] == created["id"]
    assert retrieved["weight"] == 74.0

    # 4. Update profile
    update_res = client.put("/api/profile", json={"fitness_level": "advanced", "weight": 72.5})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["fitness_level"] == "advanced"
    assert updated["weight"] == 72.5

    # 5. Delete profile
    del_res = client.delete("/api/profile")
    assert del_res.status_code == 200
    assert client.get("/api/profile").json() is None

def test_plan_and_progress_endpoints(client):
    # 1. No active plan initially
    assert client.get("/api/plan").json() is None

    # 2. Save active plan
    plan_payload = {
        "plan_id": "plan_test_123",
        "user_id": "default_user",
        "user_goal": "muscle_gain",
        "fitness_level": "intermediate",
        "workout_days_per_week": 3,
        "equipment": ["bodyweight", "dumbbells"],
        "days": [
            {
                "dayNumber": 1,
                "dayName": "Day 1 - Monday",
                "title": "Upper Body Hypertrophy",
                "isRestDay": False,
                "exercises": [
                    {
                        "id": "ex_1",
                        "exerciseId": "pushup",
                        "name": "Standard Push-Up",
                        "selectedVariationId": "standard_pushup",
                        "targetSets": 3,
                        "recommendedSetsReps": "3 sets × 10–12 reps",
                        "variations": [
                            {"id": "wall_pushup", "name": "Wall Push-Up", "recommendedSetsReps": "3 × 10"},
                            {"id": "standard_pushup", "name": "Standard Push-Up", "recommendedSetsReps": "3 × 12"}
                        ]
                    }
                ]
            }
        ],
        "weekly_guidance": "Consistency is key.",
        "safety_disclaimer": "Stop if you feel pain."
    }

    create_res = client.post("/api/plan", json=plan_payload)
    assert create_res.status_code == 201
    created_plan = create_res.json()
    assert created_plan["plan_id"] == "plan_test_123"
    assert created_plan["is_active"] is True

    # 3. Retrieve active plan
    active_plan = client.get("/api/plan").json()
    assert active_plan["plan_id"] == "plan_test_123"

    # 4. Update exercise variation
    var_res = client.put("/api/plan/variation", json={
        "day_number": 1,
        "exercise_id": "ex_1",
        "variation_id": "wall_pushup"
    })
    assert var_res.status_code == 200
    updated_plan = var_res.json()
    first_ex = updated_plan["days"][0]["exercises"][0]
    assert first_ex["selectedVariationId"] == "wall_pushup"
    assert first_ex["name"] == "Wall Push-Up"

    # 5. Mark Day 1 completed
    day_res = client.post("/api/plan/progress/day", json={"day_number": 1, "is_completed": True})
    assert day_res.status_code == 200
    prog = day_res.json()["progress"]
    assert "1" in prog
    assert prog["1"]["is_completed"] is True

    # 6. Toggle exercise completed
    ex_res = client.post("/api/plan/progress/exercise", json={"day_number": 1, "exercise_id": "ex_1"})
    assert ex_res.status_code == 200
    prog2 = ex_res.json()["progress"]
    assert "ex_1" in prog2["1"]["completed_exercises"]

    # 7. Reset progress
    reset_res = client.delete("/api/plan/progress")
    assert reset_res.status_code == 200
    assert len(client.get("/api/plan/progress").json()["progress"]) == 0



