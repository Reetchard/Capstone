// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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
    const globalSpinner = document.getElementById('globalSpinner'); // Reference to globalSpinner
    
    // Check if globalSpinner exists
    if (!globalSpinner) {
        console.error('globalSpinner not found');
        return;
    }

    // Function to show the spinner
    function showSpinner() {
        console.log('Showing spinner'); // Debug log
        globalSpinner.style.display = 'flex';
    }

    // Function to hide the spinner
    function hideSpinner() {
        console.log('Hiding spinner'); // Debug log
        globalSpinner.style.display = 'none';
    }

    // Handle form submission
    reportForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent form from submitting normally

        const reportTitle = document.getElementById('reportTitle').value;
        const reportDescription = document.getElementById('reportDescription').value;
        const reportType = document.getElementById('reportType').value;
        const reportUrgency = document.getElementById('reportUrgency').value;
        const reportFile = document.getElementById('reportFile').files[0];
        const userId = auth.currentUser ? auth.currentUser.uid : null;

        if (!userId) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "You need to be logged in to submit a report.",
                confirmButtonText: "Log In",
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        let reportData = {
            title: reportTitle,
            description: reportDescription,
            type: reportType,
            urgency: reportUrgency,
            userId: userId,
            status: 'Review',
            timestamp: serverTimestamp()
        };

        // Show the spinner before submitting
        showSpinner();

        try {
            if (reportFile) {
                const storageRef = ref(storage, `reports/${userId}/${reportFile.name}`);
                const fileSnapshot = await uploadBytes(storageRef, reportFile);
                const fileURL = await getDownloadURL(fileSnapshot.ref);
                reportData.fileURL = fileURL;
            }

            // Save report data to Firestore
            await addDoc(collection(db, 'Reports'), reportData);

            Swal.fire({
                icon: "success",
                title: "Report Submitted!",
                text: "Your report was submitted successfully. Thank you!",
                confirmButtonText: "OK",
                confirmButtonColor: "#28a745",
            });

            // Clear the form
            reportForm.reset();
        } catch (error) {
            console.error("Error submitting report: ", error);
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: "Failed to submit the report. Please try again.",
                confirmButtonText: "Retry",
                confirmButtonColor: "#d33",
            });
        } finally {
            // Hide the spinner
            hideSpinner();
        }
    });
});
