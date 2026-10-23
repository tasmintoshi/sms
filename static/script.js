// Get HTML elements
const studentForm = document.getElementById("student-form");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const departmentInput = document.getElementById("department");

const tableBody = document.getElementById("student-table-body");
const message = document.getElementById("message");

const formTitle = document.getElementById("form-title");
const submitButton = document.getElementById("submit-button");
const cancelButton = document.getElementById("cancel-button");

let editingStudentId = null;


// Show success or error message
function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = type;
}


// Send request to Flask API
async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}


// Load all students from the database
async function loadStudents() {
    tableBody.replaceChildren();

    try {
        const students = await apiRequest("/api/students");

        renderStudents(students);

    } catch (error) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "Could not load students.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        showMessage(error.message, "error");
    }
}


// Display students in the table
function renderStudents(students) {
    tableBody.replaceChildren();

    if (students.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No students found. Add your first student.";

        row.appendChild(cell);
        tableBody.appendChild(row);

        return;
    }

    students.forEach(function (student) {
        const row = document.createElement("tr");

        // Student ID
        const idCell = document.createElement("td");
        idCell.textContent = student.id;

        // Student Name
        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        // Student Email
        const emailCell = document.createElement("td");
        emailCell.textContent = student.email;

        // Student Department
        const departmentCell = document.createElement("td");
        departmentCell.textContent = student.department;

        // Action buttons
        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.className = "edit-button";

        editButton.addEventListener("click", function () {
            editStudent(student);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function () {
            deleteStudent(student.id);
        });

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(emailCell);
        row.appendChild(departmentCell);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}


// Add a new student or update an existing student
studentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const student = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        department: departmentInput.value.trim()
    };

    if (!student.name || !student.email || !student.department) {
        showMessage("Please fill in all fields.", "error");
        return;
    }

    const isEditing = editingStudentId !== null;

    const url = isEditing
        ? `/api/students/${editingStudentId}`
        : "/api/students";

    const method = isEditing ? "PUT" : "POST";

    submitButton.disabled = true;

    try {
        const result = await apiRequest(url, {
            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(student)
        });

        showMessage(result.message);

        resetForm();

        await loadStudents();

    } catch (error) {
        showMessage(error.message, "error");

    } finally {
        submitButton.disabled = false;
    }
});


// Edit student information
function editStudent(student) {
    editingStudentId = student.id;

    nameInput.value = student.name;
    emailInput.value = student.email;
    departmentInput.value = student.department;

    formTitle.textContent = "Update Student";
    submitButton.textContent = "Update Student";

    cancelButton.hidden = false;

    showMessage("Editing student ID: " + student.id);

    studentForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// Delete a student
async function deleteStudent(studentId) {
    const confirmed = window.confirm(
        "Are you sure you want to delete this student?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const result = await apiRequest(
            `/api/students/${studentId}`,
            {
                method: "DELETE"
            }
        );

        if (editingStudentId === studentId) {
            resetForm();
        }

        showMessage(result.message);

        await loadStudents();

    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Reset the form
function resetForm() {
    studentForm.reset();

    editingStudentId = null;

    formTitle.textContent = "Add New Student";
    submitButton.textContent = "Add Student";

    cancelButton.hidden = true;
}


// Cancel editing
cancelButton.addEventListener("click", function () {
    resetForm();
    showMessage("");
});


// Load students when the website opens
loadStudents();