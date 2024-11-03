// Import necessary Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Ensure the DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const spinner = document.querySelector('.spinner');
    const reportContainer = document.querySelector('.report-container');

    // Function to show the spinner and blur effect
    function showSpinner() {
        spinner.style.display = 'block';
        reportContainer.classList.add('blur');
    }

    // Function to hide the spinner and blur effect
    function hideSpinner() {
        spinner.style.display = 'none';
        reportContainer.classList.remove('blur');
    }

    // Handle form submission
    reportForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent form from submitting normally

        const reportTitle = document.getElementById('reportTitle').value;
        const reportDescription = document.getElementById('reportDescription').value;
        const reportType = document.getElementById('reportType').value;
        const reportUrgency = document.getElementById('reportUrgency').value;
        const reportFile = document.getElementById('reportFile').files[0];
        const userId = auth.currentUser ? auth.currentUser.uid : null; // Get the logged-in user's ID

        if (!userId) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "You need to be logged in to submit a report.",
                showConfirmButton: true,
                confirmButtonText: "Log In",
                confirmButtonColor: "#3085d6",
                customClass: {
                    popup: "swal-popup",
                    title: "swal-title",
                    confirmButton: "swal-confirm-button"
                }
            });
            return;
        }

        let reportData = {
            title: reportTitle,
            description: reportDescription,
            type: reportType,
            urgency: reportUrgency,
            userId: userId,
            timestamp: serverTimestamp()
        };

        // Show the spinner before submitting
        showSpinner();

        try {
            // If there's a file attached, upload it to Firebase Storage
            if (reportFile) {
                const storageRef = ref(storage, `reports/${userId}/${reportFile.name}`);
                const fileSnapshot = await uploadBytes(storageRef, reportFile);
                const fileURL = await getDownloadURL(fileSnapshot.ref);
                reportData.fileURL = fileURL;
            }

            // Save the report data to Firestore
            await addDoc(collection(db, 'Reports'), reportData);

            // Success message with SweetAlert
            Swal.fire({
                icon: "success",
                title: "Report Submitted!",
                text: "Your report was submitted successfully. Thank you for your feedback!",
                showConfirmButton: true,
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
                customClass: {
                    popup: "swal-popup-success",
                    title: "swal-title-success",
                    confirmButton: "swal-confirm-button-success"
                }
            });

            // Clear the form
            reportForm.reset();
        } catch (error) {
            console.error("Error submitting report: ", error);
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: "Failed to submit the report. Please try again.",
                showConfirmButton: true,
                confirmButtonText: "Retry",
                confirmButtonColor: "#d33",
                customClass: {
                    popup: "swal-popup-error",
                    title: "swal-title-error",
                    confirmButton: "swal-confirm-button-error"
                }
            });
        } finally {
            // Hide the spinner
            hideSpinner();
        }
    });
});
