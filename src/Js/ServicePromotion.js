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
                            <button class="btn custom-btn-warning" onclick="editGymDetails('${userId}')"><i class="fas fa-edit"></i></button>
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
                    <button class="btn custom-btn-warning" onclick="editGymDetails('${gym.id}')"><i class="fas fa-edit"></i></button>
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

  // 📌 Open Modal for Editing Gym Details
window.editGymDetails = async function (id) {
    try {
        const docRef = doc(db, 'GymOwner', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const gymData = docSnap.data();

            // Display selected programs, equipment, and services
            document.getElementById('selectedProgramsDisplay').innerText = gymData.gymPrograms?.join('') || 'No Programs Selected';
            document.getElementById('selectedEquipmentDisplay').innerText = gymData.gymEquipment?.join('') || 'No Equipment Selected';
            document.getElementById('selectedServicesDisplay').innerText = gymData.gymServices?.join('') || 'No Services Selected';

            // Populate hidden input fields
            document.getElementById('gymPrograms').value = gymData.gymPrograms?.join(' ') || '';
            document.getElementById('gymEquipment').value = gymData.gymEquipment?.join(' ') || '';
            document.getElementById('gymServices').value = gymData.gymServices?.join(' ') || '';

            // Populate the Price Rate textbox
            document.getElementById('gymPriceRate').value = gymData.gymPriceRate ? parseFloat(gymData.gymPriceRate).toFixed(2) : '0.00';

            // Show modal
            $('#editGymModal').modal('show');
        } else {
            console.error("Gym document not found.");
            showToast('Gym details not found.', 'danger');
        }
    } catch (error) {
        console.error("Error fetching gym details:", error);
        showToast('Failed to load gym details.', 'danger');
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
            gymPrograms: document.getElementById('gymPrograms').value.split('').map(item => item.trim()), // Convert comma-separated string to array
            gymEquipment: document.getElementById('gymEquipment').value.split('').map(item => item.trim()), // Convert comma-separated string to array
            gymServices: document.getElementById('gymServices').value.split('').map(item => item.trim()), // Convert comma-separated string to array
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
                        <button class="btn custom-btn-warning btn-sm" onclick="editPromotion('${doc.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn custom-btn-danger btn-sm" onclick="deletePromotion('${doc.id}')"><i class="fas fa-trash"></i></button>
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
                    

// 📌 Update Total Price Calculation and Save to Firestore
async function updatePriceRate() {
    let totalPrice = 0;

    // Fetch existing price rate from Firestore if no checkbox is selected
    const previousPrice = await getPreviousGymPriceRate();

    // Loop through all checked checkboxes
    const checkedCheckboxes = checklistContainer.querySelectorAll('input[type="checkbox"]:checked');
    if (checkedCheckboxes.length === 0) {
        console.warn("No checkboxes selected. Retaining previous gymPriceRate:", previousPrice);
        totalPrice = previousPrice || 0; // Fallback to previous value if available
    } else {
        checkedCheckboxes.forEach((checkbox) => {
            const item = checkbox.value;

            if (currentSelectionType === "services") {
                const priceSelector = checklistContainer.querySelector(`.price-selector[data-item="${item}"]`);
                const customPriceInput = checklistContainer.querySelector(`.custom-price[data-item="${item}"]`);

                let price = 100; // Default price

                if (priceSelector) {
                    if (priceSelector.value === "custom" && customPriceInput && customPriceInput.value) {
                        price = parseFloat(customPriceInput.value) || 0; // Use custom price
                    } else {
                        price = parseFloat(priceSelector.value) || 0; // Use dropdown price
                    }
                }

                totalPrice += price;
            }
        });
    }

    // Update the UI
    gymPriceRate.value = `₱${totalPrice.toFixed(2).toLocaleString()}`;
    console.log(`Total Price Updated: ₱${totalPrice}`);

    // Update Firestore
    await updateGymPriceRateInFirestore(totalPrice);
}

// 📌 Fetch the Previous gymPriceRate from Firestore
async function getPreviousGymPriceRate() {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not authenticated.");
        return 0;
    }

    const gymOwnerRef = doc(db, 'GymOwner', user.uid);

    try {
        const docSnap = await getDoc(gymOwnerRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Fetched Previous Price Rate:", data.gymPriceRate);
            return parseFloat(data.gymPriceRate) || 0; // Return the previous gymPriceRate
        } else {
            console.warn("GymOwner document not found in Firestore.");
            return 0;
        }
    } catch (error) {
        console.error("Error fetching previous gymPriceRate from Firestore:", error);
        return 0;
    }
}
// 📌 Update gymPriceRate in Firestore
async function updateGymPriceRateInFirestore(totalPrice) {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    const gymOwnerRef = doc(db, 'GymOwner', user.uid);

    try {
        await updateDoc(gymOwnerRef, {
            gymPriceRate: totalPrice.toFixed(2) // Save as a formatted decimal
        });
        console.log(`gymPriceRate updated in Firestore: ₱${totalPrice}`);
    } catch (error) {
        console.error("Error updating gymPriceRate in Firestore:", error);
    }
}

// 📌 Initialize gymPriceRate on Page Load
async function initializeGymPriceRate() {
    const priceRate = await getPreviousGymPriceRate();
    gymPriceRate.value = `₱${parseFloat(priceRate).toFixed(2).toLocaleString()}`;
    console.log("Initialized gymPriceRate: ₱" + priceRate);
}

// Call this function on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    await initializeGymPriceRate();
});



let currentSelectionType = ""; // Tracks what list we're selecting
let priceData = {}; // Store prices for each item

// 📝 Populate Checklist with Dynamic Event Listeners
function populateChecklist(items, selectedItems) {
    checklistContainer.innerHTML = ""; // Clear current checklist items

    items.forEach((item) => {
        const isChecked = selectedItems.includes(item);
        const currentPrice = priceData[item] || "100"; // Default price is 100

        const isServiceItem = currentSelectionType === "services";

        // Add each item with dynamic checkbox state
        checklistContainer.innerHTML += `
            <div class="checklist-item">
                <input type="checkbox" value="${item}" ${isChecked ? "checked" : ""} />
                <label>${item}</label>
                ${isServiceItem ? `
                    <span>
                        <select class="price-selector" data-item="${item}">
                            <option value="100" ${currentPrice == "100" ? "selected" : ""}>100</option>
                            <option value="150" ${currentPrice == "150" ? "selected" : ""}>150</option>
                            <option value="200" ${currentPrice == "200" ? "selected" : ""}>200</option>
                            <option value="custom" ${currentPrice && !["100", "150", "200"].includes(currentPrice) ? "selected" : ""}>Custom</option>
                        </select>
                        <input type="number" class="custom-price" data-item="${item}" value="${currentPrice}" placeholder="Custom Price" style="${currentPrice && !["100", "150", "200"].includes(currentPrice) ? "display:inline-block" : "display:none"}" />
                    </span>
                ` : ''}
            </div>
        `;
    });

    // Attach dynamic event listeners after populating
    addDynamicEventListeners();
    updatePriceRate();
}

// 📝 Attach Dynamic Event Listeners
function addDynamicEventListeners() {
    // Checkbox change listener
    checklistContainer.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            const item = checkbox.value;
            if (checkbox.checked) {
                if (currentSelectionType === "services" && !priceData[item]) {
                    priceData[item] = "100"; // Default price when checked
                }
            } else {
                delete priceData[item]; // Remove price data when unchecked
            }
            updatePriceRate();
        });
    });

    // Dropdown price selector change listener
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
                priceData[item] = value;
            }

            updatePriceRate();
        });
    });

    // Custom price input change listener
    checklistContainer.querySelectorAll(".custom-price").forEach((input) => {
        input.addEventListener("input", (e) => {
            const item = e.target.getAttribute("data-item");
            priceData[item] = e.target.value || "0";
            updatePriceRate();
        });
    });
}

// 📝 Show Modal Based on Selection Type
function showModal(selectionType) {
    currentSelectionType = selectionType;

    let items = [];
    let selectedItems = [];

    document.getElementById('customProgramInput').style.display = "none";
    document.getElementById('addProgramButton').style.display = "none";
    document.getElementById('customEquipmentInput').style.display = "none";
    document.getElementById('addEquipmentButton').style.display = "none";
    document.getElementById('customServiceInput').style.display = "none";
    document.getElementById('addServiceButton').style.display = "none";

    if (selectionType === "programs") {
        items = programs;
        selectedItems = gymOwnerData.gymPrograms;
        document.getElementById('customProgramInput').style.display = "inline-block";
        document.getElementById('addProgramButton').style.display = "inline-block";
    } else if (selectionType === "equipment") {
        items = equipment;
        selectedItems = gymOwnerData.gymEquipment;
        document.getElementById('customEquipmentInput').style.display = "inline-block";
        document.getElementById('addEquipmentButton').style.display = "inline-block";
    } else if (selectionType === "services") {
        items = services;
        selectedItems = gymOwnerData.gymServices;
        document.getElementById('customServiceInput').style.display = "inline-block";
        document.getElementById('addServiceButton').style.display = "inline-block";
    }

    populateChecklist(items, selectedItems);
    checklistModal.style.display = "flex";
}



                            // Listen for changes to checkboxes and update the table dynamically
                        // 📝 Listen for Checkbox Changes
                        function addCheckboxListeners() {
                            checklistContainer.addEventListener("change", async (event) => {
                                const checkbox = event.target;
                                if (checkbox.type === "checkbox") {
                                    const itemValue = checkbox.value;

                                    if (currentSelectionType === "programs") {
                                        if (checkbox.checked) {
                                            if (!gymOwnerData.gymPrograms.includes(itemValue)) {
                                                gymOwnerData.gymPrograms.push(itemValue);
                                            }
                                        } else {
                                            gymOwnerData.gymPrograms = gymOwnerData.gymPrograms.filter(item => item !== itemValue);
                                        }
                                    } 
                                    
                                    else if (currentSelectionType === "equipment") {
                                        if (checkbox.checked) {
                                            if (!gymOwnerData.gymEquipment.includes(itemValue)) {
                                                gymOwnerData.gymEquipment.push(itemValue);
                                            }
                                        } else {
                                            gymOwnerData.gymEquipment = gymOwnerData.gymEquipment.filter(item => item !== itemValue);
                                        }
                                    } 
                                    
                                    else if (currentSelectionType === "services") {
                                        if (checkbox.checked) {
                                            if (!gymOwnerData.gymServices.includes(itemValue)) {
                                                gymOwnerData.gymServices.push(itemValue);
                                            }
                                        } else {
                                            gymOwnerData.gymServices = gymOwnerData.gymServices.filter(item => item !== itemValue);
                                        }
                                    }

                                    // Update Firestore after change
                                    await updateGymOwnerCollection();

                                    // Refresh the table dynamically
                                    refreshGymDetailsTable();
                                }
                            });
                        }

                        // 📝 Update Firestore When Checkbox State Changes
                        async function updateGymOwnerCollection() {
                            const user = auth.currentUser;
                            if (!user) {
                                console.error("User is not authenticated.");
                                return;
                            }

                            const gymOwnerRef = doc(db, 'GymOwner', user.uid);

                            try {
                                await updateDoc(gymOwnerRef, {
                                    gymPrograms: gymOwnerData.gymPrograms,
                                    gymEquipment: gymOwnerData.gymEquipment,
                                    gymServices: gymOwnerData.gymServices
                                });
                                console.log("Firestore updated after checkbox change");
                                showToast("Data updated successfully!");
                            } catch (error) {
                                console.error("Error updating Firestore after checkbox change:", error);
                                showToast("Failed to update data. Please try again.");
                            }
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
                                if (gym.status && gym.status !== 'Decline' && gym.gymName) {
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
                                        <td>${gym.gymPriceRate ? `₱${parseFloat(gym.gymPriceRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}</td>
                                        <td>${gym.gymOpeningTime || 'N/A'}</td>
                                        <td>${gym.gymClosingTime || 'N/A'}</td>
                                        <td>
                                            <button class="btn custom-btn-warning" onclick="editGymDetails('${gym.id}')"><i class="fas fa-edit"></i></button>
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
                        const user = auth.currentUser; // Get the current authenticated user
                        if (user) {
                            const userId = user.uid;
                            const userDocRef = doc(db, 'GymOwner', userId); // Reference to the GymOwner document
                    
                            try {
                                const userDoc = await getDoc(userDocRef); // Fetch the user document
                                if (userDoc.exists()) {
                                    const userData = userDoc.data(); // Get user data
                                    console.log("User Data:", userData); // Debug log to check if gymName exists
                                    const gymName = userData.gymName || '';  // Return the gymName of the logged-in user
                                    if (gymName) {
                                        console.log("Gym Name:", gymName); // Debug log to check gymName value
                                        return gymName;  // Return the gym name
                                    } else {
                                        console.error("Gym name is missing in Firestore for user ID:", userId);
                                        return '';  // Return empty string if gymName is missing
                                    }
                                } else {
                                    console.error("User document does not exist for user ID:", userId);
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
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to make changes.");
        return;
    }
    const userId = user.uid; // Get the current authenticated user's ID
    console.log("User ID:", userId);

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
        gymOwnerData.gymPrograms.push(customProgram);
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

// 📝 Save Updated Data to Firestore
async function saveGymOwnerDataToFirestore() {
    const user = auth.currentUser;
    if (!user) {
        console.error("User is not authenticated.");
        return;
    }

    const gymOwnerRef = doc(db, 'GymOwner', user.uid);

    try {
        await updateDoc(gymOwnerRef, {
            gymPrograms: gymOwnerData.gymPrograms,
            gymEquipment: gymOwnerData.gymEquipment,
            gymServices: gymOwnerData.gymServices,
            gymPriceRate: parseFloat(gymPriceRate.value.replace(/,/g, "")) || 0
        });
        console.log("Firestore updated successfully!");
        showToast("Data updated successfully!");
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        showToast("Failed to save data. Please try again.");
    }
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

// 📝 Add Custom Program
document.getElementById("addProgramButton").addEventListener("click", async () => {
    const customProgram = document.getElementById("customProgramInput").value.trim();
    if (customProgram) {
        if (!gymOwnerData.gymPrograms.includes(customProgram)) {
            gymOwnerData.gymPrograms.push(customProgram); // Add to local state
            console.log("Custom Program Added:", customProgram);
        }
        await saveGymOwnerDataToFirestore(); // Save to Firestore
        populateChecklist(programs.concat(customProgram), gymOwnerData.gymPrograms); // Update UI
        document.getElementById("customProgramInput").value = ""; // Clear input
    }
});

// 📝 Add Custom Equipment
document.getElementById("addEquipmentButton").addEventListener("click", async () => {
    const customEquipment = document.getElementById("customEquipmentInput").value.trim();
    if (customEquipment) {
        if (!gymOwnerData.gymEquipment.includes(customEquipment)) {
            gymOwnerData.gymEquipment.push(customEquipment);
            console.log("Custom Equipment Added:", customEquipment);
        }
        await saveGymOwnerDataToFirestore();
        populateChecklist(equipment.concat(customEquipment), gymOwnerData.gymEquipment);
        document.getElementById("customEquipmentInput").value = "";
    }
});

// 📝 Add Custom Service
document.getElementById("addServiceButton").addEventListener("click", async () => {
    const customService = document.getElementById("customServiceInput").value.trim();
    if (customService) {
        if (!gymOwnerData.gymServices.includes(customService)) {
            gymOwnerData.gymServices.push(customService);
            priceData[customService] = "100"; // Default price for new service
            console.log("Custom Service Added:", customService);
        }
        await saveGymOwnerDataToFirestore();
        populateChecklist(services.concat(customService), gymOwnerData.gymServices);
        document.getElementById("customServiceInput").value = "";
    }
});

// 📌 Add or Update Promotion
document.getElementById('manageForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('itemTitle').value.trim();
    const description = document.getElementById('itemDescription').value.trim();
    const gymName = document.getElementById('GymName').value.trim();

    if (!title || !description || !gymName) {
        console.error("Please fill in all fields.");
        showToast('Please fill in all required fields.', 'danger');
        return;
    }

    try {
        let promotionData = {
            title,
            description,
            gymName,
        };

        let promotionId;

        if (editMode && editId) {
            // Update existing promotion
            await updateDoc(doc(db, 'Promotions', editId), promotionData);
            showToast('Promotion updated successfully!', 'success');
            promotionId = editId;

            // Update row in the table
            updatePromotionRow(promotionId, promotionData);
        } else {
            // Get next available PromotionId
            const nextId = await getNextPromotionId();
            promotionData.PromotionId = nextId; // Ensure PromotionId is saved in Firestore

            // Add new promotion
            const docRef = await addDoc(collection(db, 'Promotions'), promotionData);
            promotionId = docRef.id;
            showToast('Promotion added successfully!', 'success');

            // Add row to the table dynamically
            addPromotionRow(promotionId, promotionData);
        }

        $('#manageModal').modal('hide');
        document.getElementById('manageForm').reset();
    } catch (error) {
        console.error("Error saving promotion:", error);
        showToast('Failed to save promotion. Please try again.', 'danger');
    }
});
function addPromotionRow(id, promotionData) {
    const promotionsTable = document.getElementById('promotionsTable');
    const row = document.createElement('tr');
    row.id = `promotion-${id}`;

    row.innerHTML = `
        <td>${promotionData.PromotionId || 'N/A'}</td>
        <td>${promotionData.title || 'N/A'}</td>
        <td>${promotionData.description || 'N/A'}</td>
        <td>${promotionData.gymName || 'N/A'}</td>
        <td>
            <button class="btn btn-warning btn-sm" onclick="editPromotion('${id}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deletePromotion('${id}')">Delete</button>
        </td>
    `;

    promotionsTable.appendChild(row);
}


// 📌 Update a Row in Promotions Table
function updatePromotionRow(id, promotionData) {
    const row = document.getElementById(`promotion-${id}`);
    if (row) {
        row.innerHTML = `
            <td>${promotionData.PromotionId || 'N/A'}</td>
            <td>${promotionData.title}</td>
            <td>${promotionData.description}</td>
            <td>${promotionData.gymName}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editPromotion('${id}')">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePromotion('${id}')">Delete</button>
            </td>
        `;
    }
}

// 📌 Auto-Increment PromotionId
async function getNextPromotionId() {
    const promotionsCollection = collection(db, 'Promotions');
    const snapshot = await getDocs(promotionsCollection);

    let maxId = 0;
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.PromotionId && !isNaN(data.PromotionId)) {
            maxId = Math.max(maxId, data.PromotionId);
        }
    });

    return maxId + 1;
}

// 📌 Open Modal for Adding a Promotion
window.addPromotion = async function() {
    const modalTitle = document.getElementById('modalTitle');
    const manageForm = document.getElementById('manageForm');
    const gymNameField = document.getElementById('GymName');
    
    const userData = await getgymData(); // Fetch gym data from Firestore
    
    if (userData) {
        const gymName = userData.gymName || '';
        console.log("Fetched gym name:", gymName);
        
        if (modalTitle && manageForm && gymNameField) {
            modalTitle.textContent = "Add New Promotion";
            manageForm.reset();

            if (gymName) {
                gymNameField.value = gymName;
                console.log("Gym Name set in input:", gymName);
            } else {
                console.log("No gym name available.");
            }

            gymNameField.disabled = true;
            editMode = false;
            editId = null;

            $('#manageModal').modal('show');
        } else {
            console.log("Form elements not found.");
        }
    } else {
        console.log("No user data found or user is not logged in.");
    }
};

// 📌 Open Modal for Editing a Promotion
window.editPromotion = async function (docId) {
    const docRef = doc(db, 'Promotions', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const promotion = docSnap.data();

        document.getElementById('modalTitle').textContent = 'Edit Promotion';
        document.getElementById('itemTitle').value = promotion.title || '';
        document.getElementById('itemDescription').value = promotion.description || '';
        document.getElementById('GymName').value = promotion.gymName || '';
        document.getElementById('GymName').disabled = true;

        editMode = true;
        editId = docId;

        $('#manageModal').modal('show');
    } else {
        console.error('Promotion not found.');
        showToast('Promotion not found.');
    }
};

// 📌 Delete Promotion
window.deletePromotion = async function(docId) {
    try {
        await deleteDoc(doc(db, 'Promotions', docId));
        showToast('Promotion deleted successfully!');
        
        const row = document.getElementById(`promotion-${docId}`);
        if (row) row.remove();
    } catch (error) {
        console.error('Error deleting promotion:', error);
        showToast('Failed to delete promotion.');
    }
};

// 📌 Render Initial Promotions Table
async function renderPromotionsTable() {
    const promotionsTable = document.getElementById('promotionsTable');
    promotionsTable.innerHTML = ''; // Clear the table

    try {
        const snapshot = await getDocs(collection(db, 'Promotions'));
        snapshot.forEach((doc) => {
            const promotion = doc.data();
            const promotionId = promotion.PromotionId || 'N/A'; // Fallback if PromotionId is missing
            const rowId = `promotion-${doc.id}`;

            const row = document.createElement('tr');
            row.id = rowId;

            row.innerHTML = `
                <td>${promotionId}</td>
                <td>${promotion.title || 'N/A'}</td>
                <td>${promotion.description || 'N/A'}</td>
                <td>${promotion.gymName || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editPromotion('${doc.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePromotion('${doc.id}')">Delete</button>
                </td>
            `;

            promotionsTable.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching promotions:", error);
        showToast('Failed to load promotions.', 'danger');
    }
}


// Initialize Table on Page Load
document.addEventListener('DOMContentLoaded', renderPromotionsTable);


