// Simple front-end validation example
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const message = document.getElementById('message');

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default to handle validation and submission

    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (password !== confirm) {
      message.textContent = "Passwords do not match!";
      message.style.color = "red";
      return;
    }

    // Clear previous message
    message.textContent = "";

    // Send form data with fetch
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.text())
    .then(data => {
      message.textContent = data;
      if (data.includes("successful")) {
        message.style.color = "green";
        // Stay on the same page; user can click the Login link when ready.
      } else {
        message.style.color = "red";
      }
    })
    .catch(error => {
      message.textContent = "An error occurred. Please try again.";
      message.style.color = "red";
    });
  });
});
