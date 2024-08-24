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
const auth = getAuth(app); // Ensure `auth` is properly initialized

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const messageElement = document.getElementById('message');

    // Debugging: Log elements to the console
    console.log('Forgot Password Form:', forgotPasswordForm);
    console.log('Message Element:', messageElement);

    // Check if form element is present
    if (!forgotPasswordForm) {
        console.error('Form element with ID "forgotPasswordForm" not found.');
        return;
    }

    // Check if message element is present
    if (!messageElement) {
        console.error('Element with ID "message" not found.');
        return;
    }

    forgotPasswordForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;

        if (!email) {
            showErrorMessage(messageElement, 'Email field is required.');
            return;
        }

        sendPasswordResetEmail(auth, email)  // Use the imported function
            .then(() => {
                showSuccessMessage(messageElement, 'Password reset email sent. Please check your inbox.');
            })
            .catch((error) => {
                showErrorMessage(messageElement, 'SignIn Error: ' + error.message);
            });
    });
});