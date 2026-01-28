# POST /api/feedback - Complete Beginner's Guide

## 📋 What This API Does

Allows project members to give peer feedback (ratings and comments) to their teammates.

**Key Rules:**
- ✅ Both users must be project members
- ✅ Cannot give feedback to yourself
- ✅ Rating must be 1-5
- ✅ Works for both mentors and students

---

## 🔒 Why ProjectMember Validation is Mandatory

### The Problem Without Validation

```
Scenario:
- Project A: Website Redesign
  - Members: John, Sarah, Mr. Stark (mentor)
  
- Project B: Mobile App
  - Members: Mike, Lisa, Ms. Smith (mentor)

Without ProjectMember validation:
- John could give feedback to Mike (different project) ❌
- Random users could spam feedback on any project ❌
- Feedback data would be meaningless and unreliable ❌
```

### The Solution: Dual Membership Check

```typescript
// Check 1: Feedback giver is a member
const giverMembership = await prisma.projectMember.findFirst({
    where: {
        projectId: projectId,
        userId: userId, // Person giving feedback
    },
});

// Check 2: Feedback recipient is a member
const recipientMembership = await prisma.projectMember.findFirst({
    where: {
        projectId: projectId,
        userId: toUserId, // Person receiving feedback
    },
});
```

**Why BOTH checks matter:**
- ✅ **Data Integrity**: Feedback only between actual teammates
- ✅ **Meaningful Evaluation**: Feedback from people who worked together
- ✅ **Security**: Prevents cross-project feedback spam
- ✅ **Fair Assessment**: Only project members can evaluate each other

---

## 🚫 Why Self-Feedback is Not Allowed

### The Obvious Problem

```typescript
if (userId === toUserId) {
    return NextResponse.json(
        { error: "You cannot give feedback to yourself" },
        { status: 400 }
    );
}
```

**Why this check exists:**

1. **Prevents Gaming the System**
   ```
   Without this check:
   - John gives himself 5-star rating ❌
   - Sarah gives herself perfect scores ❌
   - Feedback becomes meaningless ❌
   ```

2. **Ensures Peer Evaluation**
   - Feedback should be from **peers**, not self-assessment
   - Self-evaluation is a different feature (not peer feedback)

3. **Maintains Credibility**
   - Mentors can trust the feedback is genuine
   - Students get real insights from teammates
   - System has integrity

**Real-World Analogy:**
- Like Amazon reviews - you can't review your own product
- Like peer review in academia - you can't review your own paper
- Like performance reviews - you don't rate yourself (that's self-assessment)

---

## ⚖️ How This API Ensures Fair Peer Evaluation

### Multi-Layer Fairness Checks

**1. Project Membership (Both Users)**
```typescript
// Ensures feedback is between actual teammates
if (!giverMembership || !recipientMembership) {
    return 403; // Forbidden
}
```

**2. No Self-Feedback**
```typescript
// Prevents inflated self-ratings
if (userId === toUserId) {
    return 400; // Bad Request
}
```

**3. Rating Validation**
```typescript
// Standardized 1-5 scale
if (rating < 1 || rating > 5) {
    return 400; // Bad Request
}
```

**4. Engagement Logging**
```typescript
// Tracks who gave feedback and when
await logEngagement(userId, ActionType.FEEDBACK, ...);
```

### Fair Evaluation Benefits

✅ **Transparency**: All feedback is logged and traceable  
✅ **Accountability**: Users can't game the system  
✅ **Consistency**: Standard 1-5 rating scale  
✅ **Context**: Feedback tied to specific projects  
✅ **Privacy**: Only project members see each other's feedback

---

## ⚠️ Common Beginner Errors & Fixes

### 1. Giving Feedback to Non-Member

**Error Message:**
```json
{
  "error": "Sarah is not a member of this project"
}
```

**Why it happens:**
- Trying to give feedback to someone not in the project
- Using wrong user ID
- User was removed from the project

**How to fix:**

1. **Check project membership in Prisma Studio:**
   ```bash
   npx prisma studio
   # Open ProjectMember table
   # Filter by projectId
   # See who's actually a member
   ```

2. **Only give feedback to actual teammates:**
   ```json
   {
     "toUserId": "user-who-is-in-project"
   }
   ```

---

### 2. Wrong projectId

**Error Message:**
```json
{
  "error": "Project not found"
}
```

**Why it happens:**
- Typo in the project ID
- Using a project ID from a different database
- Project was deleted

**How to fix:**

1. **Get the correct project ID:**
   ```bash
   npx prisma studio
   # Open Project table
   # Copy the exact ID
   ```

2. **Use the correct ID in your request:**
   ```json
   {
     "projectId": "abc-123-def-456"  // Exact match
   }
   ```

---

### 3. Rating Out of Range

**❌ WRONG:**
```json
{
  "rating": 10  // Too high
}
```

**Error Message:**
```json
{
  "error": "Rating must be a number between 1 and 5"
}
```

**Why it happens:**
- Using wrong scale (e.g., 1-10 instead of 1-5)
- Sending rating as string instead of number
- Typo in the rating value

**✅ CORRECT:**
```json
{
  "rating": 5  // Number between 1 and 5
}
```

**Valid ratings:**
- `1` - Poor
- `2` - Below Average
- `3` - Average
- `4` - Good
- `5` - Excellent

---

### 4. Prisma Foreign Key Errors

**Error Message:**
```
Foreign key constraint failed on the field: `projectId`
```

**Why it happens:**

**A. Invalid projectId**
```json
{
  "projectId": "non-existent-id"  // Doesn't exist in database
}
```

**B. Invalid toUserId**
```json
{
  "toUserId": "deleted-user-id"  // User was deleted
}
```

**How to fix:**

1. **Verify all IDs exist:**
   ```bash
   npx prisma studio
   # Check Project table for projectId
   # Check User table for toUserId
   ```

2. **Use valid IDs from your database**

---

### 5. Self-Feedback Attempt

**Error Message:**
```json
{
  "error": "You cannot give feedback to yourself"
}
```

**Why it happens:**
- `x-user-id` header matches `toUserId` in body
- Copy-paste error
- Testing with same user ID

**Example:**
```
Headers:
  x-user-id: user-123

Body:
  toUserId: user-123  // Same as header!
```

**How to fix:**
```
Headers:
  x-user-id: user-123  // You

Body:
  toUserId: user-456  // Different teammate
```

---

## 🧪 Testing Guide (Bruno / Postman)

### Prerequisites

Before testing:
1. ✅ Two users in the database
2. ✅ Both users are members of the same project
3. ✅ You have their user IDs and the project ID

### Test 1: Successful Feedback (Success)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: user-abc-123
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "user-def-456",
  "rating": 5,
  "comment": "Great teamwork! Very helpful with debugging."
}
```

**Expected Response (201 Created):**
```json
{
  "id": "feedback-id-here",
  "fromUserId": "user-abc-123",
  "toUserId": "user-def-456",
  "projectId": "project-xyz-789",
  "rating": 5,
  "comment": "Great teamwork! Very helpful with debugging.",
  "createdAt": "2026-01-13T15:35:00.000Z"
}
```

---

### Test 2: Self-Feedback (Bad Request)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: user-abc-123
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "user-abc-123",  // Same as x-user-id!
  "rating": 5,
  "comment": "I'm awesome!"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "You cannot give feedback to yourself"
}
```

---

### Test 3: Recipient Not a Project Member (Forbidden)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: user-abc-123
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "random-user-not-in-project",
  "rating": 4,
  "comment": "Good work"
}
```

**Expected Response (403 Forbidden):**
```json
{
  "error": "John Doe is not a member of this project"
}
```

---

### Test 4: Invalid Rating (Bad Request)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: user-abc-123
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "user-def-456",
  "rating": 10,  // Out of range!
  "comment": "Excellent work"
}
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Rating must be a number between 1 and 5"
}
```

---

### Test 5: Unauthorized (No Headers)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers: (none)

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "user-def-456",
  "rating": 5,
  "comment": "Great work"
}
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized: You must be logged in"
}
```

---

### Test 6: Feedback Without Comment (Success)

**Request:**
```
Method: POST
URL: http://localhost:3000/api/feedback

Headers:
  x-user-id: user-abc-123
  x-user-role: STUDENT
  Content-Type: application/json

Body:
{
  "projectId": "project-xyz-789",
  "toUserId": "user-def-456",
  "rating": 4
  // No comment field - that's OK!
}
```

**Expected Response (201 Created):**
```json
{
  "id": "feedback-id-here",
  "fromUserId": "user-abc-123",
  "toUserId": "user-def-456",
  "projectId": "project-xyz-789",
  "rating": 4,
  "comment": "",
  "createdAt": "2026-01-13T15:40:00.000Z"
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

### Step 3: Get User IDs
1. Open **ProjectMember** table
2. Filter by the `projectId` from Step 2
3. You'll see all members of that project
4. Copy two different `userId` values

### Step 4: Test
- Use one userId in the `x-user-id` header (feedback giver)
- Use the other userId in the `toUserId` body field (feedback recipient)

---

## 📚 Key Takeaways

1. **Dual membership check** - Both users must be in the project
2. **No self-feedback** - Prevents gaming the system
3. **Rating validation** - Must be 1-5 for consistency
4. **Comment is optional** - Rating alone is sufficient
5. **Engagement logging** - Tracks all feedback activity
6. **Fair evaluation** - Multiple security layers ensure integrity

---

## 🚀 Next Steps

1. ✅ Test the API with all scenarios
2. ✅ Try giving feedback between different project members
3. ✅ Build a GET endpoint to fetch feedback for a user
4. ✅ Create a frontend UI to display and submit feedback
5. ✅ Add analytics (average ratings, feedback trends)

Good luck! 🎉
