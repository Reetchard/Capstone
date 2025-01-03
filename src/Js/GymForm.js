// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js"; // Import Auth

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
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // Initialize Auth

window.addEventListener('load', async () => {
    const form = document.getElementById("gymOwnerDetailsForm");
    const spinnerModal = document.getElementById("spinnerModal");

    // Element declarations
    const gymName = document.getElementById("gymName");
    const gymPhotoInput = document.getElementById("gymPhoto");
    const gymCertificationsInput = document.getElementById("gymCertifications");
    const gymEmailInput = document.getElementById("gymemail");
    const gymEquipment = document.getElementById("gymEquipment");
    const gymContact = document.getElementById("gymContact");
    const gymPrograms = document.getElementById("gymPrograms");
    const gymOpeningTime = document.getElementById("gymOpeningTime");
    const gymClosingTime = document.getElementById("gymClosingTime");
    const gymLocation = document.getElementById("gymLocation");
    const gymPriceRate = document.getElementById("gymPriceRate");
    const gymServicesInput = document.getElementById("gymServices"); // <-- Added this line
    const errorMessage = document.getElementById("gymOwnerFormErrorMessage");
    const successMessage = document.getElementById("gymOwnerFormSuccessMessage");
    const photoPreview = document.getElementById("photoPreview");

    // Display selected photo in the preview container
    gymPhotoInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Gym Photo Preview" style="width: 100%; height: auto; border-radius: 8px;">`;
            };
            reader.readAsDataURL(file);
        } else {
            photoPreview.innerHTML = ""; // Clear preview if no file is selected
        }
    });

    // Function to handle image upload
    async function uploadFile(file, path) {
        const storageReference = storageRef(storage, path);
        const snapshot = await uploadBytes(storageReference, file);
        return await getDownloadURL(snapshot.ref);
    }

    async function isUserEmailValid(gymEmail) {
        const gymowner = auth.currentUser; // Get the current authenticated user
        if (gymowner) {
            const userEmail = gymowner.email.trim().toLowerCase(); // Normalize authenticated user's email
            const enteredEmail = gymEmail.trim().toLowerCase(); // Normalize entered email
            return userEmail === enteredEmail; // Compare normalized emails
        } else {
            return false; // Not authenticated
        }
    }

    function showSpinner() {
        const spinner = document.getElementById('globalSpinner');
        if (spinner) {
            spinner.style.display = 'flex'; // Show spinner
        }
    }
    
    // Function to hide the global spinner
    function hideSpinner() {
        const spinner = document.getElementById('globalSpinner');
        if (spinner) {
            spinner.style.display = 'none'; // Hide spinner
        }
    }

    // Initialize Firebase Authentication listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is authenticated, fetch their details from the 'GymOwner' collection
            const userDocRef = doc(firestore, "GymOwner", user.uid);  // Get the user's document by UID
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                // Populate form with data from Firestore (username and email)
                gymName.value = userData.username || '';  // Set gym name from Firestore document
                gymEmailInput.value = user.email || '';  // Set gym email from Firebase Auth
            } else {
                console.log("No gym owner data found for this user.");
            }
        } else {
            // If no user is authenticated, redirect to login page
            console.log("No authenticated user found.");
            window.location.href = "login.html"; // Redirect to login page
        }
    });

    // Form submission logic
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        try {
            showSpinner();
    
            const gymEmail = gymEmailInput.value;
    
            // Validate the user's email
            const isValidEmail = await isUserEmailValid(gymEmail);
            if (!isValidEmail) {
                errorMessage.innerHTML = "Error: The email you entered does not match your registered account. Please check and try again.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }
    
            // Custom validation for the file input
            if (gymPhotoInput.files.length === 0) {
                errorMessage.innerHTML = "Please upload a gym photo.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }
    
            // Validate price rate as a decimal
            const priceRateValue = parseFloat(gymPriceRate.value);
            if (isNaN(priceRateValue) || priceRateValue < 0) {
                errorMessage.innerHTML = "Please enter a valid price rate as a positive decimal number.";
                hideSpinner(); // Hide spinner if error occurs
                return;
            }
    
            // Upload files and get URLs
            const gymPhotoURL = await uploadFile(gymPhotoInput.files[0], `gym_photos/${gymName.value}`);
            const gymCertificationsURL = gymCertificationsInput.files[0] ? await uploadFile(gymCertificationsInput.files[0], `gym_certifications/${gymName.value}`) : "";
    
            // Get authenticated user details
            const user = auth.currentUser;
            const userId = user.uid; // User's unique ID
    
            // Create or update the user's document with gym information
            const userDocRef = doc(firestore, 'GymOwner', userId);
            await setDoc(userDocRef, {
                gymName: gymName.value,
                gymPhoto: gymPhotoURL,
                gymCertifications: gymCertificationsURL,
                gymEquipment: gymEquipment.value.split(","),
                gymContact: gymContact.value,
                gymPrograms: gymPrograms.value.split(","),
                gymServices: gymServicesInput.value.split(","),
                gymOpeningTime: gymOpeningTime.value,
                gymClosingTime: gymClosingTime.value,
                gymLocation: gymLocation.value,
                gymPriceRate: priceRateValue, // Save price rate as a decimal
                status: "Under review"
            }, { merge: true });
    
            // Success message logic
            successMessage.innerHTML = "Gym information submitted successfully! Please wait for admin's approval.";
            errorMessage.innerHTML = "";
    
            // After a brief delay, redirect to login.html
            setTimeout(() => {
                hideSpinner();
                window.location.href = "login.html";
            }, 2000);
    
            form.reset();  // Clear the form after successful submission
            photoPreview.innerHTML = ""; // Clear photo preview after submission
    
            // Show the success toast
            showToast("Gym information submitted successfully!");
    
        } catch (error) {
            errorMessage.innerHTML = "Error: Could not submit the form. " + error.message;
            successMessage.innerHTML = "";
            hideSpinner(); // Hide spinner if error occurs
            setTimeout(() => { errorMessage.innerHTML = ""; }, 3000);
        }
    });
    
    // Function to show toast message
    function showToast(message) {
        const toast = document.getElementById("toast");
        toast.innerHTML = message;
        toast.classList.add("show");
    
        // Hide the toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
    
});
document.addEventListener('DOMContentLoaded', () => {
    // Ensuring the DOM is fully loaded before accessing elements
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
            document.getElementById('customProgramInput').style.display = "inline-block";
            document.getElementById('addProgramButton').style.display = "inline-block";
        } else if (selectionType === "equipment") {
            items = equipment;
            selectedItems = gymEquipmentInput.value.split(",").filter((val) => val);
            document.getElementById('customEquipmentInput').style.display = "inline-block";
            document.getElementById('addEquipmentButton').style.display = "inline-block";
        } else if (selectionType === "services") {
            items = services;
            selectedItems = gymServicesInput.value.split(",").filter((val) => val);
            document.getElementById('customServiceInput').style.display = "inline-block";
            document.getElementById('addServiceButton').style.display = "inline-block";
        }

        // Attach event listeners for adding custom items
        if (selectionType === "programs") {
            document.getElementById('addProgramButton').addEventListener('click', () => {
                const newItem = document.getElementById('customProgramInput').value.trim();
                if (newItem && !items.includes(newItem)) {
                    programs.push(newItem); // Add the custom program to the programs list
                    gymProgramsInput.value = [...selectedItems, newItem].join(",");
                    populateChecklist(programs, [...selectedItems, newItem]); // Re-populate the checklist
                }
            });
        } else if (selectionType === "equipment") {
            document.getElementById('addEquipmentButton').addEventListener('click', () => {
                const newItem = document.getElementById('customEquipmentInput').value.trim();
                if (newItem && !items.includes(newItem)) {
                    equipment.push(newItem); // Add the custom equipment to the equipment list
                    gymEquipmentInput.value = [...selectedItems, newItem].join(",");
                    populateChecklist(equipment, [...selectedItems, newItem]); // Re-populate the checklist
                }
            });
        } else if (selectionType === "services") {
            document.getElementById('addServiceButton').addEventListener('click', () => {
                const newItem = document.getElementById('customServiceInput').value.trim();
                if (newItem && !items.includes(newItem)) {
                    services.push(newItem); // Add the custom service to the services list
                    gymServicesInput.value = [...selectedItems, newItem].join(",");
                    populateChecklist(services, [...selectedItems, newItem]); // Re-populate the checklist
                }
            });
        }

        populateChecklist(items, selectedItems); // Populate checklist with selected items
        checklistModal.style.display = "flex"; // Show the modal
    }


    // Save the selected items
    saveSelectionButton.addEventListener("click", () => {
        const selectedItems = Array.from(checklistContainer.querySelectorAll("input:checked")).map(
            (checkbox) => checkbox.value
        );

        if (currentSelectionType === "programs") {
            gymProgramsInput.value = selectedItems.join(",");
            updateDisplay(selectedProgramsDisplay, selectedItems);
        } else if (currentSelectionType === "equipment") {
            gymEquipmentInput.value = selectedItems.join(",");
            updateDisplay(selectedEquipmentDisplay, selectedItems);
        } else if (currentSelectionType === "services") {
            gymServicesInput.value = selectedItems.join(",");
            updateDisplay(selectedServicesDisplay, selectedItems);
        }

        checklistModal.style.display = "none";

        updatePriceRate(); // Update price rate after saving selection
    });

    // Close the modal
    closeModalButton.addEventListener("click", () => {
        checklistModal.style.display = "none";
    });

    function updateDisplay(displayElement, items) {
        displayElement.innerHTML = "";
        items.forEach((item) => {
            // Check if the item is a gym service to display the price
            const isServiceItem = services.includes(item);
    
            // Retrieve the price or default to 100 if not set, only for services
            const price = isServiceItem ? parseFloat(priceData[item] || "100") : null;
        
            // Format price with two decimals and commas if it's a service item
            const formattedPrice = price ? price.toFixed(2).toLocaleString() : '';
    
            const itemElement = document.createElement("div");
            itemElement.classList.add("selected-item");
    
            // Only show price for services, programs, and equipment won't show the price
            itemElement.innerHTML = `${item}${isServiceItem ? ` - Price: ${formattedPrice}` : ''} 
                <button class="remove-item" data-item="${item}">Remove</button>`;
            
            displayElement.appendChild(itemElement);
        });
    
        // Add remove functionality
        displayElement.querySelectorAll(".remove-item").forEach((button) => {
            button.addEventListener("click", (e) => {
                const item = e.target.getAttribute("data-item");
                removeItem(item);
                updatePriceRate(); // Update price after removing item
            });
        });
    }
    



    // Remove selected item from the input values
    function removeItem(item) {
        const input = (currentSelectionType === "programs") ? gymProgramsInput :
                      (currentSelectionType === "equipment") ? gymEquipmentInput : gymServicesInput;
        const items = input.value.split(",").filter((val) => val !== item);
        input.value = items.join(",");

        // Update the displayed list
        const display = (currentSelectionType === "programs") ? selectedProgramsDisplay :
                        (currentSelectionType === "equipment") ? selectedEquipmentDisplay : selectedServicesDisplay;
        updateDisplay(display, items);
    }

    // Open modal when selecting programs, equipment, or services
    selectProgramsButton.addEventListener("click", () => showModal("programs"));
    selectEquipmentButton.addEventListener("click", () => showModal("equipment"));
    selectServicesButton.addEventListener("click", () => showModal("services"));
});






