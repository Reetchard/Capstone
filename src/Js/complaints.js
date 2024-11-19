import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

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
const db = getFirestore(app);

// Spinner functions
function showGlobalSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) spinner.style.display = "flex";
}

function hideGlobalSpinner() {
    const spinner = document.getElementById("globalSpinner");
    if (spinner) spinner.style.display = "none";
}

// Function to fetch user data from the Users collection
async function getUserById(userId) {
    try {
        const userDoc = await getDoc(doc(db, "Users", userId));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error);
        return null;
    }
}

// Function to load reports from Firestore and populate the table
async function loadReports() {
    const reportsContainer = document.getElementById("reportsTableBody");
    reportsContainer.innerHTML = ""; // Clear existing rows
    showGlobalSpinner(); // Show the spinner before loading

    try {
        const reportsSnapshot = await getDocs(collection(db, "Reports"));

        for (const reportDoc of reportsSnapshot.docs) {
            const reportData = reportDoc.data();

            // Fetch user information from the Users collection
            const userData = await getUserById(reportData.reportId);

            // Create a row for each report
            const row = document.createElement("tr");
            // User ID or Username
            const userIdCell = document.createElement("td");
            userIdCell.textContent = userData?.username || reportData.reportId || "N/A"; // Show username if available
            row.appendChild(userIdCell);
            // Title
            const titleCell = document.createElement("td");
            titleCell.textContent = reportData.title || "N/A";
            row.appendChild(titleCell);

            // Description
            const descCell = document.createElement("td");
            descCell.textContent = reportData.description || "N/A";
            row.appendChild(descCell);
            



            // Type
            const typeCell = document.createElement("td");
            typeCell.textContent = reportData.type || "N/A";
            row.appendChild(typeCell);

            // Urgency
            const urgencyCell = document.createElement("td");
            urgencyCell.textContent = reportData.urgency || "N/A";
            row.appendChild(urgencyCell);


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

            // Status
            const statusCell = document.createElement("td");
            statusCell.textContent = reportData.status || "Pending";
            row.appendChild(statusCell);

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
        }
    } catch (error) {
        console.error("Error loading reports:", error);
        Swal.fire({
            title: "Error",
            text: "Failed to load reports. Please try again later.",
            icon: "error",
            confirmButtonText: "Okay"
        });
    } finally {
        hideGlobalSpinner(); // Hide the spinner after loading
    }
}

// Function to handle action buttons
async function handleAction(action, reportId) {
    const reportRef = doc(db, "Reports", reportId);
    showGlobalSpinner(); // Show spinner during the action

    try {
        if (action === "remove") {
            const result = await Swal.fire({
                title: "Are you sure?",
                text: "You won't be able to revert this!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel"
            });

            if (result.isConfirmed) {
                await deleteDoc(reportRef);
                Swal.fire("Deleted!", "The report has been removed.", "success");
            }
        } else if (action === "solved") {
            await updateDoc(reportRef, { status: "solved" });
            Swal.fire("Success!", "The report has been marked as Solved.", "success");
        } else if (action === "review") {
            await updateDoc(reportRef, { status: "review" });
            Swal.fire("Success!", "The report has been marked for Review.", "success");
        }
    } catch (error) {
        console.error(`Error performing ${action} on report ${reportId}:`, error);
        Swal.fire({
            title: "Error",
            text: `Failed to perform ${action}. Please try again later.`,
            icon: "error",
            confirmButtonText: "Okay"
        });
    } finally {
        setTimeout(() => {
            hideGlobalSpinner(); // Hide spinner after 3 seconds
            loadReports(); // Reload reports after the action
        }, 3000);
    }
}

// Load reports when the page loads
document.addEventListener("DOMContentLoaded", loadReports);
