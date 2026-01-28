/**
 * ============================================
 * CREATE TASK PAGE - TYPESCRIPT LOGIC
 * Handles form interactions, API calls, and animations
 * ============================================
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Represents a project in the system
 */
interface Project {
    id: string;
    name: string;
}

/**
 * Represents a project member (student or mentor)
 */
interface Member {
    memberId: string;
    name: string;
    role: 'STUDENT' | 'MENTOR';
}

/**
 * Payload for creating a new task
 */
interface TaskPayload {
    title: string;
    description?: string;
    projectId: string;
    assignedToId: string;
    dueDate?: string;
    priority?: 'Low' | 'Medium' | 'High';
}

/**
 * API response for project members
 */
interface MembersResponse {
    members: Array<{
        id: string;
        name: string;
        role: 'STUDENT' | 'MENTOR';
    }>;
}

// ============================================
// DOM ELEMENTS
// ============================================

const form = document.getElementById('taskForm') as HTMLFormElement;
const titleInput = document.getElementById('title') as HTMLInputElement;
const descriptionInput = document.getElementById('description') as HTMLTextAreaElement;
const projectSelect = document.getElementById('projectId') as HTMLSelectElement;
const assignedToSelect = document.getElementById('assignedTo') as HTMLSelectElement;
const dueDateInput = document.getElementById('dueDate') as HTMLInputElement;
const prioritySelect = document.getElementById('priority') as HTMLSelectElement;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const btnText = document.getElementById('btnText') as HTMLSpanElement;
const btnLoader = document.getElementById('btnLoader') as HTMLDivElement;
const successMessage = document.getElementById('successMessage') as HTMLDivElement;
const successText = document.getElementById('successText') as HTMLSpanElement;
const errorMessage = document.getElementById('errorMessage') as HTMLDivElement;
const errorText = document.getElementById('errorText') as HTMLSpanElement;
const projectLoader = document.getElementById('projectLoader') as HTMLDivElement;

// ============================================
// STATE MANAGEMENT
// ============================================

let projects: Project[] = [];
let students: Member[] = [];
let isSubmitting = false;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get authentication headers from localStorage
 * These are needed for all API requests
 */
function getAuthHeaders(): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'x-user-id': localStorage.getItem('userId') || '',
        'x-user-role': localStorage.getItem('userRole') || ''
    };
}

/**
 * Show success message with animation
 */
function showSuccess(message: string): void {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Show error message with animation
 */
function showError(message: string): void {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}

/**
 * Hide all messages
 */
function hideMessages(): void {
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

/**
 * Set button loading state
 */
function setButtonLoading(loading: boolean): void {
    if (loading) {
        submitBtn.disabled = true;
        btnText.textContent = 'Creating Task...';
        btnLoader.classList.remove('hidden');
    } else {
        submitBtn.disabled = false;
        btnText.textContent = 'Create Task';
        btnLoader.classList.add('hidden');
    }
}

/**
 * Clear the form
 */
function clearForm(): void {
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
async function fetchProjects(): Promise<void> {
    try {
        projectLoader.classList.remove('hidden');

        const response = await fetch('/api/projects', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch projects');
        }

        const data = await response.json();

        // Map API response to Project interface
        projects = data.map((p: any) => ({
            id: p.id,
            name: p.title || p.name
        }));

        populateProjectsDropdown();
    } catch (error) {
        console.error('Error fetching projects:', error);
        showError('Failed to load projects. Please refresh the page.');
    } finally {
        projectLoader.classList.add('hidden');
    }
}

/**
 * Fetch members of a specific project
 * GET /api/projects/:projectId/members
 */
async function fetchProjectMembers(projectId: string): Promise<void> {
    try {
        const response = await fetch(`/api/projects/${projectId}/members`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch project members');
        }

        const data: MembersResponse = await response.json();

        // Map and filter only students
        students = data.members
            .filter(m => m.role === 'STUDENT')
            .map(m => ({
                memberId: m.id,
                name: m.name,
                role: m.role
            }));

        populateStudentsDropdown();
        assignedToSelect.disabled = false;
    } catch (error) {
        console.error('Error fetching project members:', error);
        students = [];
        populateStudentsDropdown();
        assignedToSelect.disabled = true;
    }
}

/**
 * Create a new task
 * POST /api/tasks
 */
async function createTask(payload: TaskPayload): Promise<void> {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            title: payload.title,
            projectId: payload.projectId,
            assignedToId: payload.assignedToId
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
    }

    return await response.json();
}

// ============================================
// DOM MANIPULATION FUNCTIONS
// ============================================

/**
 * Populate the projects dropdown with fetched data
 */
function populateProjectsDropdown(): void {
    // Clear existing options except the first one
    projectSelect.innerHTML = '<option value="">Select Project</option>';

    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelect.appendChild(option);
    });
}

/**
 * Populate the students dropdown with filtered members
 */
function populateStudentsDropdown(): void {
    // Clear existing options except the first one
    assignedToSelect.innerHTML = '<option value="">Select Student</option>';

    students.forEach(student => {
        const option = document.createElement('option');
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
function handleProjectChange(): void {
    const selectedProjectId = projectSelect.value;

    if (selectedProjectId) {
        // Reset student selection
        assignedToSelect.value = '';
        assignedToSelect.disabled = true;

        // Fetch members for the selected project
        fetchProjectMembers(selectedProjectId);
    } else {
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
async function handleFormSubmit(event: Event): Promise<void> {
    event.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
        return;
    }

    // Hide previous messages
    hideMessages();

    // Validate required fields
    if (!titleInput.value.trim()) {
        showError('Please enter a task title');
        return;
    }

    if (!projectSelect.value) {
        showError('Please select a project');
        return;
    }

    if (!assignedToSelect.value) {
        showError('Please select a student to assign the task to');
        return;
    }

    if (!dueDateInput.value) {
        showError('Please select a due date');
        return;
    }

    try {
        isSubmitting = true;
        setButtonLoading(true);

        // Prepare task payload
        const payload: TaskPayload = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            projectId: projectSelect.value,
            assignedToId: assignedToSelect.value,
            dueDate: dueDateInput.value,
            priority: prioritySelect.value as 'Low' | 'Medium' | 'High'
        };

        // Create the task
        await createTask(payload);

        // Show success message
        showSuccess('Task created successfully! Redirecting...');

        // Clear the form
        clearForm();

        // Redirect to mentor dashboard after 2 seconds
        setTimeout(() => {
            window.location.href = '/dashboard/mentor';
        }, 2000);

    } catch (error) {
        const errorMessage = error instanceof Error
            ? error.message
            : 'Failed to create task. Please try again.';
        showError(errorMessage);
    } finally {
        isSubmitting = false;
        setButtonLoading(false);
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the page
 * - Fetch projects on load
 * - Set up event listeners
 */
function init(): void {
    // Fetch projects when page loads
    fetchProjects();

    // Set up event listeners
    projectSelect.addEventListener('change', handleProjectChange);
    form.addEventListener('submit', handleFormSubmit);

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.setAttribute('min', today);

    console.log('Create Task page initialized');
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
