from app.database import Base, engine
from sqlalchemy import text

print("Dropping all tables...")
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()

print("Recreating tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
