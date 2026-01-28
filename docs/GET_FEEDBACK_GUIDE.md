# GET /api/feedback - Complete Guide

## 📋 What This API Does

Fetches peer feedback based on the logged-in user's role:
- **Students**: See feedback they received (their ratings)
- **Mentors**: See all feedback from their projects (team oversight)

---

## 🎓 Why Students Only See Received Feedback

### The Design Decision

```typescript
if (userRole === Role.STUDENT) {
    feedback = await prisma.peerFeedback.findMany({
        where: {
            toUserId: userId, // Only feedback TO this student
        },
    });
}
```

**Why this makes sense:**

### 1. **Privacy & Focus**
Students should see:
- ✅ Feedback they received (their performance ratings)
- ❌ NOT feedback they gave (that's for the recipient)
- ❌ NOT feedback between other students (privacy)

**Example:**
```
John (Student) sees:
- "Great teamwork!" (from Sarah, rating: 5) ✅
- "Good communication" (from Mike, rating: 4) ✅

John does NOT see:
- Feedback Sarah received from Mike ❌
- Feedback he gave to Sarah ❌
```

### 2. **Self-Improvement**
- Students need to know how teammates perceive them
- This helps them improve their collaboration skills
- It's about receiving constructive feedback

### 3. **Prevents Bias**
- Students can't see what they wrote about others
- Prevents them from adjusting behavior based on what they said
- Keeps feedback honest and authentic

---

## 👨‍🏫 Why Mentors See Project-Level Feedback

### The Design Decision

```typescript
if (userRole === Role.MENTOR) {
    feedback = await prisma.peerFeedback.findMany({
        where: {
            project: {
                mentorId: userId, // All feedback from mentor's projects
            },
        },
    });
}
```

**Why mentors need broader access:**

### 1. **Team Oversight**
Mentors need to:
- Monitor team dynamics
- Identify conflicts early
- Spot struggling students
- Recognize high performers

**Example:**
```
Mr. Stark (Mentor) sees ALL feedback in his projects:
- John → Sarah: "Great work!" (rating: 5)
- Sarah → John: "Needs improvement" (rating: 2)
- Mike → John: "Excellent!" (rating: 5)

Insight: John has mixed reviews - mentor should check in
```

### 2. **Fair Evaluation**
- Mentors use peer feedback for grading
- Need complete picture of team interactions
- Can identify patterns (who's helping, who's not)

### 3. **Intervention Capability**
- If ratings are consistently low → mentor intervenes
- If feedback is inappropriate → mentor addresses it
- If team conflict → mentor mediates

---

## ✅ Why Empty Array is NOT an Error

### The Concept

```typescript
// If no feedback found:
feedback = []

// We return:
return NextResponse.json([], { status: 200 });
```

**This is perfectly valid!** It means:
- Student: No one has given you feedback yet
- Mentor: No feedback in your projects yet

### Why Not Return 404?

**❌ WRONG:**
```typescript
if (feedback.length === 0) {
    return NextResponse.json(
        { error: "No feedback found" },
        { status: 404 }
    );
}
```

**✅ CORRECT:**
```typescript
return NextResponse.json(feedback, { status: 200 });
// Returns [] if no feedback
```

**Reasons:**

1. **Empty is a Valid State**
   - New students haven't received feedback yet
   - New projects don't have feedback yet
   - This is expected, not an error

2. **Frontend Can Handle It**
   ```jsx
   // Frontend code
   if (feedback.length === 0) {
       return <p>No feedback yet</p>;
   }
   ```

3. **RESTful Convention**
   - 200 with empty array is standard
   - 404 means "resource not found" (the endpoint doesn't exist)
   - Empty data ≠ missing endpoint

4. **Better User Experience**
   - "No feedback yet" is friendlier than "Error: Not Found"
   - Doesn't confuse users with error messages

---

## ⚠️ Common Beginner Mistakes & Fixes

### 1. Confusing `fromUserId` vs `toUserId`

**❌ WRONG (Student Query):**
```typescript
where: {
    fromUserId: userId, // WRONG - feedback student GAVE
}
```

**✅ CORRECT:**
```typescript
where: {
    toUserId: userId, // CORRECT - feedback student RECEIVED
}
```

**Why it matters:**
- `fromUserId` = who gave the feedback
- `toUserId` = who received the feedback
- Students should see what THEY received, not what they gave

---

### 2. Mentor Query Using Wrong Relation

**❌ WRONG:**
```typescript
where: {
    projectId: userId, // WRONG - projectId is not userId!
}
```

**✅ CORRECT:**
```typescript
where: {
    project: {
        mentorId: userId, // CORRECT - nested relation filter
    },
}
```

**Why it matters:**
- Need to filter by the project's mentor
- Requires nested relation query
- Can't directly compare projectId to userId

---

### 3. Empty Array Treated as Error

**❌ WRONG:**
```typescript
if (feedback.length === 0) {
    return NextResponse.json(
        { error: "No feedback" },
        { status: 404 }
    );
}
```

**✅ CORRECT:**
```typescript
return NextResponse.json(feedback, { status: 200 });
// Let frontend handle empty state
```

---

### 4. Not Including All Required Fields

**❌ WRONG:**
```typescript
select: {
    id: true,
    rating: true,
    // Missing other fields!
}
```

**✅ CORRECT:**
```typescript
select: {
    id: true,
    fromUserId: true,
    toUserId: true,
    projectId: true,
    rating: true,
    comment: true,
    createdAt: true,
}
```

---

### 5. Forgetting to Order Results

**❌ WRONG:**
```typescript
await prisma.peerFeedback.findMany({
    where: { toUserId: userId },
    // No orderBy - random order!
});
```

**✅ CORRECT:**
```typescript
await prisma.peerFeedback.findMany({
    where: { toUserId: userId },
    orderBy: {
        createdAt: "desc", // Newest first
    },
});
```

---

## 🧪 Testing Guide (Bruno / Postman)

### Test 1: Student Fetches Received Feedback (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: <student-id>
  x-user-role: STUDENT
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "feedback-1",
    "fromUserId": "teammate-id",
    "toUserId": "student-id",
    "projectId": "project-id",
    "rating": 5,
    "comment": "Great teamwork!",
    "createdAt": "2026-01-13T10:00:00Z"
  },
  {
    "id": "feedback-2",
    "fromUserId": "another-teammate-id",
    "toUserId": "student-id",
    "projectId": "project-id",
    "rating": 4,
    "comment": "Good communication",
    "createdAt": "2026-01-13T09:00:00Z"
  }
]
```

---

### Test 2: Mentor Fetches Project Feedback (Success)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: <mentor-id>
  x-user-role: MENTOR
```

**Expected Response (200 OK):**
```json
[
  {
    "id": "feedback-1",
    "fromUserId": "student-1",
    "toUserId": "student-2",
    "projectId": "project-abc",
    "rating": 5,
    "comment": "Excellent work!",
    "createdAt": "2026-01-13T11:00:00Z"
  },
  {
    "id": "feedback-2",
    "fromUserId": "student-2",
    "toUserId": "student-1",
    "projectId": "project-abc",
    "rating": 4,
    "comment": "Good job",
    "createdAt": "2026-01-13T10:00:00Z"
  }
]
```

---

### Test 3: No Feedback (Empty Array)

**Request:**
```
Method: GET
URL: http://localhost:3000/api/feedback

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
URL: http://localhost:3000/api/feedback

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

### Step 2: Get Student ID
1. Open **User** table
2. Find a user with `role = "STUDENT"`
3. Copy their `id`

### Step 3: Get Mentor ID
1. Open **User** table
2. Find a user with `role = "MENTOR"`
3. Copy their `id`

### Step 4: Verify Feedback Exists
1. Open **PeerFeedback** table
2. Check there are feedback records
3. Note the `toUserId` and `fromUserId`

---

## 📚 Key Takeaways

1. **Students see received feedback** - For self-improvement
2. **Mentors see project feedback** - For team oversight
3. **Empty array is valid** - Not an error, just no data yet
4. **toUserId vs fromUserId** - Critical difference
5. **Nested relation for mentors** - Filter by `project.mentorId`
6. **Always order by createdAt** - Newest feedback first

---

## 🚀 Next Steps

1. ✅ Test with both student and mentor roles
2. ✅ Verify empty array handling
3. ✅ Build frontend to display feedback
4. ✅ Add filtering (by project, by rating)
5. ✅ Calculate average ratings

Good luck! 🎉
