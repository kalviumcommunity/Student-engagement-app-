# GET /api/projects - Complete Beginner's Guide

## 📋 What This API Does

This endpoint fetches a list of projects based on who is logged in:
- **Mentors** see projects they created
- **Students** see projects they joined

---

## 🔐 How Authentication Works Using Headers

### The Concept
Instead of using cookies or JWT tokens, we're using **HTTP headers** to pass user information:

```
x-user-id: "abc-123-def-456"
x-user-role: "MENTOR"
```

### How It Works Step-by-Step

1. **Frontend Login**: When a user logs in, the frontend stores their ID and role
2. **Making Requests**: Every API request includes these headers
3. **Backend Reads Headers**: The API reads `request.headers.get("x-user-id")`
4. **Validation**: If no user ID → user is not logged in → return 401 error

### Important Notes
- ⚠️ **This is TEMPORARY**: In production, use JWT tokens or NextAuth
- ⚠️ **Not Secure**: Anyone can fake these headers
- ✅ **Good for Learning**: Simple to understand and test

---

## 🔍 Difference Between Mentor vs Student Queries

### MENTOR Query (Simple)
```typescript
projects = await prisma.project.findMany({
    where: {
        mentorId: userId, // Direct match
    }
});
```

**What happens:**
- Prisma looks in the `Project` table
- Finds all rows where `mentorId` equals the logged-in user's ID
- Returns those projects

**SQL equivalent:**
```sql
SELECT * FROM Project WHERE mentorId = 'user-id-here'
```

---

### STUDENT Query (Requires JOIN)
```typescript
const projectMemberships = await prisma.projectMember.findMany({
    where: {
        userId: userId,
    },
    include: {
        project: true, // This is the JOIN
    },
});
```

**What happens:**
1. Prisma looks in the `ProjectMember` table
2. Finds all rows where `userId` equals the student's ID
3. For each row, it **joins** with the `Project` table using `projectId`
4. Returns the membership records WITH the full project data included

**SQL equivalent:**
```sql
SELECT pm.*, p.*
FROM ProjectMember pm
INNER JOIN Project p ON pm.projectId = p.id
WHERE pm.userId = 'student-id-here'
```

**Why the extra step?**
- Students don't create projects, they JOIN them
- The `ProjectMember` table tracks who joined which project
- We need to look up memberships first, then get the project details

---

## 🔗 How Prisma Joins ProjectMember → Project

### The Schema Relationship
In your `schema.prisma`:

```prisma
model ProjectMember {
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
}
```

This tells Prisma: "Each ProjectMember has a `project` field that links to a Project"

### Using `include` to Join

```typescript
const memberships = await prisma.projectMember.findMany({
    where: { userId: "student-123" },
    include: { project: true }, // Fetch related project data
});
```

**Result structure:**
```json
[
  {
    "id": "membership-1",
    "userId": "student-123",
    "projectId": "project-abc",
    "project": {
      "id": "project-abc",
      "title": "Build a Website",
      "mentorId": "mentor-456",
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    }
  }
]
```

### Extracting Just the Projects

```typescript
projects = memberships.map(m => ({
    id: m.project.id,
    title: m.project.title,
    mentorId: m.project.mentorId,
    createdAt: m.project.createdAt,
    updatedAt: m.project.updatedAt,
}));
```

This transforms the array to contain ONLY project data, not the membership info.

---

## ⚠️ Common Beginner Errors & Fixes

### 1. Empty Array Confusion

**❌ WRONG:**
```typescript
if (projects.length === 0) {
    return NextResponse.json(
        { error: "No projects found" },
        { status: 404 }
    );
}
```

**✅ CORRECT:**
```typescript
// Just return the empty array
return NextResponse.json(projects, { status: 200 });
```

**Why?**
- An empty array `[]` is NOT an error
- It means "no projects yet" which is valid
- The frontend can handle empty arrays and show "No projects" message

---

### 2. Wrong Role Checks

**❌ WRONG:**
```typescript
if (userRole === "mentor") { // lowercase
```

**✅ CORRECT:**
```typescript
if (userRole === Role.MENTOR) { // Use the constant from lib/db.ts
```

**Why?**
- Headers might have different casing
- Using constants prevents typos
- Type-safe and consistent

---

### 3. Prisma Relation Errors

**❌ WRONG:**
```typescript
const projects = await prisma.projectMember.findMany({
    where: { userId },
    // Missing include - won't have project data!
});
```

**Error you'll see:**
```
Cannot read property 'id' of undefined
```

**✅ CORRECT:**
```typescript
const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: { project: true }, // Must include!
});
```

**Why?**
- Without `include`, you only get the ProjectMember fields
- `membership.project` will be undefined
- Always include related data when you need it

---

### 4. Undefined Headers

**❌ WRONG:**
```typescript
const userId = request.headers.get("userId"); // Missing x- prefix
```

**Error you'll see:**
- `userId` will be `null`
- API returns 401 even though you sent the header

**✅ CORRECT:**
```typescript
const userId = request.headers.get("x-user-id"); // Exact match
```

**Why?**
- Header names are case-insensitive but must match exactly
- Custom headers should start with `x-`
- Check your frontend is sending the same header name

---

### 5. Forgetting to Map Student Projects

**❌ WRONG:**
```typescript
const memberships = await prisma.projectMember.findMany({...});
return NextResponse.json(memberships); // Returns membership objects!
```

**Result:**
```json
[
  {
    "id": "membership-id",
    "userId": "student-123",
    "projectId": "project-abc",
    "project": {...}
  }
]
```

**✅ CORRECT:**
```typescript
const projects = memberships.map(m => ({
    id: m.project.id,
    title: m.project.title,
    // ... extract project fields
}));
return NextResponse.json(projects);
```

**Why?**
- The API should return consistent project objects
- Mentors and students should get the same structure
- Frontend expects project data, not membership data

---

## 🧪 Testing Guide (Bruno / Postman)

### Test 1: Mentor Fetches Their Projects

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects
Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "project-123",
    "title": "Build a Website",
    "mentorId": "6f88a8d2-970e-4bae-9121-f058a3eaaa8e",
    "createdAt": "2026-01-10T10:00:00.000Z",
    "updatedAt": "2026-01-10T10:00:00.000Z"
  }
]
```

**If no projects:**
```json
[]
```

---

### Test 2: Student Fetches Their Projects

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects
Headers:
  x-user-id: 3eaaa8e2-9b96-4d9e-a565-f058a3eaaa8e
  x-user-role: STUDENT
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "project-456",
    "title": "Mobile App Project",
    "mentorId": "mentor-id-here",
    "createdAt": "2026-01-11T14:00:00.000Z",
    "updatedAt": "2026-01-11T14:00:00.000Z"
  }
]
```

---

### Test 3: Unauthorized (No Headers)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects
Headers: (none)
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: You must be logged in"
}
```

---

### Test 4: Invalid Role

**Request:**
```
Method: GET
URL: http://localhost:3000/api/projects
Headers:
  x-user-id: some-user-id
  x-user-role: ADMIN
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "Forbidden: Invalid role"
}
```

---

## 🎯 Quick Testing Checklist

- [ ] Mentor with projects → Returns array of their projects
- [ ] Mentor with no projects → Returns empty array `[]`
- [ ] Student with projects → Returns array of joined projects
- [ ] Student with no projects → Returns empty array `[]`
- [ ] No headers → Returns 401 error
- [ ] Invalid role → Returns 403 error
- [ ] Wrong user ID → Returns empty array (no error)

---

## 🔧 How to Get Real User IDs for Testing

### Option 1: Use Prisma Studio
```bash
npx prisma studio
```
1. Open http://localhost:5555
2. Click "User" table
3. Copy the `id` field from a user
4. Use that ID in your API test headers

### Option 2: Query the Database
```bash
npx prisma db seed  # Creates test users
```

The seed script creates:
- Mentor: `mentor@school.com`
- Student: `student@school.com`

Check the console output for their IDs.

---

## 📚 Key Takeaways

1. **Headers are temporary auth** - Simple but not secure for production
2. **Mentors query directly** - `Project.mentorId = userId`
3. **Students need a JOIN** - `ProjectMember → Project`
4. **Empty arrays are OK** - Don't return errors for no results
5. **Always include relations** - Use `include: { project: true }`
6. **Map student results** - Extract project data from memberships
7. **Test all scenarios** - Mentor, student, unauthorized, invalid role

---

## 🚀 Next Steps

1. Test the API with Bruno/Postman
2. Try creating a project (POST /api/projects)
3. Verify the student can see it after joining
4. Build a frontend to display the projects
5. Add filtering (by status, date, etc.)

Good luck! 🎉
