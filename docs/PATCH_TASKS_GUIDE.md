# PATCH /api/tasks/[taskId] - Complete Beginner's Guide

## 📋 What This API Does

Updates a task's status (TODO → IN_PROGRESS → DONE) with strict authorization rules:
- ✅ **Students**: Can only update tasks assigned to them
- ✅ **Mentors**: Can update any task in their projects
- ✅ **Security**: Both must be project members

---

## 🔒 Why ProjectMember Check is Mandatory

### The Security Problem

Without the ProjectMember check, this could happen:

```
Scenario:
- Project A (Website) - Mentor: Mr. Stark, Student: John
- Project B (Mobile App) - Mentor: Ms. Smith, Student: Sarah

Without ProjectMember check:
- John could update Sarah's tasks in Project B ❌
- Sarah could see and update John's tasks in Project A ❌
- Anyone could update any task if they know the taskId ❌
```

### The Solution

```typescript
const projectMembership = await prisma.projectMember.findFirst({
    where: {
        projectId: task.projectId,
        userId: userId,
    },
});

if (!projectMembership) {
    return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
    );
}
```

**What this does:**
1. Gets the project ID from the task
2. Checks if the user has a ProjectMember record for that project
3. If no record exists → user is NOT a member → deny access

**Why it matters:**
- ✅ **Data Isolation**: Users only access their own projects
- ✅ **Privacy**: Students can't see other teams' work
- ✅ **Security**: Prevents unauthorized task updates
- ✅ **Multi-Project Support**: Users can be in multiple projects safely

---

## 👥 Difference Between Mentor vs Student Permissions

### Student Permissions (Restricted)

```typescript
if (userRole === Role.STUDENT) {
    // Can ONLY update tasks assigned to them
    if (task.assignedToId !== userId) {
        return 403; // Forbidden
    }
}
```

**Example:**
```
Project: Website Redesign
Tasks:
- Task 1: "Build login page" → Assigned to John
- Task 2: "Design homepage" → Assigned to Sarah

John (Student) tries to update:
- Task 1 ✅ Allowed (assigned to him)
- Task 2 ❌ Forbidden (assigned to Sarah)
```

**Why?**
- Students should focus on their own work
- Prevents students from interfering with teammates' tasks
- Clear accountability for who did what

---

### Mentor Permissions (Broader)

```typescript
if (userRole === Role.MENTOR) {
    // Can update ANY task in their projects
    if (task.project.mentorId !== userId) {
        return 403; // Forbidden
    }
}
```

**Example:**
```
Mr. Stark (Mentor) owns Website Redesign project
Tasks:
- Task 1: Assigned to John
- Task 2: Assigned to Sarah
- Task 3: Assigned to Mike

Mr. Stark can update:
- Task 1 ✅ (his project)
- Task 2 ✅ (his project)
- Task 3 ✅ (his project)

Ms. Smith (different mentor) tries to update:
- Task 1 ❌ Forbidden (not her project)
```

**Why?**
- Mentors need to manage all tasks in their projects
- Can fix mistakes or update status if students forget
- Project oversight and management capability

---

## 🔄 Why PATCH is Used Instead of PUT

### HTTP Method Semantics

**PUT** = Replace the entire resource
```typescript
// PUT would require ALL fields
{
  "title": "Build login page",
  "status": "IN_PROGRESS",
  "projectId": "abc-123",
  "assignedToId": "user-456",
  "createdAt": "2026-01-10T10:00:00Z"
}
```

**PATCH** = Update specific fields
```typescript
// PATCH only needs the fields you want to change
{
  "status": "IN_PROGRESS"
}
```

### Why PATCH is Better Here

1. **Partial Updates**: We only want to change the status, not the entire task
2. **Simpler API**: Clients don't need to send all task data
3. **Less Error-Prone**: Can't accidentally overwrite other fields
4. **RESTful Best Practice**: PATCH is designed for partial updates

### Real-World Example

```
Student marks task as in progress:

✅ PATCH /api/tasks/123
Body: { "status": "IN_PROGRESS" }

❌ PUT /api/tasks/123
Body: {
  "title": "Build login page",
  "status": "IN_PROGRESS",
  "projectId": "abc-123",
  "assignedToId": "user-456"
  // What if you forget a field? It gets deleted!
}
```

---

## ⚠️ Common Beginner Errors & Fixes

### 1. Updating Task Without Checking Membership

**❌ WRONG CODE:**
```typescript
// Just update the task without checking membership
const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status: status },
});
```

**Why it's wrong:**
- Anyone with a taskId can update it
- No project isolation
- Security vulnerability

**✅ CORRECT CODE:**
```typescript
// First check membership
const membership = await prisma.projectMember.findFirst({
    where: {
        projectId: task.projectId,
        userId: userId,
    },
});

if (!membership) {
    return 403; // Forbidden
}

// Then update
const updatedTask = await prisma.task.update(...);
```

---

### 2. Wrong taskId in URL

**Error Message:**
```json
{
  "error": "Task not found"
}
```

**Why it happens:**
- Typo in the task ID
- Using a task ID from a different database
- Task was deleted

**How to fix:**
1. Get the correct task ID from Prisma Studio:
   ```bash
   npx prisma studio
   # Open Task table
   # Copy the exact ID
   ```

2. Use the correct URL format:
   ```
   PATCH http://localhost:3000/api/tasks/abc-123-def-456
                                          ^^^^^^^^^^^^^^^^
                                          This must be exact!
   ```

---

### 3. Status Enum Mismatch

**❌ WRONG:**
```json
{
  "status": "in_progress"  // lowercase, wrong format
}
```

**Error Message:**
```json
{
  "error": "Invalid task status. Must be one of: TODO, IN_PROGRESS, DONE"
}
```

**Why it happens:**
- Status values are case-sensitive
- Must match exactly: `TODO`, `IN_PROGRESS`, `DONE`
- Using wrong values like `"pending"`, `"complete"`, etc.

**✅ CORRECT:**
```json
{
  "status": "IN_PROGRESS"  // Exact match with TaskStatus enum
}
```

**Valid values:**
- `"TODO"` - Task not started
- `"IN_PROGRESS"` - Task being worked on
- `"DONE"` - Task completed

---

### 4. Prisma Update Errors

**Error Message:**
```
Invalid `prisma.task.update()` invocation
```

**Common causes:**

**A. Task doesn't exist**
```typescript
// Trying to update a deleted or non-existent task
await prisma.task.update({
    where: { id: "non-existent-id" },
    data: { status: "DONE" },
});
// Error: Record to update not found
```

**Fix:** Always fetch the task first to check if it exists

**B. Invalid field name**
```typescript
await prisma.task.update({
    where: { id: taskId },
    data: { 
        taskStatus: "DONE"  // Wrong field name!
    },
});
```

**Fix:** Use the correct field name from your schema: `status`

---

### 5. Student Trying to Update Another Student's Task

**Error Message:**
```json
{
  "error": "You can only update tasks assigned to you"
}
```

**Why it happens:**
- Student is trying to update a task assigned to someone else
- The `assignedToId` doesn't match the logged-in user's ID

**Example:**
```
John (student-123) tries to update:
Task assigned to Sarah (student-456)

Check fails:
task.assignedToId (student-456) !== userId (student-123)
```

**How to fix:**
- Students should only update their own tasks
- Use the correct user ID in the headers
- Verify task assignment in Prisma Studio

---

## 🧪 Testing Guide (Bruno / Postman)

### Prerequisites

Before testing, you need:
1. ✅ A task created in the database
2. ✅ The task assigned to a student
3. ✅ The student is a member of the project

### Test 1: Student Updates Own Task (Success)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/task-abc-123

Headers:
  x-user-id: student-def-456
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "status": "IN_PROGRESS"
}
```

**Expected Response (200 OK):**
```json
{
  "id": "task-abc-123",
  "title": "Build login page",
  "status": "IN_PROGRESS",
  "projectId": "project-xyz-789",
  "assignedToId": "student-def-456",
  "updatedAt": "2026-01-13T15:20:00.000Z"
}
```

---

### Test 2: Student Tries to Update Another Student's Task (Forbidden)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/task-abc-123

Headers:
  x-user-id: different-student-id
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "status": "DONE"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "You can only update tasks assigned to you"
}
```

---

### Test 3: Mentor Updates Any Task in Their Project (Success)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/task-abc-123

Headers:
  x-user-id: mentor-ghi-789
  x-user-role: MENTOR
  Content-Type: application/json

Body:
{
  "status": "DONE"
}
```

**Expected Response (200 OK):**
```json
{
  "id": "task-abc-123",
  "title": "Build login page",
  "status": "DONE",
  "projectId": "project-xyz-789",
  "assignedToId": "student-def-456",
  "updatedAt": "2026-01-13T15:25:00.000Z"
}
```

---

### Test 4: User Not a Project Member (Forbidden)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/task-abc-123

Headers:
  x-user-id: random-user-id
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "status": "IN_PROGRESS"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "You are not a member of this project"
}
```

---

### Test 5: Invalid Status Value (Bad Request)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/task-abc-123

Headers:
  x-user-id: student-def-456
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "status": "COMPLETED"  // Invalid status
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid task status. Must be one of: TODO, IN_PROGRESS, DONE"
}
```

---

### Test 6: Task Not Found (Not Found)

**Request:**
```
Method: PATCH
URL: http://localhost:3000/api/tasks/non-existent-task-id

Headers:
  x-user-id: student-def-456
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "status": "IN_PROGRESS"
}
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Task not found"
}
```

---

## 🔧 How to Get Real IDs for Testing

### Step 1: Open Prisma Studio
```bash
npx prisma studio
```

### Step 2: Get Task ID
1. Open the **Task** table
2. Find a task
3. Copy its `id` field
4. Use this in the URL: `/api/tasks/{taskId}`

### Step 3: Get User IDs
1. Open the **Task** table
2. Note the `assignedToId` (student who can update it)
3. Open the **Project** table
4. Note the `mentorId` (mentor who can update it)

### Step 4: Verify Membership
1. Open the **ProjectMember** table
2. Verify there's a record with:
   - `userId` = the user you're testing with
   - `projectId` = the project the task belongs to

---

## 📚 Key Takeaways

1. **ProjectMember check is mandatory** - Ensures project isolation and security
2. **Students have limited permissions** - Can only update their own tasks
3. **Mentors have broader permissions** - Can update any task in their projects
4. **PATCH is for partial updates** - Only send the fields you want to change
5. **Always validate status** - Must be TODO, IN_PROGRESS, or DONE
6. **Fetch task first** - Need to check project membership and assignment
7. **Log engagement** - Track all task updates for analytics

---

## 🚀 Next Steps

1. ✅ Test the API with all scenarios
2. ✅ Try updating task status: TODO → IN_PROGRESS → DONE
3. ✅ Test with both student and mentor roles
4. ✅ Build a frontend UI to display and update tasks
5. ✅ Add task filtering (by status, assignee, project)

Good luck! 🎉
