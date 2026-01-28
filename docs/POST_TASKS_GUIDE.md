# POST /api/tasks - Complete Beginner's Guide

## 📋 What This API Does

This endpoint allows **MENTORS** to create tasks and assign them to project members (students or other mentors).

**Key Rules:**
- ✅ Only mentors can create tasks
- ✅ Tasks must be assigned to someone who is already a project member
- ✅ All fields (title, projectId, assignedToId) are required

---

## 🎯 Why Mentors Create Tasks, Not Students

### The Design Decision

In this system, **mentors are project managers**:
- They create projects
- They define the work (tasks)
- They assign tasks to team members
- They track progress

**Students are team members**:
- They join projects
- They work on assigned tasks
- They update task status
- They give/receive feedback

### Real-World Analogy

Think of it like a classroom:
- **Teacher (Mentor)**: Creates assignments, assigns them to students
- **Student**: Completes the assignments, submits work

If students could create tasks, it would be chaotic - everyone would be assigning work to each other!

### Code Implementation

```typescript
if (userRole !== Role.MENTOR) {
    return NextResponse.json(
        { error: "Only mentors can create tasks" },
        { status: 403 }
    );
}
```

This simple check enforces the business rule at the API level.

---

## 🔗 How ProjectMember Validation Prevents Bugs

### The Problem Without Validation

Imagine this scenario:
1. Mentor creates a task
2. Assigns it to a random user ID
3. That user is NOT in the project
4. Task is created but nobody can see it!

**Result**: Orphaned tasks, confused users, broken UI

### The Solution: ProjectMember Check

```typescript
const projectMembership = await prisma.projectMember.findFirst({
    where: {
        projectId: projectId,
        userId: assignedToId,
    },
});

if (!projectMembership) {
    return NextResponse.json(
        { error: "User is not a member of this project" },
        { status: 400 }
    );
}
```

**What this does:**
1. Looks in the `ProjectMember` table
2. Checks if there's a record linking the user to the project
3. If no record exists → user is NOT a member → reject the request

### Why This Matters

- ✅ **Data Integrity**: Tasks only assigned to valid project members
- ✅ **Better UX**: Clear error messages guide the mentor
- ✅ **Prevents Bugs**: Frontend won't break trying to display invalid data
- ✅ **Security**: Can't assign tasks to users outside the project

---

## 🔗 How Prisma Relations Work in This API

### The Database Schema

```prisma
model Task {
  id           String   @id @default(uuid())
  title        String
  status       String
  projectId    String
  assignedToId String?
  
  // Relations
  project  Project @relation(fields: [projectId], references: [id])
  assignee User?   @relation(fields: [assignedToId], references: [id])
}
```

### Creating a Task with Relations

```typescript
const task = await prisma.task.create({
    data: {
        title: "Build login page",
        status: "TODO",
        projectId: "project-123",  // Foreign key to Project
        assignedToId: "user-456",  // Foreign key to User
    },
});
```

**What Prisma does behind the scenes:**
1. Validates that `projectId` exists in the `Project` table
2. Validates that `assignedToId` exists in the `User` table
3. Creates the Task record with these foreign key references
4. If either ID is invalid → throws a foreign key constraint error

### Fetching a Task with Related Data

```typescript
const task = await prisma.task.findUnique({
    where: { id: "task-789" },
    include: {
        project: true,   // Include the full Project object
        assignee: true,  // Include the full User object
    },
});
```

**Result:**
```json
{
  "id": "task-789",
  "title": "Build login page",
  "status": "TODO",
  "projectId": "project-123",
  "assignedToId": "user-456",
  "project": {
    "id": "project-123",
    "title": "Website Redesign",
    "mentorId": "mentor-001"
  },
  "assignee": {
    "id": "user-456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

---

## ⚠️ Common Beginner Errors & Fixes

### 1. Foreign Key Constraint Failed

**Error Message:**
```
Foreign key constraint failed on the field: `projectId`
```

**Why It Happens:**
- You're trying to create a task with a `projectId` that doesn't exist in the database
- The project was deleted
- You copied the wrong ID

**How to Fix:**
1. Verify the project exists:
   ```bash
   npx prisma studio
   # Check the Project table for the ID
   ```

2. Use a valid project ID from your database

3. In your API test, make sure you're using a real project ID:
   ```json
   {
     "projectId": "6f88a8d2-970e-4bae-9121-f058a3eaaa8e"  // Real ID from database
   }
   ```

---

### 2. assignedToId Not in Project

**Error Message:**
```json
{
  "error": "User John Doe is not a member of this project. Add them to the project first."
}
```

**Why It Happens:**
- You're trying to assign a task to someone who hasn't joined the project
- The user exists in the database, but they're not in the `ProjectMember` table for this project

**How to Fix:**

**Option 1: Add the user to the project first**
```
POST /api/projects/{projectId}/members
Body: { "userId": "user-456" }
```

**Option 2: Assign to someone already in the project**
1. Check who's in the project:
   ```bash
   npx prisma studio
   # Open ProjectMember table
   # Filter by projectId
   # See which users are members
   ```

2. Use one of those user IDs in your task creation

---

### 3. Undefined Request Body

**Error Message:**
```json
{
  "error": "Invalid JSON body"
}
```

**Why It Happens:**
- You forgot to set the `Content-Type: application/json` header
- Your JSON is malformed (missing quotes, trailing commas, etc.)
- You didn't include a body at all

**How to Fix:**

**In Bruno/Postman:**
1. Set the header:
   ```
   Content-Type: application/json
   ```

2. Ensure your JSON is valid:
   ```json
   {
     "title": "Build login page",
     "projectId": "abc-123",
     "assignedToId": "def-456"
   }
   ```

3. Use a JSON validator if unsure: https://jsonlint.com/

---

### 4. Missing Required Fields

**Error Message:**
```json
{
  "error": "title, projectId, and assignedToId are required"
}
```

**Why It Happens:**
- One or more fields are missing from your request body
- Fields are present but empty strings
- Field names are misspelled

**How to Fix:**

**❌ WRONG:**
```json
{
  "taskTitle": "Build page",  // Wrong field name
  "project": "abc-123",       // Wrong field name
  "assignedTo": "def-456"     // Wrong field name
}
```

**✅ CORRECT:**
```json
{
  "title": "Build login page",
  "projectId": "abc-123",
  "assignedToId": "def-456"
}
```

---

### 5. Empty Title After Trimming

**Error Message:**
```json
{
  "error": "Task title cannot be empty"
}
```

**Why It Happens:**
- Title is just whitespace: `"   "`
- After `.trim()`, it becomes an empty string

**How to Fix:**

**❌ WRONG:**
```json
{
  "title": "   ",
  "projectId": "abc-123",
  "assignedToId": "def-456"
}
```

**✅ CORRECT:**
```json
{
  "title": "Build login page",
  "projectId": "abc-123",
  "assignedToId": "def-456"
}
```

---

## 🧪 Testing Guide (Bruno / Postman)

### Prerequisites

Before testing, you need:
1. ✅ A mentor user in the database
2. ✅ A project created by that mentor
3. ✅ A student user added to that project

### Test 1: Successful Task Creation

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
  Content-Type: application/json

Body (JSON):
{
  "title": "Build login page",
  "projectId": "project-abc-123",
  "assignedToId": "student-def-456"
}
```

**Expected Response (201 Created):**
```json
{
  "id": "task-xyz-789",
  "title": "Build login page",
  "status": "TODO",
  "projectId": "project-abc-123",
  "assignedToId": "student-def-456",
  "createdAt": "2026-01-13T14:30:00.000Z"
}
```

---

### Test 2: Unauthorized (No Headers)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers: (none)

Body (JSON):
{
  "title": "Build login page",
  "projectId": "project-abc-123",
  "assignedToId": "student-def-456"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: You must be logged in"
}
```

---

### Test 3: Forbidden (Student Trying to Create Task)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: student-def-456
  x-user-role: STUDENT
  Content-Type: application/json

Body (JSON):
{
  "title": "Build login page",
  "projectId": "project-abc-123",
  "assignedToId": "student-def-456"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Only mentors can create tasks"
}
```

---

### Test 4: Missing Required Fields

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
  Content-Type: application/json

Body (JSON):
{
  "title": "Build login page"
  // Missing projectId and assignedToId
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "title, projectId, and assignedToId are required"
}
```

---

### Test 5: Project Not Found

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
  Content-Type: application/json

Body (JSON):
{
  "title": "Build login page",
  "projectId": "non-existent-project-id",
  "assignedToId": "student-def-456"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Project not found"
}
```

---

### Test 6: User Not a Project Member

**Request:**
```
Method: POST
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
  Content-Type: application/json

Body (JSON):
{
  "title": "Build login page",
  "projectId": "project-abc-123",
  "assignedToId": "random-user-not-in-project"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "User John Doe is not a member of this project. Add them to the project first."
}
```

---

## 🔧 How to Get Real IDs for Testing

### Step 1: Open Prisma Studio
```bash
npx prisma studio
```

### Step 2: Get Mentor ID
1. Open the `User` table
2. Find a user with `role = "MENTOR"`
3. Copy their `id` field
4. Use this as `x-user-id` header

### Step 3: Get Project ID
1. Open the `Project` table
2. Find a project where `mentorId` matches your mentor's ID
3. Copy the project's `id` field
4. Use this as `projectId` in the body

### Step 4: Get Student ID
1. Open the `ProjectMember` table
2. Filter by the `projectId` from Step 3
3. Find a member record
4. Copy the `userId` field
5. Use this as `assignedToId` in the body

---

## 📚 Key Takeaways

1. **Only mentors create tasks** - Enforces project management hierarchy
2. **ProjectMember validation is critical** - Prevents assigning tasks to non-members
3. **Prisma handles foreign keys** - Automatically validates relationships
4. **Engagement logging tracks activity** - Helps with analytics
5. **Comprehensive validation prevents bugs** - Check everything before creating
6. **Clear error messages help debugging** - Tell users exactly what's wrong
7. **Test all scenarios** - Success, auth errors, validation errors

---

## 🚀 Next Steps

1. ✅ Test the API with Bruno/Postman
2. ✅ Try all error scenarios
3. ✅ Create a GET /api/tasks endpoint to fetch tasks
4. ✅ Create a PATCH /api/tasks/[id] endpoint to update task status
5. ✅ Build a frontend to display and manage tasks

Good luck! 🎉
