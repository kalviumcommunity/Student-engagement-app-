# GET /api/tasks - Complete Guide

## 📋 What This API Does

Fetches a list of tasks based on the logged-in user's role:
- **Mentors**: See all tasks from projects they manage
- **Students**: See only tasks assigned to them

---

## 🔍 Difference Between Mentor vs Student Queries

### MENTOR Query (Broader Scope)

```typescript
tasks = await prisma.task.findMany({
    where: {
        project: {
            mentorId: userId, // Nested relation filter
        },
    },
});
```

**What happens:**
1. Prisma looks at the `Task` table
2. For each task, it checks the related `Project`
3. Filters to keep only tasks where `project.mentorId = userId`
4. Returns ALL tasks from the mentor's projects

**Example:**
```
Mentor: Mr. Stark (id: mentor-123)
Projects: Website Redesign, Mobile App

Tasks returned:
- "Build login page" (assigned to John, Website project)
- "Design homepage" (assigned to Sarah, Website project)
- "Create API" (assigned to Mike, Mobile App project)
```

**Why?** Mentors need to see ALL tasks to manage their projects.

---

### STUDENT Query (Narrow Scope)

```typescript
tasks = await prisma.task.findMany({
    where: {
        assignedToId: userId, // Direct field filter
    },
});
```

**What happens:**
1. Prisma looks at the `Task` table
2. Filters to keep only tasks where `assignedToId = userId`
3. Returns ONLY tasks assigned to this student

**Example:**
```
Student: John (id: student-456)

Tasks returned:
- "Build login page" (assigned to John)
- "Write tests" (assigned to John)

NOT returned:
- "Design homepage" (assigned to Sarah) ❌
- "Create API" (assigned to Mike) ❌
```

**Why?** Students should focus on their own work, not see everyone's tasks.

---

## ✅ Why Empty Array is Valid

### The Concept

```typescript
// If no tasks found:
tasks = []

// We return:
return NextResponse.json([], { status: 200 });
```

**This is NOT an error!** It simply means:
- Mentor: No tasks created yet in your projects
- Student: No tasks assigned to you yet

### Why Not Return 404?

**❌ WRONG:**
```typescript
if (tasks.length === 0) {
    return NextResponse.json(
        { error: "No tasks found" },
        { status: 404 }
    );
}
```

**✅ CORRECT:**
```typescript
return NextResponse.json(tasks, { status: 200 });
// Returns [] if no tasks
```

**Reasons:**
1. **Empty is not an error** - It's a valid state
2. **Frontend can handle it** - Show "No tasks yet" message
3. **RESTful convention** - 200 with empty array is standard
4. **Better UX** - Doesn't confuse users with error messages

---

## ⚠️ Common Errors & Fixes

### 1. Empty Array Confusion

**Symptom:** Getting `[]` but expecting tasks

**Why it happens:**
- No tasks created yet
- Wrong user ID in headers
- Student has no assigned tasks
- Mentor has no projects

**How to fix:**
1. Check Prisma Studio - verify tasks exist
2. Verify user ID matches database
3. For students: Check `assignedToId` field
4. For mentors: Check project `mentorId` field

---

### 2. Mentor Sees No Tasks

**Symptom:** Mentor gets empty array but tasks exist

**Why it happens:**
- Tasks belong to projects owned by a different mentor
- Wrong mentor ID in headers

**How to fix:**
```bash
# Check in Prisma Studio:
1. Open Task table
2. Note the projectId
3. Open Project table
4. Check mentorId for that project
5. Use that mentorId in x-user-id header
```

---

### 3. Student Sees Other Students' Tasks

**Symptom:** This shouldn't happen, but if it does...

**Why it happens:**
- Bug in the code (using wrong filter)
- Wrong user ID in headers

**How to verify:**
```typescript
// The query MUST have:
where: {
    assignedToId: userId, // Must match logged-in user
}
```

---

### 4. Relation Filter Not Working

**Error Message:**
```
Unknown argument `project`. Did you mean `projectId`?
```

**Why it happens:**
- Typo in the relation name
- Relation not defined in schema

**How to fix:**
```typescript
// ✅ CORRECT - using relation name from schema
where: {
    project: {
        mentorId: userId,
    },
}

// ❌ WRONG - using field name
where: {
    projectId: {
        mentorId: userId, // This doesn't work!
    },
}
```

---

## 🧪 Testing Guide (Bruno / Postman)

### Test 1: Mentor Fetches Tasks (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: <mentor-id>
  x-user-role: MENTOR
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "task-1",
    "title": "Build login page",
    "status": "TODO",
    "projectId": "project-abc",
    "assignedToId": "student-123",
    "createdAt": "2026-01-13T10:00:00Z",
    "updatedAt": "2026-01-13T10:00:00Z"
  },
  {
    "id": "task-2",
    "title": "Design homepage",
    "status": "IN_PROGRESS",
    "projectId": "project-abc",
    "assignedToId": "student-456",
    "createdAt": "2026-01-13T11:00:00Z",
    "updatedAt": "2026-01-13T11:00:00Z"
  }
]
```

---

### Test 2: Student Fetches Tasks (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: <student-id>
  x-user-role: STUDENT
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "task-1",
    "title": "Build login page",
    "status": "TODO",
    "projectId": "project-abc",
    "assignedToId": "student-123",
    "createdAt": "2026-01-13T10:00:00Z",
    "updatedAt": "2026-01-13T10:00:00Z"
  }
]
```

---

### Test 3: No Tasks (Empty Array)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/tasks

Headers:
  x-user-id: <new-student-id>
  x-user-role: STUDENT
```

**Expected Response (200 OK):**
```json
[]
```

---

### Test 4: Unauthorized (No Headers)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/tasks

Headers: (none)
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: You must be logged in"
}
```

---

## 🔧 How to Get Real IDs for Testing

### Step 1: Open Prisma Studio
```bash
npx prisma studio
```

### Step 2: Get Mentor ID
1. Open **User** table
2. Find a user with `role = "MENTOR"`
3. Copy their `id`

### Step 3: Get Student ID
1. Open **User** table
2. Find a user with `role = "STUDENT"`
3. Copy their `id`

### Step 4: Verify Tasks Exist
1. Open **Task** table
2. Check there are tasks
3. Note the `assignedToId` and `projectId`

---

## 📚 Key Takeaways

1. **Mentor query uses nested relation** - Filters by `project.mentorId`
2. **Student query is direct** - Filters by `assignedToId`
3. **Empty array is valid** - Not an error, just means no tasks
4. **Always order by createdAt** - Shows newest tasks first
5. **Use select to limit fields** - Only return what's needed

---

## 🚀 Next Steps

1. ✅ Test with both mentor and student roles
2. ✅ Verify empty array handling
3. ✅ Build frontend to display tasks
4. ✅ Add filtering (by status, project)
5. ✅ Add pagination for large task lists

Good luck! 🎉
