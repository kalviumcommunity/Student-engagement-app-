# POST /api/projects/[projectId]/members - Quick Guide

## 📋 What This Does

Allows **mentors** to add students to their projects, creating a ProjectMember record.

---

## 🧪 How to Test

### Step 1: Get the IDs

Open Prisma Studio:
```bash
npx prisma studio
```

Get these IDs:
- **Mentor ID**: From User table (role = "MENTOR")
- **Project ID**: From Project table (created by that mentor)
- **Student ID**: From User table (role = "STUDENT") - this is John's ID

### Step 2: Add John to the Project

**Request:**
```
Method: POST
URL: http://localhost:3000/api/projects/{projectId}/members

Headers:
  x-user-id: <mentor-id>
  x-user-role: MENTOR
  Content-Type: application/json

Body:
{
  "userId": "<john-student-id>"
}
```

**Example:**
```
POST http://localhost:3000/api/projects/1c49676-26ed-48cd-862b-ba952c668269/members

Headers:
  x-user-id: 6f88a8d2-970e-4bae-9121-f058a3eaaa8e
  x-user-role: MENTOR
  Content-Type: application/json

Body:
{
  "userId": "bba102e-9b2d-a10d-a10b-910ba7e75091"
}
```

**Expected Response (201):**
```json
{
  "message": "John added to project successfully",
  "membership": {
    "id": "membership-id",
    "userId": "bba102e-9b2d-a10d-a10b-910ba7e75091",
    "projectId": "1c49676-26ed-48cd-862b-ba952c668269",
    "joinedAt": "2026-01-13T14:56:00.000Z"
  }
}
```

### Step 3: Now Create the Task

After adding John as a member, your original task creation will work:

```
POST http://localhost:3000/api/tasks

Headers:
  x-user-id: <mentor-id>
  x-user-role: MENTOR
  Content-Type: application/json

Body:
{
  "title": "Build login page",
  "projectId": "1c49676-26ed-48cd-862b-ba952c668269",
  "assignedToId": "bba102e-9b2d-a10d-a10b-910ba7e75091"
}
```

✅ This will now work because John is a project member!

---

## ⚠️ Common Errors

### Already a Member
```json
{
  "error": "John is already a member of this project"
}
```
**Fix**: User is already added, you can skip this step.

### Not Your Project
```json
{
  "error": "You can only add members to your own projects"
}
```
**Fix**: Use the mentor ID who created the project.

### User Not Found
```json
{
  "error": "User not found"
}
```
**Fix**: Check the userId is correct from the User table.

---

## 🎯 Quick Workflow

1. **Create Project** (POST /api/projects) → Get projectId
2. **Add Members** (POST /api/projects/[projectId]/members) → Add students
3. **Create Tasks** (POST /api/tasks) → Assign to members
4. **Students Work** → Update task status

Done! 🚀
