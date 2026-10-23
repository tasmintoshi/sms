import sqlite3
from pathlib import Path

# Database file location
BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "students.db"


# Connect to database
def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


# Create students table
def init_db():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                department TEXT NOT NULL
            )
        """)

        connection.commit()

    finally:
        connection.close()

