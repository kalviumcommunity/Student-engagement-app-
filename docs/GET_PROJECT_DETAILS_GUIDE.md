# GET /api/projects/[projectId] - Complete Guide

## 📋 What This API Does

Fetches details of a single project with statistics (task count, member count).

**Authorization Rules:**
- **Mentors**: Can only view projects they created
- **Students**: Can only view projects they're members of

---

## 🔒 Why Authorization is Required Even for GET

### The Security Problem

**Without authorization, this could happen:**

```
Scenario:
- Project A: "Website Redesign" (Mentor: Mr. Stark)
- Project B: "Mobile App" (Mentor: Ms. Smith)

Without authorization:
- Mr. Stark could view Project B's details ❌
- Random students could view any project ❌
- Sensitive project info would be exposed ❌
```

### Why GET Needs Authorization

**Common Misconception:**
> "GET requests are read-only, so they're safe"

**Reality:**
- GET requests expose **data**
- Data can be sensitive (project details, member lists, etc.)
- Unauthorized access = **privacy violation**

### The Solution

```typescript
// MENTOR: Can only view their own projects
if (project.mentorId !== userId) {
    return 403; // Forbidden
}

// STUDENT: Can only view projects they're members of
if (!membership) {
    return 403; // Forbidden
}
```

**Why this matters:**
- ✅ **Privacy**: Users only see their own data
- ✅ **Security**: Prevents data leaks
- ✅ **Multi-tenancy**: Multiple mentors/projects isolated
- ✅ **Compliance**: Follows data protection principles

---

## 👥 Difference Between Mentor vs Student Access

### MENTOR Access (Ownership-Based)

```typescript
if (userRole === Role.MENTOR) {
    if (project.mentorId !== userId) {
        return 403; // Not your project
    }
}
```

**How it works:**
1. Check if the project's `mentorId` field matches the logged-in user
2. If yes → allow access
3. If no → deny access (403 Forbidden)

**Example:**
```
Mr. Stark (mentor-123) tries to view:
- Project A (mentorId: mentor-123) ✅ Allowed
- Project B (mentorId: mentor-456) ❌ Forbidden
```

**Why ownership-based?**
- Mentors **create** projects
- They **own** the project
- Only they should manage it

---

### STUDENT Access (Membership-Based)

```typescript
if (userRole === Role.STUDENT) {
    const membership = await prisma.projectMember.findFirst({
        where: {
            projectId: projectId,
            userId: userId,
        },
    });

    if (!membership) {
        return 403; // Not a member
    }
}
```

**How it works:**
1. Query the `ProjectMember` table
2. Look for a record linking this user to this project
3. If found → allow access
4. If not found → deny access (403 Forbidden)

**Example:**
```
John (student-456) tries to view:
- Project A (John is a member) ✅ Allowed
- Project B (John is NOT a member) ❌ Forbidden
```

**Why membership-based?**
- Students **join** projects (they don't own them)
- They should only see projects they're part of
- Prevents cross-project data leaks

---

## 📊 How Task/Member Counts Are Calculated

### Simple Count Queries

```typescript
// Count total tasks
const totalTasks = await prisma.task.count({
    where: { projectId: projectId },
});

// Count total members
const totalMembers = await prisma.projectMember.count({
    where: { projectId: projectId },
});
```

### What `count()` Does

**Behind the scenes:**
```sql
-- totalTasks
SELECT COUNT(*) FROM Task WHERE projectId = ?

-- totalMembers
SELECT COUNT(*) FROM ProjectMember WHERE projectId = ?
```

**Why use count()?**
- ✅ **Efficient**: Only counts, doesn't fetch full records
- ✅ **Fast**: Database-level aggregation
- ✅ **Simple**: Returns a number, not an array

### Alternative (Less Efficient)

**❌ DON'T DO THIS:**
```typescript
const tasks = await prisma.task.findMany({
    where: { projectId: projectId },
});
const totalTasks = tasks.length; // Fetches ALL tasks just to count!
```

**✅ DO THIS:**
```typescript
const totalTasks = await prisma.task.count({
    where: { projectId: projectId },
}); // Only counts, doesn't fetch
```

---

## ⚠️ Common Beginner Mistakes & Fixes

### 1. Project Not Found (404)

**Error Message:**
```json
{
  "error": "Project not found"
}
```

**Why it happens:**
- Wrong project ID in the URL
- Project was deleted
- Typo in the ID

**How to fix:**

1. **Get the correct project ID from Prisma Studio:**
   ```bash
   npx prisma studio
   # Open Project table
   # Copy the exact ID
   ```

2. **Use the correct URL:**
   ```
   GET http://localhost:3000/api/projects/abc-123-def-456
                                          ^^^^^^^^^^^^^^^^
                                          Must be exact!
   ```

---

### 2. Forbidden Access Confusion (403)

**Error Message:**
```json
{
  "error": "Access denied: You can only view your own projects"
}
```

**Why it happens:**
- Mentor trying to view another mentor's project
- Student trying to view a project they're not in

**How to fix:**

**For Mentors:**
1. Check the project's `mentorId` in Prisma Studio
2. Use that mentor's ID in the `x-user-id` header

**For Students:**
1. Check the `ProjectMember` table
2. Verify the student is listed as a member
3. If not, add them first using `POST /api/projects/[projectId]/members`

---

### 3. Wrong projectId in URL

**❌ WRONG:**
```
GET http://localhost:3000/api/projects/123
                                       ^^^
                                       Too short!
```

**✅ CORRECT:**
```
GET http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       Full UUID
```

**Why it matters:**
- Project IDs are UUIDs (long strings)
- Must be exact match
- No partial matches allowed

---

### 4. Using Wrong User ID in Headers

**Symptom:** Always getting 403 Forbidden

**Why it happens:**
- Using a different user's ID
- Copy-paste error

**How to fix:**
```
1. Open Prisma Studio
2. Find the user you want to test with
3. Copy their EXACT id
4. Paste into x-user-id header
5. Make sure x-user-role matches their role
```

---

### 5. Forgetting to Await params

**Error Message:**
```
params.projectId is undefined
```

**Why it happens:**
- In Next.js 15+, `params` is a Promise

**❌ WRONG:**
```typescript
const { projectId } = params; // Missing await!
```

**✅ CORRECT:**
```typescript
const { projectId } = await params;
```

---

## 🧪 Testing Guide (Bruno / Postman)

### Test 1: Mentor Views Own Project (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9

Headers:
  x-user-id: <mentor-id-who-owns-this-project>
  x-user-role: MENTOR
```

**Expected Response (200 OK):**
```json
{
  "id": "fce49676-26ed-48cd-862b-ba52dc6b82e9",
  "title": "Website Redesign",
  "mentorId": "mentor-id",
  "createdAt": "2026-01-10T10:00:00Z",
  "updatedAt": "2026-01-10T10:00:00Z",
  "totalTasks": 5,
  "totalMembers": 3
}
```

---

### Test 2: Student Views Project They're In (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9

Headers:
  x-user-id: <student-id-who-is-member>
  x-user-role: STUDENT
```

**Expected Response (200 OK):**
```json
{
  "id": "fce49676-26ed-48cd-862b-ba52dc6b82e9",
  "title": "Website Redesign",
  "mentorId": "mentor-id",
  "createdAt": "2026-01-10T10:00:00Z",
  "updatedAt": "2026-01-10T10:00:00Z",
  "totalTasks": 5,
  "totalMembers": 3
}
```

---

### Test 3: Mentor Views Another Mentor's Project (Forbidden)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9

Headers:
  x-user-id: <different-mentor-id>
  x-user-role: MENTOR
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Access denied: You can only view your own projects"
}
```

---

### Test 4: Student Views Project They're NOT In (Forbidden)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9

Headers:
  x-user-id: <student-id-not-member>
  x-user-role: STUDENT
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Access denied: You are not a member of this project"
}
```

---

### Test 5: Project Not Found (404)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/non-existent-id

Headers:
  x-user-id: <any-user-id>
  x-user-role: MENTOR
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Project not found"
}
```

---

### Test 6: Unauthorized (No Headers)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects/fce49676-26ed-48cd-862b-ba52dc6b82e9

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

### Step 2: Get Project ID
1. Open **Project** table
2. Find a project
3. Copy its `id` field
4. Use this in the URL

### Step 3: Get Mentor ID
1. Note the project's `mentorId`
2. This is the mentor who can view it

### Step 4: Get Student ID
1. Open **ProjectMember** table
2. Filter by the `projectId`
3. Copy a `userId` from the results
4. This student can view the project

---

## 📚 Key Takeaways

1. **GET requests need authorization** - Data privacy is critical
2. **Mentors use ownership check** - `project.mentorId === userId`
3. **Students use membership check** - Query `ProjectMember` table
4. **Use count() for statistics** - Efficient aggregation
5. **404 vs 403 distinction** - Not found vs access denied
6. **Always await params** - Next.js 15+ requirement

---

## 🚀 Next Steps

1. ✅ Test with both mentor and student roles
2. ✅ Test forbidden scenarios
3. ✅ Build frontend to display project details
4. ✅ Add more statistics (completion %, active tasks)
5. ✅ Build GET /api/projects/[projectId]/members

Good luck! 🎉
