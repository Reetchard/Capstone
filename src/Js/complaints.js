// Import necessary Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc, getDoc, query, where, updateDoc, deleteDoc, onSnapshot, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getStorage, ref, getDownloadURL, uploadBytes } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore with the modular syntax

// Function to load reports from Firestore and populate the table
async function loadReports() {
    const reportsContainer = document.getElementById("reportsTableBody");
    reportsContainer.innerHTML = ""; // Clear existing rows

    const reportsSnapshot = await getDocs(collection(db, "Reports"));
    reportsSnapshot.forEach((reportDoc) => {
        const reportData = reportDoc.data();

        // Create a row for each report
        const row = document.createElement("tr");

        // Title
        const titleCell = document.createElement("td");
        titleCell.textContent = reportData.title;
        row.appendChild(titleCell);

        // Description
        const descCell = document.createElement("td");
        descCell.textContent = reportData.description;
        row.appendChild(descCell);

        // Type
        const typeCell = document.createElement("td");
        typeCell.textContent = reportData.type;
        row.appendChild(typeCell);

        // Urgency
        const urgencyCell = document.createElement("td");
        urgencyCell.textContent = reportData.urgency;
        row.appendChild(urgencyCell);

        // User ID
        const userIdCell = document.createElement("td");
        userIdCell.textContent = reportData.userId;
        row.appendChild(userIdCell);

        // File Link
        const fileCell = document.createElement("td");
        if (reportData.fileURL) {
            const fileLink = document.createElement("a");
            fileLink.href = reportData.fileURL;
            fileLink.target = "_blank";
            fileLink.textContent = "View File";
            fileCell.appendChild(fileLink);
        } else {
            fileCell.textContent = "No File";
        }
        row.appendChild(fileCell);

        // Timestamp
        const timestampCell = document.createElement("td");
        timestampCell.textContent = reportData.timestamp?.toDate().toLocaleString() || "N/A";
        row.appendChild(timestampCell);

        // Actions
        const actionCell = document.createElement("td");

        // Solved button
        const solvedButton = document.createElement("button");
        solvedButton.textContent = "Solved";
        solvedButton.classList.add("btn", "btn-success", "mr-1");
        solvedButton.addEventListener("click", () => handleAction("solved", reportDoc.id));
        actionCell.appendChild(solvedButton);

        // Review button
        const reviewButton = document.createElement("button");
        reviewButton.textContent = "Review";
        reviewButton.classList.add("btn", "btn-warning", "mr-1");
        reviewButton.addEventListener("click", () => handleAction("review", reportDoc.id));
        actionCell.appendChild(reviewButton);

        // Remove button
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.classList.add("btn", "btn-danger");
        removeButton.addEventListener("click", () => handleAction("remove", reportDoc.id));
        actionCell.appendChild(removeButton);

        row.appendChild(actionCell);
        reportsContainer.appendChild(row);
    });
}

// Function to handle action buttons
async function handleAction(action, reportId) {
    const reportRef = doc(db, "Reports", reportId);

    if (action === "remove") {
        if (confirm("Are you sure you want to delete this report?")) {
            await deleteDoc(reportRef);
            loadReports(); // Reload reports after deletion
        }
    } else if (action === "solved") {
        await updateDoc(reportRef, { status: "solved" });
        alert("Marked as Solved");
        loadReports();
    } else if (action === "review") {
        await updateDoc(reportRef, { status: "review" });
        alert("Marked for Review");
        loadReports();
    }
}

// Load reports when the page loads
document.addEventListener("DOMContentLoaded", loadReports);
