import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, where, addDoc,doc, updateDoc, deleteDoc, getDoc ,query} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentGymName = null;  // Store the current gym name globally

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'GymOwner', userId);
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    currentGymName = userData.gymName;  // Set gym name globally
                    
                    // Populate gym details
                    const gymDetailsTable = document.getElementById('gymDetailsTable');
                    gymDetailsTable.innerHTML = '';
                    const gymRow = document.createElement('tr');
                    gymRow.innerHTML = `
                        <td>${userData.gymName || 'N/A'}</td>
                        <td>${userData.gymDescription || 'No description available'}</td>
                        <td>${userData.gymLocation || 'Not Available'}</td>
                        <td>${userData.gymContact || 'Not Available'}</td>
                        <td>${userData.gymPrograms || 'N/A'}</td>
                        <td>${userData.gymServices || 'N/A'}</td>
                        <td>${userData.gymOpeningTime || 'N/A'}</td>
                        <td>${userData.gymClosingTime || 'N/A'}</td>
                        <td>
                            <button class="btn btn-warning" onclick="editGymDetails('${userId}')">Edit</button>
                        </td>
                    `;
                    gymDetailsTable.appendChild(gymRow);

                    // Fetch profiles after user info is loaded
                    fetchGymProfiles();
                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        } else {
            window.location.href = 'login.html';
        }
    });
});
async function fetchGymProfiles(filterName = null) {
    const gymsCollection = collection(db, 'GymOwner');

    // Use the global gym name if available
    const gymOwnerQuery = query(gymsCollection, where('gymName', '==', currentGymName));
    const gymSnapshot = await getDocs(gymOwnerQuery);
    const gymList = gymSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    const gymDetailsTable = document.getElementById('gymDetailsTable');
    gymDetailsTable.innerHTML = '';

    gymList.forEach(gym => {
        if (gym.status && gym.status !== 'Decline' && (!filterName || gym.gymName === filterName)) {
            const gymRow = document.createElement('tr');
            gymRow.innerHTML = `
                 <td><img src="${gym.gymPhoto || 'default.jpg'}" alt="Gym Photo" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymPhoto}')"></td>
                <td><img src="${gym.gymCertifications || 'default-cert.jpg'}" alt="Certification" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymCertifications}')"></td>
                <td>${gym.gymName || 'N/A'}</td>
                <td>${gym.gymLocation || 'Not Available'}</td>
                <td>${gym.gymContact || 'Not Available'}</td>
                <td>${gym.gymPrograms || 'N/A'}</td>
                <td>${gym.gymEquipment || 'N/A'}</td>
                <td>${gym.gymServices || 'N/A'}</td>
                <td>${gym.gymPriceRate || 'N/A'}</td>                
                <td>${gym.gymOpeningTime || 'N/A'}</td>
                <td>${gym.gymClosingTime || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning" onclick="editGymDetails('${gym.id}')">Edit</button>
                </td>
            `;
            gymDetailsTable.appendChild(gymRow);
        }
    });
    
}
window.showImage = (src) => {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = src || 'default.jpg';
    $('#imageModal').modal('show');
}
let currentGymId = null;

    window.editGymDetails = async (id) => {
        const docRef = doc(db, 'GymOwner', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const gym = docSnap.data();
            document.getElementById('gymPhoto').value = gym.gymPhoto || '';
            document.getElementById('gymCertifications').value = gym.gymCertifications || '';
            document.getElementById('gymName').value = gym.gymName || '';
            document.getElementById('gymLocation').value = gym.gymLocation || '';
            document.getElementById('gymContact').value = gym.gymContact || '';
            document.getElementById('gymPriceRate').value = gym.gymPriceRate || '';
            document.getElementById('gymOpeningTime').value = gym.gymOpeningTime || '';
            document.getElementById('gymClosingTime').value = gym.gymClosingTime || '';
            // Store the gym id in a global variable for later use
            currentGymId = id;
            $('#editGymModal').modal('show');
        }
    };

    // Save changes to Firestore when the form is submitted
    document.getElementById('editGymForm').addEventListener('submit', async (e) => {
        e.preventDefault();  // Prevent the default form submission

        if (!currentGymId) {
            console.error("Gym ID is not available.");
            return; // Stop if gymId is not set
        }

        const updatedGymData = {
            gymPhoto: document.getElementById('gymPhoto').value,
            gymCertifications: document.getElementById('gymCertifications').value,
            gymName: document.getElementById('gymName').value,
            gymLocation: document.getElementById('gymLocation').value,
            gymContact: document.getElementById('gymContact').value,
            gymPrograms: document.getElementById('gymPrograms').value.split(',').map(item => item.trim()), // Convert comma-separated string to array
            gymEquipment: document.getElementById('gymEquipment').value.split(',').map(item => item.trim()), // Convert comma-separated string to array
            gymServices: document.getElementById('gymServices').value.split(',').map(item => item.trim()), // Convert comma-separated string to array
            gymPriceRate: document.getElementById('gymPriceRate').value,
            gymOpeningTime: document.getElementById('gymOpeningTime').value,
            gymClosingTime: document.getElementById('gymClosingTime').value
        };

        try {
            // Use the global variable `currentGymId` to update the gym document
            const gymRef = doc(db, 'GymOwner', currentGymId);
            await updateDoc(gymRef, updatedGymData);

            // Show a success message
            showToast("Gym details updated successfully!");

            // Close the modal after saving
            $('#editGymModal').modal('hide');
            
            // Optionally, refresh the gym table or reload the page to show the updated data
            refreshGymDetailsTable();

        } catch (error) {
            console.error("Error updating gym data:", error);
            showToast("Error updating gym data. Please try again.");
        }
    });
        


        let editMode = false;
        let editId = null;
        let productIdCounter = 1; // Counter for Product ID
    
        document.addEventListener('DOMContentLoaded', () => {
            const manageForm = document.getElementById('manageForm');
            const searchButton = document.getElementById('searchTitleBtn');
    
            if (manageForm) {
                manageForm.onsubmit = async function (e) {
                    e.preventDefault();
    
                    const title = document.getElementById('itemTitle').value.trim();
                    const description = document.getElementById('itemDescription').value.trim();
                    const gymName = document.getElementById('gymName').value.trim();
    
                    if (!title || !description || !gymName) {
                        showToast("Please fill in all fields.");
                        return;
                    }
    
                    if (editMode) {
                        const docRef = doc(db, 'Promotions', editId);
                        await updateDoc(docRef, {
                            title,
                            description,
                            gymName
                        });
                        showToast('Promotion updated successfully!');
                        editMode = false;
                        editId = null;
                    } else {
                        const promotion = {
                            PromotionId: productIdCounter++, // Incrementing Product ID
                            title,
                            description,
                            gymName 
                        };
                        await addDoc(collection(db, 'Promotions'), promotion);
                        showToast('Promotion added successfully!');
                    }
    
                    $('#manageModal').modal('hide');
                    renderTable();
                };
            }
    
            if (searchButton) {
                searchButton.onclick = async function() {
                    const title = document.getElementById('searchTitle').value.trim();
                    if (title) {
                        await filterPromotionsByTitle(title);
                    } else {
                        renderTable();
                    }
                };
            }
    
            renderTable();
        });

// Function to add a promotion (triggered when "Add New Promotion" is clicked)
window.addPromotion = async function() {
    const modalTitle = document.getElementById('modalTitle');
    const manageForm = document.getElementById('manageForm');
    const gymNameField = document.getElementById('GymName');
    
    // Fetch the current authenticated user's gym name
    const userData = await getgymData(); // Fetch data from Firestore (GymOwner)
    
    // Debugging to check if data is being fetched
    if (userData) {
        const gymName = userData.gymName || ''; // Extract gymName from the fetched data
        console.log("Fetched gym name:", gymName); // Debugging output
        
        if (modalTitle && manageForm && gymNameField) {
            modalTitle.textContent = "Add New Promotion"; // Set the modal title
            manageForm.reset(); // Reset the form fields

            // If gymName is fetched, auto-fill the gymName input field
            if (gymName) {
                gymNameField.value = gymName;
                console.log("Gym Name set in input:", gymName); // Debugging output
            } else {
                console.log("No gym name available.");
            }

            gymNameField.disabled = true; // Make the gym name field non-editable (optional)

            // Reset editing state
            editMode = false;
            editId = null;

            // Show the modal
            $('#manageModal').modal('show');
        } else {
            console.log("Form elements not found.");
        }
    } else {
        console.log("No user data found or user is not logged in.");
    }
};

// Function to fetch the authenticated user's data (e.g., gymName)
async function getgymData() {
    const user = auth.currentUser;

    if (user) {
        const userDocRef = doc(db, 'GymOwner', user.uid); // Get the Firestore document for the current user
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            console.log("User Data:", userDoc.data()); // Debugging output
            return userDoc.data(); // Return the user data (including gymName)
        } else {
            console.log("No user data found.");
            return null; // If no data is found
        }
    } else {
        console.log("No user is logged in.");
        return null; // If the user is not logged in
    }
}




        
function showToast(type, message) {
    const toastContainer = document.getElementById('toast-container');

    if (!toastContainer) {
        console.error("Toast container not found.");
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`; // Use different styles for success, error, etc.
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Automatically remove the toast after a delay
    setTimeout(() => {
        toast.remove();
    }, 3000); // 3 seconds
}

// Wait for the authentication state to change before proceeding
// Wait for the authentication state to change before proceeding
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("User is logged in:", user);

        // Fetch user data (gymName)
        const userData = await getUserData();
        if (userData && userData.gymName) {
            // Log the gymName fetched from the user data
            console.log("Logged in user's gymName:", userData.gymName);
            
            // Call renderTable after user data is fetched
            renderTable(userData.gymName); // Pass gymName to renderTable
        } else {
            console.log("No gymName found in user data.");
        }
    } else {
        console.log("No user is logged in.");
    }
});

// Function to fetch user data from Firestore (GymOwner collection)
async function getUserData() {
    const user = auth.currentUser;

    if (user) {
        // Fetch the user data (e.g., gymName) from the GymOwner collection
        const userDocRef = doc(db, 'GymOwner', user.uid); // Refers to the current user's document
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            console.log("User Data:", userDoc.data()); // Debugging: log user data
            return userDoc.data(); // Return the user data (gymName and other info)
        } else {
            console.log("No user data found.");
            return null; // If the user document does not exist
        }
    } else {
        console.log("No user is logged in.");
        return null; // If no user is logged in
    }
}

// Function to render the promotions table
async function renderTable(gymName) {
    const tableBody = document.getElementById('promotionsTable');
    if (!tableBody) {
        console.log("Table body not found in the DOM.");
        return;
    }

    tableBody.innerHTML = ''; // Clear the table

    console.log("Rendering promotions for gym:", gymName); // Debugging: check gymName

    if (!gymName) {
        console.log("gymName is undefined or null.");
        return;
    }

    // Query the Promotions collection with the gymName condition
    try {
        const snapshot = await getDocs(collection(db, 'Promotions'), where("gymName", "==", gymName));
        
        if (snapshot.empty) {
            console.log("No promotions found for this gym.");
            return;
        }

        snapshot.forEach((doc) => {
            const promotion = doc.data();
            console.log("Promotion:", promotion); // Debugging: check the promotion data

            // Ensure the gymName in the promotion matches the logged-in gymName
            if (promotion.gymName === gymName) {
                const row = `<tr>
                    <td>${promotion.PromotionId}</td>
                    <td>${promotion.title}</td>
                    <td>${promotion.description}</td>
                    <td>${promotion.gymName}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editPromotion('${doc.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePromotion('${doc.id}')">Delete</button>
                    </td>
                </tr>`;
                tableBody.innerHTML += row;
            } else {
                console.log("Promotion gymName mismatch:", promotion.gymName);
            }
        });
    } catch (error) {
        console.log("Error fetching promotions:", error);
    }
}





window.editPromotion = async function (docId) {
    const docRef = doc(db, 'Promotions', docId);
    const docSnap = await getDoc(docRef);
    const gymNameField = document.getElementById('gymName');
    const gymOwnerUsername = document.querySelector('#profile-username').textContent;

    if (docSnap.exists()) {
        const promotion = docSnap.data();
        const modalTitle = document.getElementById('modalTitle');
        const itemTitle = document.getElementById('itemTitle');
        const itemDescription = document.getElementById('itemDescription');

        if (modalTitle && itemTitle && itemDescription && gymNameField) {
            modalTitle.textContent = "Edit Promotion";
            itemTitle.value = promotion.title || '';
            itemDescription.value = promotion.description || '';
            
            // Set gymNameField value or fallback to the gym owner's username
            gymNameField.value = promotion.gymName || gymOwnerUsername || '';
            gymNameField.disabled = true; // Make the field read-only

            // Track editing state
            editMode = true;
            editId = docId;

            // Display the modal
            $('#manageModal').modal('show');
        } else {
            console.error("Modal fields are not properly initialized in the DOM.");
        }
    } else {
        console.error("Promotion document not found in Firestore.");
        alert("Promotion not found. It may have been deleted.");
    }
};

window.deletePromotion = async function(docId) {
    let toastContainer = document.getElementById('toastContainer');
    
    // Create toast container if not present
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = 1055;
        document.body.appendChild(toastContainer);
    }

    const toastId = 'confirmToast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-bg-warning border-0 shadow-lg';
    toast.id = toastId;
    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.width = '400px';
    toast.style.borderRadius = '12px';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    toast.innerHTML = `
        <div class="d-flex flex-column justify-content-center align-items-center p-4">
            <div class="toast-body text-center fs-5">
                <i class="fas fa-exclamation-circle fa-2x mb-3"></i><br>
                Are you sure you want to delete this promotion?
            </div>
            <div class="mt-4">
                <button class="btn btn-danger btn-lg me-3 px-4" onclick="confirmDelete('${docId}', '${toastId}')">Delete</button>
                <button class="btn btn-secondary btn-lg px-4" onclick="cancelDelete('${toastId}')">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);

    // Show toast manually (Bootstrap 4 doesn't have native JavaScript toast())
    toast.classList.add('show');
}

window.confirmDelete = async function(docId, toastId) {
    const docRef = doc(db, 'Promotions', docId);
    await deleteDoc(docRef);
    showToast("Promotion deleted successfully!", 'success');
    renderTable();

    // Hide and remove toast
    const toast = document.getElementById(toastId);
    toast.classList.remove('show');
    toast.remove();
}

window.cancelDelete = function(toastId) {
    showToast("Promotion deletion canceled.", 'danger');

    // Hide and remove toast
    const toast = document.getElementById(toastId);
    toast.classList.remove('show');
    toast.remove();
}


async function filterPromotionsByTitle(title, loggedInUserId) {
    const tableBody = document.getElementById('promotionsTable');
    if (tableBody) {
        tableBody.innerHTML = '';

        try {
            // Step 1: Fetch gymName from the GymOwner collection using loggedInUserId
            const gymOwnerDocRef = doc(db, 'GymOwner', loggedInUserId);
            const gymOwnerSnap = await getDoc(gymOwnerDocRef);

            if (!gymOwnerSnap.exists()) {
                tableBody.innerHTML = '<tr><td colspan="5">Unauthorized access. No promotions to display.</td></tr>';
                console.warn('No matching GymOwner document found.');
                return;
            }

            const loggedInGymName = gymOwnerSnap.data().gymName;

            // Validate the retrieved gymName
            if (!loggedInGymName) {
                tableBody.innerHTML = '<tr><td colspan="5">Unauthorized access. No promotions to display.</td></tr>';
                console.warn('Logged-in gym owner does not have a valid gymName in the GymOwner collection.');
                return;
            }

            // Step 2: Query Firestore for promotions strictly matching the logged-in gym's name
            const q = query(
                collection(db, 'Promotions'),
                where('gymName', '==', loggedInGymName)
            );

            const snapshot = await getDocs(q);

            // Display a message if no promotions are found for the gym
            if (snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="5">No promotions found</td></tr>';
                return;
            }

            // Loop through the query results and only include matching gym promotions
            snapshot.forEach((doc) => {
                const promotion = doc.data();

                // Additional title filtering (optional based on `title` parameter)
                if (title && !promotion.title.includes(title)) {
                    return; // Skip promotions not matching the title
                }

                // Create a table row for the matching promotion
                const row = `<tr>
                    <td>${promotion.PromotionId}</td>
                    <td>${promotion.title}</td>
                    <td>${promotion.description}</td>
                    <td>${promotion.gymName}</td> 
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editPromotion('${doc.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deletePromotion('${doc.id}')">Delete</button>
                    </td>
                </tr>`;
                tableBody.innerHTML += row;
            });
        } catch (error) {
            console.error('Error fetching promotions:', error);
            tableBody.innerHTML = '<tr><td colspan="5">Error loading promotions</td></tr>';
        }
    }
}





async function fetchGymOwnerUsername() {
    const user = auth.currentUser;

    if (user) {
        try {
            // Reference to GymOwner document
            const gymOwnerDocRef = doc(db, 'GymOwner', user.uid);  
            const gymOwnerDocSnap = await getDoc(gymOwnerDocRef);

            if (gymOwnerDocSnap.exists()) {
                const username = gymOwnerDocSnap.data().username || 'Gym Owner';
                document.querySelector('#profile-username').textContent = username;
                document.querySelector('#profile-username-mobile').textContent = username;
            } else {
                document.querySelector('#profile-username').textContent = 'Gym Owner';
                console.error("Gym owner document not found.");
            }
        } catch (error) {
            console.error("Error fetching gym owner data:", error);
        }
    } else {
        document.querySelector('#profile-username').textContent = 'Not Logged In';
        console.error("No authenticated user.");
    }
}

// Wait for Firebase Authentication state change
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchGymOwnerUsername();
    }
});
window. toggleDropdown =function() {
    const dropdownMenu = document.getElementById('dropdown-menu');
    if (dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    } else {
        dropdownMenu.style.display = 'block';
    }
}

// Close the dropdown if clicked outside
window.addEventListener('click', function (e) {
    const dropdownMenu = document.getElementById('dropdown-menu');
    const profileUsername = document.getElementById('profile-username');

    if (!profileUsername.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.style.display = 'none';
    }
});
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');

    // Toggle Sidebar Visibility on Mobile
    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Close Sidebar When Clicking Outside on Mobile
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target) && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Function to fetch the gym owner data from Firestore
    async function fetchGymOwnerData(userId) {
        try {
            // Reference to the 'GymOwner' collection, filtered by userId
            const gymOwnerRef = doc(db, 'GymOwner', userId); // Document reference for the specific gym owner
            const gymOwnerDoc = await getDoc(gymOwnerRef); // Get the document snapshot
            
            if (gymOwnerDoc.exists()) {
                const gymOwnerData = gymOwnerDoc.data(); // Get data from the document
                console.log('Gym Owner Data:', gymOwnerData);
                return gymOwnerData; // Return the gym owner data
            } else {
                console.error('No such gym owner document!');
                return null; // Return null if no document is found
            }
        } catch (error) {
            console.error("Error fetching gym owner data:", error);
            return null; // Return null on error
        }
    }

// Example: Fetch the gym owner's data and proceed with the code
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const userId = user.uid;
            const gymOwnerData = await fetchGymOwnerData(userId); // Fetch gym owner data from Firestore

            // Check if gymOwnerData is valid before proceeding
            if (gymOwnerData) {
                const gymOwnerPrograms = gymOwnerData.gymPrograms || []; // Default to empty array if not present
                const gymOwnerEquipment = gymOwnerData.gymEquipment || []; // Default to empty array if not present
                const gymOwnerServices = gymOwnerData.gymServices || []; // Default to empty array if not present
                const gymOwnerName = gymOwnerData.gymName || "";

                const checklistModal = document.getElementById('checklistModal');
                const checklistContainer = document.getElementById('checklistContainer');
                const saveSelectionButton = document.getElementById('saveSelectionButton');
                const closeModalButton = document.getElementById('closeModalButton');
                
                // Buttons to open modal
                const selectProgramsButton = document.getElementById('selectProgramsButton');
                const selectEquipmentButton = document.getElementById('selectEquipmentButton');
                const selectServicesButton = document.getElementById('selectServicesButton');
                
                // Hidden inputs and display paragraphs
                const gymProgramsInput = document.getElementById('gymPrograms');
                const selectedProgramsDisplay = document.getElementById('selectedProgramsDisplay');
                
                const gymEquipmentInput = document.getElementById('gymEquipment');
                const selectedEquipmentDisplay = document.getElementById('selectedEquipmentDisplay');
                
                const gymServicesInput = document.getElementById('gymServices');
                const selectedServicesDisplay = document.getElementById('selectedServicesDisplay');
                
                // Price display
                const gymPriceRate = document.getElementById('gymPriceRate');
                
                // Buttons for adding custom items
                const addProgramButton = document.getElementById('addProgramButton');
                const addEquipmentButton = document.getElementById('addEquipmentButton');
                const addServiceButton = document.getElementById('addServiceButton');
                
                // Input fields for custom items
                const customProgramInput = document.getElementById('customProgramInput');
                const customEquipmentInput = document.getElementById('customEquipmentInput');
                const customServiceInput = document.getElementById('customServiceInput');
                
                // Data arrays
                const programs = [
                    "Yoga Classes", "Strength Training", "Cardio Workouts", "HIIT (High-Intensity Interval Training)",
                    "Pilates", "Dance Fitness", "Zumba", "Martial Arts", "CrossFit", "Aqua Aerobics", "Spin Classes", "Boot Camp"
                ];
                
                const equipment = [
                    "Treadmill", "Dumbbells", "Elliptical", "Rowing Machine", "Stationary Bike", "Barbell and Weight Plates",
                    "Kettlebells", "Resistance Bands", "Pull-Up Bars", "Cable Machines", "Leg Press Machines", "Smith Machine",
                    "Squat Rack", "Medicine Balls"
                ];
                
                const services = [
                    "Personal Training", "Massage Therapy", "Fitness Assessments", "Sauna", "Steam Room", "Locker Room Facilities", "Outdoor Classes"
                ];
                
                let currentSelectionType = ""; // Tracks what list we're selecting
                let priceData = {}; // Store prices for each item

                // Function to populate the checklist with price input
                function populateChecklist(items, selectedItems) {
                    checklistContainer.innerHTML = ""; // Clear current checklist items
                
                    items.forEach((item) => {
                        const isChecked = selectedItems.includes(item);
                        const currentPrice = priceData[item] || "100"; // Default price to 100 if not set
                        
                        // Check if the current selection is 'services' to determine whether to show the price selector
                        const isServiceItem = currentSelectionType === "services"; // Show price selector only for services
                        
                        checklistContainer.innerHTML += `
                            <div class="checklist-item">
                                <input type="checkbox" value="${item}" ${isChecked ? "checked" : ""} />
                                <label>${item}</label>
                                ${isServiceItem ? ` <!-- Show price selector for services -->
                                    <span>
                                        <select class="price-selector" data-item="${item}">
                                            <option value="100" ${currentPrice == "100" ? "selected" : ""}>100</option>
                                            <option value="150" ${currentPrice == "150" ? "selected" : ""}>150</option>
                                            <option value="200" ${currentPrice == "200" ? "selected" : ""}>200</option>
                                            <option value="custom" ${currentPrice && !["100", "150", "200"].includes(currentPrice) ? "selected" : ""}>Custom</option>
                                        </select>
                                        <input type="number" class="custom-price" data-item="${item}" value="${currentPrice && !["100", "150", "200"].includes(currentPrice) ? currentPrice : ""}" placeholder="Enter custom price" style="${currentPrice && !["100", "150", "200"].includes(currentPrice) ? "display:inline-block" : "display:none"}" />
                                    </span>
                                ` : ''} <!-- No price selector for programs and equipment -->
                            </div>
                        `;
                    });
                
                    // Add event listeners for price selection (only for services)
                    checklistContainer.querySelectorAll(".price-selector").forEach((selector) => {
                        selector.addEventListener("change", (e) => {
                            const item = e.target.getAttribute("data-item");
                            const value = e.target.value;
                
                            if (value === "custom") {
                                const customInput = checklistContainer.querySelector(`.custom-price[data-item="${item}"]`);
                                customInput.style.display = "inline-block";
                            } else {
                                const customInput = checklistContainer.querySelector(`.custom-price[data-item="${item}"]`);
                                customInput.style.display = "none";
                                priceData[item] = value; // Update price in priceData
                                updatePriceRate(); // Update price rate whenever the price changes
                            }
                        });
                    });
                
                    // Add event listeners for custom price input (only for services)
                    checklistContainer.querySelectorAll(".custom-price").forEach((input) => {
                        input.addEventListener("input", (e) => {
                            const item = e.target.getAttribute("data-item");
                            priceData[item] = e.target.value; // Update custom price in priceData
                            updatePriceRate(); // Update price rate whenever custom price changes
                        });
                    });
                }
                        
                // Function to update the total price in the gymPriceRate input
                function updatePriceRate() {
                    let totalPrice = 0;

                    // Calculate total price for selected programs, equipment, and services
                    const selectedPrograms = gymProgramsInput.value.split(",").filter((val) => val);
                    const selectedEquipment = gymEquipmentInput.value.split(",").filter((val) => val);
                    const selectedServices = gymServicesInput.value.split(",").filter((val) => val);

                    // For programs and equipment, no price is added (set to 0 for total calculation)
                    selectedPrograms.forEach((program) => {
                        // We skip adding the price for programs
                    });

                    selectedEquipment.forEach((equipmentItem) => {
                        // We skip adding the price for equipment
                    });

                    // Add up the prices for selected services
                    selectedServices.forEach((service) => {
                        totalPrice += parseFloat(priceData[service] || "100"); // Default to 100 if no price set
                    });

                    // Update the gymPriceRate field with the total price, formatted with commas
                    gymPriceRate.value = totalPrice.toFixed(2).toLocaleString(); // Display the price as a fixed decimal with commas
                }
                
                // Show the modal with the appropriate checklist
                function showModal(selectionType) {
                    currentSelectionType = selectionType;

                    let items = [];
                    let selectedItems = [];
                    // Hide all custom add inputs first
                    document.getElementById('customProgramInput').style.display = "none";
                    document.getElementById('addProgramButton').style.display = "none";
                    document.getElementById('customEquipmentInput').style.display = "none";
                    document.getElementById('addEquipmentButton').style.display = "none";
                    document.getElementById('customServiceInput').style.display = "none";
                    document.getElementById('addServiceButton').style.display = "none";

                    // Logic for selecting the relevant items
                    if (selectionType === "programs") {
                        items = programs;
                        selectedItems = gymProgramsInput.value.split(",").filter((val) => val);
                        selectedItems = selectedItems.concat(gymOwnerPrograms); // Pre-select gym owner's programs
                        document.getElementById('customProgramInput').style.display = "inline-block";
                        document.getElementById('addProgramButton').style.display = "inline-block";
                    } else if (selectionType === "equipment") {
                        items 
                        = equipment;
                        selectedItems = gymEquipmentInput.value.split(",").filter((val) => val);
                        selectedItems = selectedItems.concat(gymOwnerEquipment); // Pre-select gym owner's equipment
                        document.getElementById('customEquipmentInput').style.display = "inline-block";
                        document.getElementById('addEquipmentButton').style.display = "inline-block";
                    } else if (selectionType === "services") {
                        items = services;
                        selectedItems = gymServicesInput.value.split(",").filter((val) => val);
                        selectedItems = selectedItems.concat(gymOwnerServices); // Pre-select gym owner's services
                        document.getElementById('customServiceInput').style.display = "inline-block";
                        document.getElementById('addServiceButton').style.display = "inline-block";
                    }

                    populateChecklist(items, selectedItems); // Populate checklist with selected items
                    checklistModal.style.display = "flex"; // Show the modal
                }

                // Listen for changes to checkboxes and update the table dynamically
                function addCheckboxListeners() {
                    // Get all checkbox elements
                    const programCheckboxes = document.querySelectorAll('input[name="programs"]');
                    const equipmentCheckboxes = document.querySelectorAll('input[name="equipment"]');
                    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');

                    // Listen for changes in the checkbox for programs
                    programCheckboxes.forEach(checkbox => {
                        checkbox.addEventListener("change", async () => {
                            if (checkbox.checked) {
                                // Add the program to the gym programs list
                                gymOwnerData.gymPrograms.push(checkbox.value);
                            } else {
                                // Remove the program from the gym programs list
                                gymOwnerData.gymPrograms = gymOwnerData.gymPrograms.filter(item => item !== checkbox.value);
                            }
                            // Update Firestore with the new data
                            await saveGymOwnerDataToFirestore();
                            // Update the table immediately
                            refreshGymDetailsTable();
                        });
                    });

                    // Listen for changes in the checkbox for equipment
                    equipmentCheckboxes.forEach(checkbox => {
                        checkbox.addEventListener("change", async () => {
                            if (checkbox.checked) {
                                // Add the equipment to the gym equipment list
                                gymOwnerData.gymEquipment.push(checkbox.value);
                            } else {
                                // Remove the equipment from the gym equipment list
                                gymOwnerData.gymEquipment = gymOwnerData.gymEquipment.filter(item => item !== checkbox.value);
                            }
                            // Update Firestore with the new data
                            await saveGymOwnerDataToFirestore();
                            // Update the table immediately
                            refreshGymDetailsTable();
                        });
                    });

                    // Listen for changes in the checkbox for services
                    serviceCheckboxes.forEach(checkbox => {
                        checkbox.addEventListener("change", async () => {
                            if (checkbox.checked) {
                                // Add the service to the gym services list
                                gymOwnerData.gymServices.push(checkbox.value);
                            } else {
                                // Remove the service from the gym services list
                                gymOwnerData.gymServices = gymOwnerData.gymServices.filter(item => item !== checkbox.value);
                            }
                            // Update Firestore with the new data
                            await saveGymOwnerDataToFirestore();
                            // Update the table immediately
                            refreshGymDetailsTable();
                        });
                    });
                }

                async function refreshGymDetailsTable() {
                    // Check if currentGymName is valid
                    const currentGymName = gymOwnerData.gymName;  // Make sure gymOwnerData is defined and contains gymName
                    if (!currentGymName) {
                        console.error("Gym name is missing");
                        return;  // Stop if the gymName is missing
                    }
                
                    // Query Firestore for gyms with the matching gymName
                    const gymsCollection = collection(db, 'GymOwner');
                    const gymOwnerQuery = query(gymsCollection, where('gymName', '==', currentGymName));
                
                    try {
                        const gymSnapshot = await getDocs(gymOwnerQuery); // Fetch docs matching the query
                
                        if (gymSnapshot.empty) {
                            console.error("No gyms found for the given gym name:", currentGymName);
                            alert("No gyms found for the specified gym name.");
                            return; // Stop further execution if no gyms are found
                        }
                
                        const gymList = gymSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                
                        const gymDetailsTable = document.getElementById('gymDetailsTable');
                        gymDetailsTable.innerHTML = ''; // Clear existing table data
                
                        // Iterate through gymList and create rows for each gym
                        gymList.forEach(gym => {
                            // Ensure gymName exists and filter gyms accordingly
                            if (gym.status && gym .status !== 'Decline' && gym.gymName) {
                                const gymRow = document.createElement('tr');
                                gymRow.innerHTML = `
                                    <td><img src="${gym.gymPhoto || 'default.jpg'}" alt="Gym Photo" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymPhoto}')"></td>
                                    <td><img src="${gym.gymCertifications || 'default-cert.jpg'}" alt="Certification" style="width: 50px; height: 50px;" onclick="showImage('${gym.gymCertifications}')"></td>
                                    <td>${gym.gymName || 'N/A'}</td>
                                    <td>${gym.gymLocation || 'Not Available'}</td>
                                    <td>${gym.gymContact || 'Not Available'}</td>
                                    <td>${gym.gymPrograms || 'N/A'}</td>
                                    <td>${gym.gymEquipment || 'N/A'}</td>
                                    <td>${gym.gymServices || 'N/A'}</td>
                                    <td>${gym.gymPriceRate || 'N/A'}</td>
                                    <td>${gym.gymOpeningTime || 'N/A'}</td>
                                    <td>${gym.gymClosingTime || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-warning" onclick="editGymDetails('${gym.id}')">Edit</button>
                                    </td>
                                `;
                                gymDetailsTable.appendChild(gymRow);
                            }
                        });
                
                    } catch (error) {
                        console.error("Error fetching gyms:", error);
                    }
                }

                async function getCurrentGymName() {
                    const user = auth.currentUser ; // Get the current authenticated user
                    if (user) {
                        const userId = user.uid;
                        const userDocRef = doc(db, 'GymOwner', userId); // Reference to the GymOwner document
                
                        try {
                            const userDoc = await getDoc(userDocRef); // Fetch the user document
                            if (userDoc.exists()) {
                                const userData = userDoc.data(); // Get user data
                                console.log("User  Data:", userData); // Debug log to check if gymName exists
                                const gymName = userData.gymName || '';  // Return the gymName of the logged-in user
                                if (gymName) {
                                    console.log("Gym Name:", gymName); // Debug log to check gymName value
                                    return gymName;  // Return the gym name
                                } else {
                                    console.error("Gym name is missing in Firestore for user ID:", userId);
                                    return '';  // Return empty string if gymName is missing
                                }
                            } else {
                                console.error("User  document does not exist for user ID:", userId);
                                return '';  // Return empty string if user document doesn't exist
                            }
                        } catch (error) {
                            console.error("Error fetching user data:", error);
                            return '';  // Return empty string if there's an error fetching user data
                        }
                    } else {
                        console.error("No user is logged in.");
                        return '';  // Return empty string if no user is logged in
                    }
                }

                async function loadGymData() {
                    const currentGymName = await getCurrentGymName();
                    
                    // Check if we have a valid gym name
                    if (currentGymName) {
                        // Proceed with refreshing the gym details table
                        refreshGymDetailsTable(currentGymName, 'Some Filter Name');  // Pass the valid gym name
                    } else {
                        console.error("Failed to load gym data. Invalid gym name.");
                        alert("Failed to load gym data. Please make sure you are logged in and have a valid gym name.");
                    }
                }

                // Call the function to load gym data
                loadGymData();

                // Listen for when the save button is clicked
                saveSelectionButton.addEventListener("click", async () => {
                    // Ensure the checklist container and button exist
                    if (!checklistContainer || !saveSelectionButton) {
                        console.error("Checklist container or save button not found.");
                        return;
                    }

                    // Get the selected items from the checkboxes
                    const selectedItems = Array.from(checklistContainer.querySelectorAll("input:checked")).map(
                        (checkbox) => checkbox.value
                    );
                    console.log("Selected items:", selectedItems);

                    // Ensure there's at least one item selected
                    if (selectedItems.length === 0) {
                        alert("Please select at least one item.");
                        return;
                    }

                    // Ensure the current gym being edited belongs to the logged-in gym owner
                    const user = auth.currentUser ;
                    if (!user) {
                        alert("You must be logged in to make changes.");
                        return;
                    }
                    const userId = user.uid; // Get the current authenticated user's ID
                    console.log("User  ID:", userId);

                    // Ensure gymOwnerData and gymOwnerName are available and match
                    if (!gymOwnerData || gymOwnerData.gymName !== gymOwnerName) {
                        alert("You can only edit the gym programs, equipment, and services of your own gym.");
                        return;
                    }
                    console.log("Gym Owner Data:", gymOwnerData);

                    let updatedData = {}; // Data that will be saved to Firestore

                    // Merge selected items with existing data based on the selection type
                    try {
                        if (currentSelectionType === "programs") {
                            const mergedPrograms = new Set([...gymOwnerData.gymPrograms, ...selectedItems]);
                            updatedData.gymPrograms = Array.from(mergedPrograms);
                        } else if (currentSelectionType === "equipment") {
                            const mergedEquipment = new Set([...gymOwnerData.gymEquipment, ...selectedItems]);
                            updatedData.gymEquipment = Array.from(mergedEquipment);
                        } else if (currentSelectionType === "services") {
                            const mergedServices = new Set([...gymOwnerData.gymServices, ...selectedItems]);
                            updatedData.gymServices = Array.from(mergedServices);
                        }
                        console.log("Updated Data:", updatedData);

                        // Update Firestore with the new data
                        const gymOwnerRef = doc(db, 'GymOwner', userId); // Reference to the current gym owner's document
                        await updateDoc(gymOwnerRef, updatedData); // Update the document with the merged data
                        console.log("Firestore updated");

                        // Optionally, call another function to update the price rate or other logic
                        updatePriceRate(); // Make sure this function is defined elsewhere

                        // Display success toast
                        showToast("Selections saved successfully!");

                        // Update the table dynamically with the new data
                        refreshGymDetailsTable();

                        // Close the modal after saving
                        if (checklistModal) {
                            checklistModal.style.display = "none";
                        } else {
                            console.error("Checklist modal not found!");
                        }

                    } catch (error) {
                        console.error("Error saving selection:", error);
                        showToast("There was an error saving your selection. Please try again.");
                    }
                });

                // Add functionality to populate checklist container with dynamic checkboxes
                const gympopulateChecklist = (selectionType) => {
                    // Clear any existing checkboxes in the checklist container
                    checklistContainer.innerHTML = '';

                    let items = [];

                    // Determine which list to populate based on the selectionType
                    if (selectionType === "programs") {
                        items = gymOwnerData.gymPrograms || [];
                    } else if (selectionType === "equipment") {
                        items = gymOwnerData.gymEquipment || [];
                    } else if (selectionType === "services") {
                        items = gymOwnerData.gymServices || [];
                    }

                    // Create checkboxes for each item in the array
                    items.forEach((item) => {
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.value = item;
                        checkbox.id = item;

                        const label = document.createElement("label");
                        label.setAttribute("for", item);
                        label.textContent = item;

                        checklistContainer.appendChild(checkbox);
                        checklistContainer.appendChild(label);
                        checklistContainer.appendChild(document.createElement("br"));
                    });
                };

                // Example button click to trigger checklist population for programs
                document.getElementById("selectProgramsButton").addEventListener("click", () => {
                    currentSelectionType = "programs"; // Set the selection type to "programs"
                    gympopulateChecklist("programs"); // Populate checklist for programs
                });

                // Example button click to trigger checklist population for equipment
                document.getElementById("selectEquipmentButton").addEventListener("click", () => {
                    currentSelectionType = "equipment"; // Set the selection type to "equipment"
                    gympopulateChecklist("equipment"); // Populate checklist for equipment
                });

                // Example button click to trigger checklist population for services
                document.getElementById("selectServicesButton").addEventListener("click", () => {
                    currentSelectionType = "services"; // Set the selection type to "services"
                    gympopulateChecklist("services"); // Populate checklist for services
                });

                // Example logic to handle adding custom items (e.g., custom program, equipment, or service)
                document.getElementById("addProgramButton").addEventListener("click", () => {
                    const customProgram = document.getElementById("customProgramInput").value.trim();
                    if (customProgram) {
                        // Update gymOwnerData with new custom program
                        gymOwnerData .gymPrograms.push(customProgram);
                        // Repopulate checklist for programs
                        gympopulateChecklist("programs");

                        // Save new data to Firestore
                        saveGymOwnerDataToFirestore();
                    }
                });

                document.getElementById("addEquipmentButton").addEventListener("click", () => {
                    const customEquipment = document.getElementById("customEquipmentInput").value.trim();
                    if (customEquipment) {
                        // Update gymOwnerData with new custom equipment
                        gymOwnerData.gymEquipment.push(customEquipment);
                        // Repopulate checklist for equipment
                        gympopulateChecklist("equipment");

                        // Save new data to Firestore
                        saveGymOwnerDataToFirestore();
                    }
                });

                document.getElementById("addServiceButton").addEventListener("click", () => {
                    const customService = document.getElementById("customServiceInput").value.trim();
                    if (customService) {
                        // Update gymOwnerData with new custom service
                        gymOwnerData.gymServices.push(customService);
                        // Repopulate checklist for services
                        gympopulateChecklist("services");

                        // Save new data to Firestore
                        saveGymOwnerDataToFirestore();
                    }
                });

                // Function to save updated gymOwnerData to Firestore
                async function saveGymOwnerDataToFirestore() {
                    const user = auth.currentUser ;
                    const userId = user.uid; // Get the current authenticated user's ID

                    const gymOwnerRef = doc(db, 'GymOwner', userId);
                    await updateDoc(gymOwnerRef, {
                        gymPrograms: gymOwnerData.gymPrograms,
                        gymEquipment: gymOwnerData.gymEquipment,
                        gymServices: gymOwnerData.gymServices
                    });
                    console.log("Gym Owner Data updated in Firestore");
                }

                // Initialize listeners when the page loads
                addCheckboxListeners();

                // Close modal button
                closeModalButton.addEventListener("click", () => {
                    checklistModal.style.display = "none";
                });

                // Event listeners to show modals
                selectProgramsButton.addEventListener("click", () => showModal("programs"));
                selectEquipmentButton.addEventListener("click", () => showModal("equipment"));
                selectServicesButton.addEventListener("click", () => showModal("services"));
            } else {
                console.error('Gym owner data is null.');
            }
        } catch (error) {
            console.error('Error fetching gym owner data:', error);
        }
    }
});
$(document).ready(function () {
    // Button click to open checklist modal and close edit modal
    $("#selectProgramsButton, #selectEquipmentButton, #selectServicesButton").click(function () {
        // Close the edit gym modal
        $('#editGymModal').modal('hide');

        // Show the checklist modal
        $('#checklistModal').show();
    });

    // Button to close checklist modal
    $("#closeModalButton").click(function () {
        // Hide the checklist modal
        $('#checklistModal').hide();
    });
});

});
