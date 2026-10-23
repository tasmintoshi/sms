from flask import Flask, request, jsonify, send_from_directory
import sqlite3
from pathlib import Path

from database import get_connection, init_db


# Create Flask application
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = Flask(__name__, static_folder=str(STATIC_DIR))


# Home page
@app.route("/")
def home():
    return send_from_directory(str(STATIC_DIR), "index.html")


# Serve CSS file
@app.route("/style.css")
def style():
    return send_from_directory(str(STATIC_DIR), "style.css")


# Serve JavaScript file
@app.route("/script.js")
def script():
    return send_from_directory(str(STATIC_DIR), "script.js")


# Get all students
@app.route("/api/students", methods=["GET"])
def get_students():
    connection = get_connection()

    try:
        students = connection.execute(
            "SELECT * FROM students ORDER BY id DESC"
        ).fetchall()

        return jsonify([dict(student) for student in students])

    finally:
        connection.close()


# Add a new student
@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    name = data.get("name")
    email = data.get("email")
    department = data.get("department")

    if not all(isinstance(value, str) for value in [name, email, department]):
        return jsonify({"error": "All fields are required"}), 400

    name = name.strip()
    email = email.strip()
    department = department.strip()

    if not name or not email or not department:
        return jsonify({"error": "All fields are required"}), 400

    connection = get_connection()

    try:
        connection.execute(
            """
            INSERT INTO students (name, email, department)
            VALUES (?, ?, ?)
            """,
            (name, email, department)
        )

        connection.commit()

        return jsonify({
            "message": "Student added successfully"
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "This email already exists"
        }), 409

    finally:
        connection.close()


# Get one student
@app.route("/api/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    connection = get_connection()

    try:
        student = connection.execute(
            "SELECT * FROM students WHERE id = ?",
            (student_id,)
        ).fetchone()

        if student is None:
            return jsonify({"error": "Student not found"}), 404

        return jsonify(dict(student))

    finally:
        connection.close()


# Update student information
@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request data"}), 400

    name = data.get("name")
    email = data.get("email")
    department = data.get("department")

    if not all(isinstance(value, str) for value in [name, email, department]):
        return jsonify({"error": "All fields are required"}), 400

    name = name.strip()
    email = email.strip()
    department = department.strip()

    if not name or not email or not department:
        return jsonify({"error": "All fields are required"}), 400

    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            UPDATE students
            SET name = ?, email = ?, department = ?
            WHERE id = ?
            """,
            (name, email, department, student_id)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Student not found"}), 404

        return jsonify({
            "message": "Student updated successfully"
        })

    except sqlite3.IntegrityError:
        return jsonify({
            "error": "This email already exists"
        }), 409

    finally:
        connection.close()


# Delete a student
@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    connection = get_connection()

    try:
        cursor = connection.execute(
            "DELETE FROM students WHERE id = ?",
            (student_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Student not found"}), 404

        return jsonify({
            "message": "Student deleted successfully"
        })

    finally:
        connection.close()


# Start the application
if __name__ == "__main__":
    init_db()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )