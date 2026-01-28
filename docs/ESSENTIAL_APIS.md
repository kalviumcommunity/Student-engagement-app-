# Essential APIs - Filtered Priority List

## 🎯 MUST HAVE (Build These First) - 4 APIs

These are **critical** for basic functionality:

### 1. ✅ GET /api/tasks
**Why Critical**: Students and mentors need to see tasks  
**Use Case**: Dashboard, task list page  
**Effort**: Easy (similar to GET /api/projects)

### 2. ✅ GET /api/feedback
**Why Critical**: Students need to see their peer ratings  
**Use Case**: Profile page, performance review  
**Effort**: Easy

### 3. ✅ GET /api/projects/[projectId]
**Why Critical**: View project details and statistics  
**Use Case**: Project detail page  
**Effort**: Medium

### 4. ✅ GET /api/projects/[projectId]/members
**Why Critical**: See who's on the team  
**Use Case**: Team roster page  
**Effort**: Easy

---

## 🔥 HIGHLY RECOMMENDED (Build After Must-Haves) - 3 APIs

These add significant value:

### 5. ✅ GET /api/analytics/student/[userId]
**Why Important**: Student performance tracking  
**Use Case**: Student dashboard with stats  
**Effort**: Medium

### 6. ✅ GET /api/tasks/[taskId]
**Why Important**: View single task details  
**Use Case**: Task detail modal/page  
**Effort**: Easy

### 7. ✅ DELETE /api/projects/[projectId]/members/[userId]
**Why Important**: Remove inactive students  
**Use Case**: Team management  
**Effort**: Easy

---

## 📋 NICE TO HAVE (Build Later) - 3 APIs

These are useful but not critical:

### 8. ⭐ GET /api/analytics/project/[projectId]
**Why Useful**: Project progress tracking  
**Use Case**: Mentor dashboard  
**Effort**: Medium

### 9. ⭐ DELETE /api/tasks/[taskId]
**Why Useful**: Clean up obsolete tasks  
**Use Case**: Task management  
**Effort**: Easy

### 10. ⭐ GET /api/users/[userId]
**Why Useful**: User profile page  
**Use Case**: View user details  
**Effort**: Easy

---

## ❌ SKIP FOR NOW (Not Essential) - 5 APIs

These can wait until later:

- ~~PATCH /api/tasks/[taskId]/assign~~ - Can manually delete and recreate task
- ~~GET /api/engagement~~ - Nice for analytics but not critical
- ~~GET /api/notifications~~ - Advanced feature
- ~~POST /api/projects/[projectId]/announcements~~ - Can use external tools
- ~~PATCH /api/users/[userId]~~ - Profile editing is low priority

---

## 🚀 Build Order Recommendation

**Phase 1 (Essential - Do Now):**
1. GET /api/tasks
2. GET /api/feedback
3. GET /api/projects/[projectId]
4. GET /api/projects/[projectId]/members

**Phase 2 (Important - Do Next):**
5. GET /api/analytics/student/[userId]
6. GET /api/tasks/[taskId]
7. DELETE /api/projects/[projectId]/members/[userId]

**Phase 3 (Nice to Have - Do Later):**
8. GET /api/analytics/project/[projectId]
9. DELETE /api/tasks/[taskId]
10. GET /api/users/[userId]

---

## 💡 My Recommendation

**Start with these 4 APIs in this exact order:**

1. **GET /api/tasks** (30 min) - Most critical, easy to build
2. **GET /api/feedback** (20 min) - Essential for peer review feature
3. **GET /api/projects/[projectId]/members** (15 min) - Quick win
4. **GET /api/projects/[projectId]** (45 min) - More complex but very useful

**Total time: ~2 hours** to get all essential APIs done! 🎯

---

Would you like me to start building these? I recommend **GET /api/tasks** first! 🚀
