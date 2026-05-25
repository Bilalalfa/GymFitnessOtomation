import os
import mysql.connector
from mysql.connector import Error
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "Bilal12345"),
    "database": os.getenv("DB_NAME", "gym_otomasyonu"),
    "charset": "utf8mb4",
    "use_pure": True,
    "autocommit": False
}

def get_connection():
    """Return a new MySQL connection."""
    return mysql.connector.connect(**DB_CONFIG)

def call_procedure(proc_name: str, args: tuple = ()):
    """
    Execute a stored procedure and return all result sets as a list of dicts.
    Commits after execution if no exception is raised.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    results = []
    try:
        cursor.callproc(proc_name, args)
        for result in cursor.stored_results():
            results.append(result.fetchall())
        conn.commit()
    except Error as e:
        conn.rollback()
        # Raise HTTP 400 Bad Request on MySQL execution failure so trigger signals display correctly in UI
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
    return results
