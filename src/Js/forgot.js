import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-app.js';
import { getAuth, sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.2.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize authentication

document.addEventListener('DOMContentLoaded', function () {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const messageElement = document.getElementById('message');
    const emailInput = document.getElementById('email');

    // Debugging: Log the elements
    console.log('Forgot Password Form:', forgotPasswordForm);
    console.log('Message Element:', messageElement);
    console.log('Email Input:', emailInput);

    // Ensure required elements are present
    if (!forgotPasswordForm || !messageElement || !emailInput) {
        console.error('Required form elements are missing.');
        return;
    }

    // Add event listener to the form
    forgotPasswordForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const email = emailInput.value.trim();

        if (!email) {
            showErrorMessage(messageElement, 'Email field is required.');
            return;
        }

        sendPasswordResetEmail(auth, email)
            .then(() => {
                showSuccessMessage(messageElement, 'Password reset email sent. Please check your inbox.');

                // Clear email input
                setTimeout(() => {
                    emailInput.value = ''; // Ensure input is cleared with a slight delay
                }, 50);

                // Hide the message after 3 seconds
                setTimeout(() => {
                    messageElement.textContent = '';
                }, 3000);
            })
            .catch((error) => {
                console.error('Error during password reset:', error);
                showErrorMessage(messageElement, `Error: ${error.message}`);
            });
    });
});

function showErrorMessage(element, message) {
    element.style.color = 'red';
    element.textContent = message;
}

function showSuccessMessage(element, message) {
    element.style.color = 'green';
    element.textContent = message;
}
