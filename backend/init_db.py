import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend root is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base, SessionLocal, run_migrations
import app.models  # Registers Workout, UserProfile, WorkoutPlan, PlanProgress
from app.models.workout import Workout
from app.models.profile import UserProfile
from app.models.plan import WorkoutPlan, PlanProgress
from app.services import db_service

def init_database(seed_sample_data: bool = True):
    print("==================================================")
    print("RepRight AI Fitness Coach - Database Initialization")
    print("==================================================")
    print(f"Connecting to database: {engine.url}")

    # 1. Create all tables
    print("\n[1/3] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    print("✓ All tables created and verified successfully.")

    db = SessionLocal()
    try:
        # 2. Check and optionally seed sample data
        workout_count = db.query(Workout).count()
        profile_count = db.query(UserProfile).count()
        plan_count = db.query(WorkoutPlan).count()

        print(f"\n[2/3] Checking current database state:")
        print(f"  - Workouts: {workout_count}")
        print(f"  - Profiles: {profile_count}")
        print(f"  - Plans:    {plan_count}")

        if seed_sample_data and workout_count == 0:
            print("\n  Seeding initial realistic workout sessions and demo data...")
            now = datetime.now(timezone.utc)

            # Sample 1: Completed Squat Session (Yesterday)
            t1_start = now - timedelta(days=1, hours=2)
            t1_end = t1_start + timedelta(minutes=6, seconds=45)
            w1 = Workout(
                session_id="repright_seed_session_001",
                exercise_id="squat",
                exercise_type="squat",
                start_time=t1_start,
                end_time=t1_end,
                duration_seconds=405.0,
                valid_reps=15,
                incomplete_attempts=1,
                reps=15,
                hold_seconds=None,
                feedback_summary=[
                    {"message": "Chest upright and proud", "count": 14},
                    {"message": "Good depth reached parallel", "count": 15},
                    {"message": "Squat deeper next time", "count": 1}
                ],
                rep_data=[
                    {
                        "rep_number": i + 1,
                        "duration_seconds": 2.2,
                        "min_knee_angle": 92.4 - (i * 0.4),
                        "completed_at": (t1_start + timedelta(seconds=(i + 1) * 20)).isoformat(),
                        "feedback": ["Good depth", "Chest upright"],
                        "side_used": "both"
                    }
                    for i in range(15)
                ],
                created_at=t1_end
            )
            db.add(w1)

            # Sample 2: Completed Push-Up Session (2 Days Ago)
            t2_start = now - timedelta(days=2, hours=3)
            t2_end = t2_start + timedelta(minutes=5, seconds=10)
            w2 = Workout(
                session_id="repright_seed_session_002",
                exercise_id="pushup",
                exercise_type="pushup",
                start_time=t2_start,
                end_time=t2_end,
                duration_seconds=310.0,
                valid_reps=12,
                incomplete_attempts=2,
                reps=12,
                hold_seconds=None,
                feedback_summary=[
                    {"message": "Keep core tight", "count": 10},
                    {"message": "Full arm lockout", "count": 12}
                ],
                rep_data=[
                    {
                        "rep_number": i + 1,
                        "duration_seconds": 1.9,
                        "min_knee_angle": 88.0,
                        "completed_at": (t2_start + timedelta(seconds=(i + 1) * 18)).isoformat(),
                        "feedback": ["Full range reached"],
                        "side_used": "both"
                    }
                    for i in range(12)
                ],
                created_at=t2_end
            )
            db.add(w2)

            # Sample 3: Completed Plank Hold (3 Days Ago)
            t3_start = now - timedelta(days=3, hours=1)
            t3_end = t3_start + timedelta(seconds=65)
            w3 = Workout(
                session_id="repright_seed_session_003",
                exercise_id="plank",
                exercise_type="plank",
                start_time=t3_start,
                end_time=t3_end,
                duration_seconds=60.0,
                valid_reps=1,
                incomplete_attempts=0,
                reps=1,
                hold_seconds=60.0,
                feedback_summary=[
                    {"message": "Solid body line maintained", "count": 1}
                ],
                rep_data=[],
                created_at=t3_end
            )
            db.add(w3)

            # Seed initial User Profile if none exists
            if profile_count == 0:
                p = UserProfile(
                    user_id="default_user",
                    height=175.0,
                    height_unit="cm",
                    height_ft=5,
                    height_in=9,
                    weight=72.0,
                    weight_unit="kg",
                    age_range="26-35",
                    fitness_level="intermediate",
                    main_goal="general_fitness",
                    workout_days_per_week=3,
                    equipment=["bodyweight", "dumbbells"],
                    created_at=now,
                    updated_at=now
                )
                db.add(p)

            # Seed initial Day Progress
            p1 = PlanProgress(
                user_id="default_user",
                day_number=1,
                is_completed=True,
                completed_at=now - timedelta(days=1),
                completed_exercises=["squat_seed_1"],
                created_at=now,
                updated_at=now
            )
            db.add(p1)

            db.commit()
            print("✓ Seed data inserted successfully.")
        else:
            print("  Database already has data. Skipping demo seed.")

        # 3. Final Diagnostic Summary
        print("\n[3/3] Database Diagnostics:")
        status = db_service.get_database_status(db, engine)
        print(f"  Status:         {status.status.upper()}")
        print(f"  Dialect:        {status.dialect}")
        print(f"  Total Records:  {status.total_records}")
        for tname, tinfo in status.tables.items():
            print(f"  - Table '{tname}': {tinfo.row_count} rows ({len(tinfo.columns)} columns)")

        print("\n✓ Fullstack database is fully operational!")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
