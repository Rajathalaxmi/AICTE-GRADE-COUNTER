document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/mentor-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        document.getElementById('message').innerText = result.message;
        if (result.success) {
            // Redirect to mentor dashboard
            window.location.href = '/mentor-dashboard';
        }
    } catch (error) {
        document.getElementById('message').innerText = 'An error occurred. Please try again.';
    }
});