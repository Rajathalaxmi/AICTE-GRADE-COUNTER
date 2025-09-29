// Global variables
let mentorData = null;
let currentStudent = null;
let currentEditingEvent = null;

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const mentorName = document.getElementById('mentorName');
const mentorEmail = document.getElementById('mentorEmail');
const mentorDepartment = document.getElementById('mentorDepartment');
const eventCount = document.getElementById('eventCount');

// Modal elements
const eventModal = document.getElementById('eventModal');
const gradeStatusModal = document.getElementById('gradeStatusModal');

// Forms
const studentSearchForm = document.getElementById('studentSearchForm');
const eventForm = document.getElementById('eventForm');
const gradeStatusForm = document.getElementById('gradeStatusForm');

// Lists
const eventsList = document.getElementById('eventsList');
const studentDetails = document.getElementById('studentDetails');
const studentGradesList = document.getElementById('studentGradesList');
const studentActivitiesList = document.getElementById('studentActivitiesList');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadMentorData();
    setupEventListeners();
    setupTabs();
    setupStudentTabs();
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Quick action cards
    document.getElementById('searchStudentCard').addEventListener('click', () => {
        document.querySelector('[data-tab="student-search"]').click();
        document.getElementById('usnInput').focus();
    });
    document.getElementById('addEventCard').addEventListener('click', () => openAddEventModal());

    // Add event button
    document.getElementById('addEventBtn').addEventListener('click', () => openAddEventModal());

    // Modal close buttons
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal') || e.target.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Form submissions
    studentSearchForm.addEventListener('submit', searchStudent);
    eventForm.addEventListener('submit', saveEvent);
    gradeStatusForm.addEventListener('submit', updateGradeStatus);

    // Event targeting checkbox
    document.getElementById('isOpenToAll').addEventListener('change', function() {
        const targetingOptions = document.getElementById('targetingOptions');
        if (this.checked) {
            targetingOptions.style.display = 'none';
        } else {
            targetingOptions.style.display = 'block';
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Setup main tabs functionality
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Setup student tabs functionality
function setupStudentTabs() {
    const studentTabButtons = document.querySelectorAll('.student-tab-btn');
    const studentTabContents = document.querySelectorAll('.student-tab-content');

    studentTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            studentTabButtons.forEach(btn => btn.classList.remove('active'));
            studentTabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Load mentor data from server
async function loadMentorData() {
    try {
        const response = await fetch('/api/mentor-data');
        if (response.ok) {
            const data = await response.json();
            mentorData = data;
            updateMentorUI(data);
        } else {
            showMessage('Error loading mentor data', 'error');
        }
    } catch (error) {
        console.error('Error loading mentor data:', error);
        showMessage('Error loading mentor data', 'error');
    }
}

// Update mentor UI
function updateMentorUI(data) {
    const { mentor, events } = data;

    // Update profile section
    welcomeMessage.textContent = `Welcome, ${mentor.name}!`;
    mentorName.textContent = mentor.name;
    mentorEmail.textContent = `Email: ${mentor.email}`;
    mentorDepartment.textContent = `Department: ${mentor.department}`;
    eventCount.textContent = events.length;

    // Update events list
    updateEventsList(events);
}

// Search student
async function searchStudent(e) {
    e.preventDefault();
    
    const usn = document.getElementById('usnInput').value.trim();
    if (!usn) return;

    try {
        const response = await fetch('/api/search-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usn })
        });

        if (response.ok) {
            const data = await response.json();
            currentStudent = data;
            displayStudentData(data);
            showMessage('Student found successfully!', 'success');
        } else {
            const error = await response.json();
            showMessage(error.error || 'Student not found', 'error');
            hideStudentDetails();
        }
    } catch (error) {
        console.error('Error searching student:', error);
        showMessage('Error searching student', 'error');
        hideStudentDetails();
    }
}

// Display student data
function displayStudentData(data) {
    const { student, aicteGrades, activities } = data;

    // Show student details section
    studentDetails.style.display = 'block';

    // Update student info
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentUSN').textContent = `USN: ${student.usn}`;
    document.getElementById('studentEmail').textContent = `Email: ${student.email}`;
    document.getElementById('studentDepartment').textContent = `Department: ${student.department || 'Not specified'}`;
    document.getElementById('studentYear').textContent = `Year: ${student.year || 'Not specified'}`;
    document.getElementById('studentPoints').textContent = student.totalPoints;

    // Update student image
    const studentImage = document.getElementById('studentImage');
    if (student.profilePicture) {
        studentImage.src = student.profilePicture;
    } else {
        studentImage.src = 'https://via.placeholder.com/100/4CAF50/white?text=Student';
    }

    // Update grades and activities
    updateStudentGradesList(aicteGrades);
    updateStudentActivitiesList(activities);
}

// Hide student details
function hideStudentDetails() {
    studentDetails.style.display = 'none';
    currentStudent = null;
}

// Update student grades list
function updateStudentGradesList(grades) {
    if (grades.length === 0) {
        studentGradesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-medal"></i>
                <h3>No AICTE grades found</h3>
                <p>This student hasn't submitted any AICTE grades yet.</p>
            </div>
        `;
        return;
    }

    studentGradesList.innerHTML = grades.map(grade => `
        <div class="grade-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${grade.activityName}</div>
                    <div class="item-date">Submitted: ${new Date(grade.dateAdded).toLocaleDateString()}</div>
                </div>
                <div>
                    <span class="item-points">${grade.points} points</span>
                    <span class="status-badge status-${grade.status}">${grade.status}</span>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem;">
                <a href="${grade.proofDocument}" target="_blank" class="proof-link">
                    <i class="fas fa-file-alt"></i>
                    View Proof Document
                </a>
                <button class="update-status-btn" onclick="openGradeStatusModal('${grade._id}', '${grade.activityName}', ${grade.points}, '${grade.status}')">
                    <i class="fas fa-edit"></i> Update Status
                </button>
            </div>
        </div>
    `).join('');
}

// Update student activities list
function updateStudentActivitiesList(activities) {
    if (activities.length === 0) {
        studentActivitiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No activities found</h3>
                <p>This student hasn't added any activities yet.</p>
            </div>
        `;
        return;
    }

    studentActivitiesList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${activity.activityName}</div>
                    <div class="item-date">${new Date(activity.dateTime).toLocaleString()}</div>
                </div>
                <span class="item-points">${activity.points} points</span>
            </div>
            <div class="item-description">${activity.description}</div>
        </div>
    `).join('');
}

// Update events list
function updateEventsList(events) {
    if (events.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <h3>No events created</h3>
                <p>Start by creating your first event for students!</p>
            </div>
        `;
        return;
    }

    eventsList.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${event.title}</div>
                    <div class="item-date">${new Date(event.eventDate).toLocaleString()}</div>
                    <span class="event-category">${event.category}</span>
                </div>
                <div class="event-actions">
                    <button class="edit-btn" onclick="openEditEventModal('${event._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="deleteEvent('${event._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="item-description">${event.description}</div>
            <div class="event-location">
                <i class="fas fa-map-marker-alt"></i> ${event.location}
            </div>
            <div class="event-targeting">
                ${event.isOpenToAll ? 
                    '<span class="targeting-badge open-to-all"><i class="fas fa-globe"></i> Open to All Students</span>' :
                    `<div class="targeting-details">
                        <span class="targeting-badge targeted"><i class="fas fa-bullseye"></i> Targeted Event</span>
                        ${event.targetUSNRange?.startUSN && event.targetUSNRange?.endUSN ? 
                            `<span class="targeting-info">USN: ${event.targetUSNRange.startUSN} - ${event.targetUSNRange.endUSN}</span>` : ''}
                        ${event.targetSemesters?.length > 0 ? 
                            `<span class="targeting-info">Semesters: ${event.targetSemesters.join(', ')}</span>` : ''}
                        ${event.targetDepartments?.length > 0 ? 
                            `<span class="targeting-info">Departments: ${event.targetDepartments.join(', ')}</span>` : ''}
                    </div>`
                }
            </div>
        </div>
    `).join('');
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset forms
    if (modalId === 'eventModal') {
        eventForm.reset();
        currentEditingEvent = null;
        document.getElementById('eventModalTitle').textContent = 'Add Event';
        document.getElementById('eventSubmitBtn').textContent = 'Add Event';
        document.getElementById('eventStatusGroup').style.display = 'none';
        // Reset targeting options
        document.getElementById('isOpenToAll').checked = true;
        document.getElementById('targetingOptions').style.display = 'none';
    }
}

// Open add event modal
function openAddEventModal() {
    currentEditingEvent = null;
    document.getElementById('eventModalTitle').textContent = 'Add Event';
    document.getElementById('eventSubmitBtn').textContent = 'Add Event';
    document.getElementById('eventStatusGroup').style.display = 'none';
    eventForm.reset();
    // Reset targeting options
    document.getElementById('isOpenToAll').checked = true;
    document.getElementById('targetingOptions').style.display = 'none';
    openModal('eventModal');
}

// Open edit event modal
function openEditEventModal(eventId) {
    const event = mentorData.events.find(e => e._id === eventId);
    if (!event) return;

    currentEditingEvent = event;
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    document.getElementById('eventSubmitBtn').textContent = 'Update Event';
    document.getElementById('eventStatusGroup').style.display = 'block';

    // Fill form with event data
    document.getElementById('eventId').value = event._id;
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventDate').value = new Date(event.eventDate).toISOString().slice(0, 16);
    document.getElementById('eventLocation').value = event.location;
    document.getElementById('eventCategory').value = event.category;
    document.getElementById('eventStatus').value = event.isActive.toString();
    
    // Fill targeting fields
    document.getElementById('isOpenToAll').checked = event.isOpenToAll;
    document.getElementById('startUSN').value = event.targetUSNRange?.startUSN || '';
    document.getElementById('endUSN').value = event.targetUSNRange?.endUSN || '';
    document.getElementById('targetSemesters').value = event.targetSemesters?.join(',') || '';
    document.getElementById('targetDepartments').value = event.targetDepartments?.join(',') || '';
    
    // Show/hide targeting options based on isOpenToAll
    const targetingOptions = document.getElementById('targetingOptions');
    if (event.isOpenToAll) {
        targetingOptions.style.display = 'none';
    } else {
        targetingOptions.style.display = 'block';
    }

    openModal('eventModal');
}

// Open grade status modal
function openGradeStatusModal(gradeId, activityName, points, status) {
    document.getElementById('gradeId').value = gradeId;
    document.getElementById('gradeActivityName').value = activityName;
    document.getElementById('gradePoints').value = points;
    document.getElementById('gradeStatus').value = status;
    openModal('gradeStatusModal');
}

// Save event (add or update)
async function saveEvent(e) {
    e.preventDefault();
    
    const formData = new FormData(eventForm);
    const data = Object.fromEntries(formData);
    
    const endpoint = currentEditingEvent ? '/api/update-event' : '/api/add-event';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            closeModal('eventModal');
            loadMentorData(); // Reload data to reflect changes
        } else {
            showMessage(result.error || 'Error saving event', 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showMessage('Error saving event', 'error');
    }
}

// Update grade status
async function updateGradeStatus(e) {
    e.preventDefault();
    
    const formData = new FormData(gradeStatusForm);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/update-grade-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            closeModal('gradeStatusModal');
            // Refresh student data
            if (currentStudent) {
                const usn = currentStudent.student.usn;
                document.getElementById('usnInput').value = usn;
                searchStudent({ preventDefault: () => {} });
            }
        } else {
            showMessage(result.error || 'Error updating grade status', 'error');
        }
    } catch (error) {
        console.error('Error updating grade status:', error);
        showMessage('Error updating grade status', 'error');
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ eventId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
            loadMentorData(); // Reload data to reflect changes
        } else {
            showMessage(result.error || 'Error deleting event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showMessage('Error deleting event', 'error');
    }
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/mentor-login';
        } else {
            showMessage('Error logging out', 'error');
        }
    } catch (error) {
        console.error('Error logging out:', error);
        showMessage('Error logging out', 'error');
    }
}

// Show message function
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Auto remove message after 5 seconds
    setTimeout(() => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    }, 5000);
    
    // Add click to dismiss
    messageElement.addEventListener('click', () => {
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
    });
}

// Add some animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add loading animation to cards
    const cards = document.querySelectorAll('.action-card, .profile-card, .content-tabs');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});