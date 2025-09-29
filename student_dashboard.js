// Global variables
let studentData = null;

// DOM Elements
const welcomeMessage = document.getElementById('welcomeMessage');
const studentName = document.getElementById('studentName');
const studentUSN = document.getElementById('studentUSN');
const studentEmail = document.getElementById('studentEmail');
const totalPoints = document.getElementById('totalPoints');
const profileImage = document.getElementById('profileImage');

// Modal elements
const profileModal = document.getElementById('profileModal');
const aicteModal = document.getElementById('aicteModal');
const activityModal = document.getElementById('activityModal');

// Forms
const profileForm = document.getElementById('profileForm');
const aicteForm = document.getElementById('aicteForm');
const activityForm = document.getElementById('activityForm');

// Lists
const aicteGradesList = document.getElementById('aicteGradesList');
const activitiesList = document.getElementById('activitiesList');
const upcomingEventsList = document.getElementById('upcomingEventsList');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
    loadUpcomingEvents();
    setupEventListeners();
    setupTabs();
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Profile edit button
    document.getElementById('editProfileBtn').addEventListener('click', () => openModal('profileModal'));

    // Quick action cards
    document.getElementById('addAICTEGradeCard').addEventListener('click', () => openModal('aicteModal'));
    document.getElementById('addActivityCard').addEventListener('click', () => openModal('activityModal'));

    // Add buttons
    document.getElementById('addAICTEBtn').addEventListener('click', () => openModal('aicteModal'));
    document.getElementById('addActivityBtn').addEventListener('click', () => openModal('activityModal'));

    // Profile image click
    document.querySelector('.profile-image-container').addEventListener('click', () => openModal('profileModal'));

    // Modal close buttons
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal') || e.target.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Form submissions
    profileForm.addEventListener('submit', updateProfile);
    aicteForm.addEventListener('submit', addAICTEGrade);
    activityForm.addEventListener('submit', addActivity);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Setup tabs functionality
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

// Load student data from server
async function loadStudentData() {
    try {
        const response = await fetch('/api/student-data');
        if (response.ok) {
            const data = await response.json();
            studentData = data;
            updateUI(data);
        } else {
            showMessage('Error loading student data', 'error');
        }
    } catch (error) {
        console.error('Error loading student data:', error);
        showMessage('Error loading student data', 'error');
    }
}

// Update UI with student data
function updateUI(data) {
    const { student, aicteGrades, activities } = data;

    // Update profile section
    welcomeMessage.textContent = `Welcome, ${student.name}!`;
    studentName.textContent = student.name;
    studentUSN.textContent = `USN: ${student.usn}`;
    studentEmail.textContent = `Email: ${student.email}`;
    totalPoints.textContent = student.totalPoints;

    // Update profile image
    if (student.profilePicture) {
        profileImage.src = student.profilePicture;
    }

    // Fill profile form
    document.getElementById('nameInput').value = student.name;
    document.getElementById('phoneInput').value = student.phone || '';
    document.getElementById('departmentInput').value = student.department || '';
    document.getElementById('yearInput').value = student.year || '';
    document.getElementById('semesterInput').value = student.semester || '';

    // Update AICTE grades list
    updateAICTEGradesList(aicteGrades);

    // Update activities list
    updateActivitiesList(activities);
}

// Update AICTE grades list
function updateAICTEGradesList(grades) {
    if (grades.length === 0) {
        aicteGradesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-medal"></i>
                <h3>No AICTE grades yet</h3>
                <p>Start by adding your first AICTE grade point with proof!</p>
            </div>
        `;
        return;
    }

    aicteGradesList.innerHTML = grades.map(grade => `
        <div class="grade-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${grade.activityName}</div>
                    <div class="item-date">Added: ${new Date(grade.dateAdded).toLocaleDateString()}</div>
                </div>
                <div>
                    <span class="item-points">${grade.points} points</span>
                    <span class="status-badge status-${grade.status}">${grade.status}</span>
                </div>
            </div>
            <a href="${grade.proofDocument}" target="_blank" class="proof-link">
                <i class="fas fa-file-alt"></i>
                View Proof Document
            </a>
        </div>
    `).join('');
}

// Update activities list
function updateActivitiesList(activities) {
    if (activities.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <h3>No activities yet</h3>
                <p>Start by adding your first activity!</p>
            </div>
        `;
        return;
    }

    activitiesList.innerHTML = activities.map(activity => `
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

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Update profile
async function updateProfile(e) {
    e.preventDefault();
    
    const formData = new FormData(profileForm);
    
    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Profile updated successfully!', 'success');
            closeModal('profileModal');
            loadStudentData(); 
        } else {
            showMessage(result.error || 'Error updating profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile', 'error');
    }
}

// Add AICTE grade
async function addAICTEGrade(e) {
    e.preventDefault();
    
    const formData = new FormData(aicteForm);
    
    try {
        const response = await fetch('/api/add-aicte-grade', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('AICTE grade added successfully!', 'success');
            closeModal('aicteModal');
            aicteForm.reset();
            loadStudentData(); 
        } else {
            showMessage(result.error || 'Error adding AICTE grade', 'error');
        }
    } catch (error) {
        console.error('Error adding AICTE grade:', error);
        showMessage('Error adding AICTE grade', 'error');
    }
}

// Add activity
async function addActivity(e) {
    e.preventDefault();
    
    const formData = new FormData(activityForm);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/add-activity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Activity added successfully!', 'success');
            closeModal('activityModal');
            activityForm.reset();
            loadStudentData(); // Reload data to reflect changes
        } else {
            showMessage(result.error || 'Error adding activity', 'error');
        }
    } catch (error) {
        console.error('Error adding activity:', error);
        showMessage('Error adding activity', 'error');
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
            window.location.href = '/login';
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

// File input preview functionality
document.getElementById('profilePictureInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            
            console.log('Profile picture selected:', file.name);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('proofDocument').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        console.log('Proof document selected:', file.name);
    }
});

// Load upcoming events
async function loadUpcomingEvents() {
    try {
        const response = await fetch('/api/events');
        if (response.ok) {
            const events = await response.json();
            updateUpcomingEventsList(events);
        } else {
            showMessage('Error loading events', 'error');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showMessage('Error loading events', 'error');
    }
}

// Update upcoming events list
function updateUpcomingEventsList(events) {
    if (events.length === 0) {
        upcomingEventsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h3>No upcoming events</h3>
                <p>There are no upcoming events at the moment.</p>
            </div>
        `;
        return;
    }

    upcomingEventsList.innerHTML = events.map(event => `
        <div class="event-item">
            <div class="item-header">
                <div>
                    <div class="item-title">${event.title}</div>
                    <div class="item-date">${new Date(event.eventDate).toLocaleString()}</div>
                    <span class="event-category">${event.category}</span>
                </div>
                <div class="event-mentor">
                    <i class="fas fa-user-tie"></i>
                    <span>By: ${event.mentorId.name} (${event.mentorId.department})</span>
                </div>
            </div>
            <div class="item-description">${event.description}</div>
            <div class="event-location">
                <i class="fas fa-map-marker-alt"></i> ${event.location}
            </div>
        </div>
    `).join('');
}

// Add some animations and interactions
document.addEventListener('DOMContentLoaded', function() {

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