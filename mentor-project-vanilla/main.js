/**
 * ============================================
 * CREATE TASK PAGE - TYPESCRIPT LOGIC
 * Handles form interactions, API calls, and animations
 * ============================================
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// ============================================
// DOM ELEMENTS
// ============================================
var form = document.getElementById('taskForm');
var titleInput = document.getElementById('title');
var descriptionInput = document.getElementById('description');
var projectSelect = document.getElementById('projectId');
var assignedToSelect = document.getElementById('assignedTo');
var dueDateInput = document.getElementById('dueDate');
var prioritySelect = document.getElementById('priority');
var submitBtn = document.getElementById('submitBtn');
var btnText = document.getElementById('btnText');
var btnLoader = document.getElementById('btnLoader');
var successMessage = document.getElementById('successMessage');
var successText = document.getElementById('successText');
var errorMessage = document.getElementById('errorMessage');
var errorText = document.getElementById('errorText');
var projectLoader = document.getElementById('projectLoader');
// ============================================
// STATE MANAGEMENT
// ============================================
var projects = [];
var students = [];
var isSubmitting = false;
// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Get authentication headers from localStorage
 * These are needed for all API requests
 */
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || ''
    };
}
/**
 * Show success message with animation
 */
function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}
/**
 * Show error message with animation
 */
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}
/**
 * Hide all messages
 */
function hideMessages() {
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}
/**
 * Set button loading state
 */
function setButtonLoading(loading) {
    if (loading) {
        submitBtn.disabled = true;
        btnText.textContent = 'Creating Task...';
        btnLoader.classList.remove('hidden');
    }
    else {
        submitBtn.disabled = false;
        btnText.textContent = 'Create Task';
        btnLoader.classList.add('hidden');
    }
}
/**
 * Clear the form
 */
function clearForm() {
    form.reset();
    assignedToSelect.disabled = true;
    students = [];
    populateStudentsDropdown();
}
// ============================================
// API FUNCTIONS
// ============================================
/**
 * Fetch all projects from the API
 * GET /api/projects
 */
function fetchProjects() {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    projectLoader.classList.remove('hidden');
                    return [4 /*yield*/, fetch('/api/projects', {
                            headers: getAuthHeaders()
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to fetch projects');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    // Map API response to Project interface
                    projects = data.map(function (p) { return ({
                        id: p.id,
                        name: p.title || p.name
                    }); });
                    populateProjectsDropdown();
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching projects:', error_1);
                    showError('Failed to load projects. Please refresh the page.');
                    return [3 /*break*/, 5];
                case 4:
                    projectLoader.classList.add('hidden');
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Fetch members of a specific project
 * GET /api/projects/:projectId/members
 */
function fetchProjectMembers(projectId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/projects/".concat(projectId, "/members"), {
                            headers: getAuthHeaders()
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to fetch project members');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    // Map and filter only students
                    students = data.members
                        .filter(function (m) { return m.role === 'STUDENT'; })
                        .map(function (m) { return ({
                        memberId: m.id,
                        name: m.name,
                        role: m.role
                    }); });
                    populateStudentsDropdown();
                    assignedToSelect.disabled = false;
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching project members:', error_2);
                    students = [];
                    populateStudentsDropdown();
                    assignedToSelect.disabled = true;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Create a new task
 * POST /api/tasks
 */
function createTask(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/api/tasks', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                            title: payload.title,
                            projectId: payload.projectId,
                            assignedToId: payload.assignedToId
                        })
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.error || 'Failed to create task');
                case 3: return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
// ============================================
// DOM MANIPULATION FUNCTIONS
// ============================================
/**
 * Populate the projects dropdown with fetched data
 */
function populateProjectsDropdown() {
    // Clear existing options except the first one
    projectSelect.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(function (project) {
        var option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
}
/**
 * Populate the students dropdown with filtered members
 */
function populateStudentsDropdown() {
    // Clear existing options except the first one
    assignedToSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(function (student) {
        var option = document.createElement('option');
        option.value = student.memberId;
        option.textContent = student.name;
        assignedToSelect.appendChild(option);
    });
}
// ============================================
// EVENT HANDLERS
// ============================================
/**
 * Handle project selection change
 * When a project is selected, fetch its members
 */
function handleProjectChange() {
    var selectedProjectId = projectSelect.value;
    if (selectedProjectId) {
        // Reset student selection
        assignedToSelect.value = '';
        assignedToSelect.disabled = true;
        // Fetch members for the selected project
        fetchProjectMembers(selectedProjectId);
    }
    else {
        // No project selected, disable student dropdown
        students = [];
        populateStudentsDropdown();
        assignedToSelect.disabled = true;
    }
}
/**
 * Handle form submission
 * Validate inputs and create the task
 */
function handleFormSubmit(event) {
    return __awaiter(this, void 0, void 0, function () {
        var payload, error_3, errorMessage_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    event.preventDefault();
                    // Prevent double submission
                    if (isSubmitting) {
                        return [2 /*return*/];
                    }
                    // Hide previous messages
                    hideMessages();
                    // Validate required fields
                    if (!titleInput.value.trim()) {
                        showError('Please enter a task title');
                        return [2 /*return*/];
                    }
                    if (!projectSelect.value) {
                        showError('Please select a project');
                        return [2 /*return*/];
                    }
                    if (!assignedToSelect.value) {
                        showError('Please select a student to assign the task to');
                        return [2 /*return*/];
                    }
                    if (!dueDateInput.value) {
                        showError('Please select a due date');
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    isSubmitting = true;
                    setButtonLoading(true);
                    payload = {
                        title: titleInput.value.trim(),
                        description: descriptionInput.value.trim(),
                        projectId: projectSelect.value,
                        assignedToId: assignedToSelect.value,
                        dueDate: dueDateInput.value,
                        priority: prioritySelect.value
                    };
                    // Create the task
                    return [4 /*yield*/, createTask(payload)];
                case 2:
                    // Create the task
                    _a.sent();
                    // Show success message
                    showSuccess('Task created successfully! Redirecting...');
                    // Clear the form
                    clearForm();
                    // Redirect to mentor dashboard after 2 seconds
                    setTimeout(function () {
                        window.location.href = '/dashboard/mentor';
                    }, 2000);
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    errorMessage_1 = error_3 instanceof Error
                        ? error_3.message
                        : 'Failed to create task. Please try again.';
                    showError(errorMessage_1);
                    return [3 /*break*/, 5];
                case 4:
                    isSubmitting = false;
                    setButtonLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// ============================================
// INITIALIZATION
// ============================================
/**
 * Initialize the page
 * - Fetch projects on load
 * - Set up event listeners
 */
function init() {
    // Fetch projects when page loads
    fetchProjects();
    // Set up event listeners
    projectSelect.addEventListener('change', handleProjectChange);
    form.addEventListener('submit', handleFormSubmit);
    // Set minimum date to today
    var today = new Date().toISOString().split('T')[0];
    dueDateInput.setAttribute('min', today);
    console.log('Create Task page initialized');
}
// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
