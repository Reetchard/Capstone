// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
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

document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const globalSpinner = document.getElementById('globalSpinner'); // Reference to globalSpinner

    // Spinner functions
    function showSpinner() {
        globalSpinner.style.display = 'flex';
    }

    function hideSpinner() {
        globalSpinner.style.display = 'none';
    }

    // Function to get the next report ID
    async function getNextReportId() {
        const reportCounterRef = doc(db, 'ReportCounters', 'counter');
        const reportCounterSnap = await getDoc(reportCounterRef);

        if (reportCounterSnap.exists()) {
            const currentId = reportCounterSnap.data().currentId;
            await setDoc(reportCounterRef, { currentId: currentId + 1 }, { merge: true });
            return currentId + 1;
        } else {
            // Initialize counter if it doesn't exist
            await setDoc(reportCounterRef, { currentId: 1 });
            return 1;
        }
    }

    // Handle form submission
    reportForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent form from submitting normally

        const reportTitle = document.getElementById('reportTitle').value;
        const reportDescription = document.getElementById('reportDescription').value;
        const reportType = document.getElementById('reportType').value;
        const reportUrgency = document.getElementById('reportUrgency').value;
        const reportFile = document.getElementById('reportFile').files[0];

        // Get the logged-in user
        const user = auth.currentUser;

        if (!user) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "You need to be logged in to submit a report.",
                confirmButtonText: "Log In",
                confirmButtonColor: "#3085d6",
            });
            return;
        }

        const userId = user.uid; // Get the user ID from the logged-in user

        // Prepare the report data
        let reportData = {
            userId: userId,
            title: reportTitle,
            description: reportDescription,
            type: reportType,
            urgency: reportUrgency,
            status: 'Review',
            timestamp: serverTimestamp()
        };

        showSpinner();

        try {
            // Fetch the next report ID
            const reportId = await getNextReportId();
            reportData.reportId = reportId; // Add the generated report ID to the report data

            // Upload the file if provided
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
                text: `Your report (ID: ${reportId}) was submitted successfully. Thank you!`,
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
            hideSpinner();
        }
    });
});
