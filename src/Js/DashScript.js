import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,orderBy,onSnapshot} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
import { getStorage, ref, getDownloadURL,uploadBytes  } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';
// Your Firebase configuration
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
const storage = getStorage();

   // Toggle dropdown on profile picture click
   document.getElementById('profile-picture').addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    event.stopPropagation();
    
    // If the dropdown is currently hidden, show it
    if (!dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('hide'); // Remove hide class if present
        dropdownMenu.classList.add('show'); // Show the dropdown
        
        // Also add a class for animating the profile picture
        this.classList.add('active'); // Optional for additional effect
    } else {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        this.classList.remove('active'); // Optional for additional effect
    }
});

// Close dropdown when clicking outside
window.addEventListener('click', function(event) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!event.target.closest('.dropdown')) {
        dropdownMenu.classList.add('hide'); // Add hide class for smooth closing
        setTimeout(() => {
            dropdownMenu.classList.remove('show', 'hide'); // Remove show and hide after transition
        }, 300); // Match the duration with the CSS transition time
        
        // Optionally remove active class from profile picture
        document.getElementById('profile-picture').classList.remove('active'); // Optional for additional effect
    }
});
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userId = user.uid;
            const userDocRef = doc(db, 'Users', userId); // Fetch user doc from Firestore

            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data(); // Get user data
                    const username = userData.username || 'User'; // Username with fallback

                    // Display profile picture and username
                    displayProfilePicture(user, username); // Pass the user object and username

                } else {
                    console.error("User document does not exist.");
                    window.location.href = 'login.html'; // Redirect to login if no user document found
                }
            } catch (error) {
                console.error("Error fetching user data:", error); // Error handling
            }
        } else {
            window.location.href = 'login.html'; // Redirect if user is not authenticated
        }
    });
});



// Function to display user profile picture
function displayProfilePicture(user, username) {
    const userId = user.uid;
    const profilePicRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
  
    getDownloadURL(profilePicRef).then((url) => {
        // Update profile picture in both header and sidebar
        document.getElementById('profile-picture').src = url;        
        // Also update the username in the header
        document.getElementById('profile-username').textContent = username;
    }).catch((error) => {
        if (error.code === 'storage/object-not-found') {
            // Fallback to default image if no profile picture is found
            document.getElementById('profile-picture').src = 'framework/img/Profile.png';

            // Still set the username
            document.getElementById('profile-username').textContent = username;
        } else {
            console.error('Unexpected error loading profile picture:', error.message);
        }
    });
}


window.uploadProfilePicture =async function (file) {
        const user = getAuth().currentUser;
        if (!user) {
            console.error('No authenticated user found.');
            return;
        }
        
        const profilePicRef = ref(storage, `profilePictures/${user.uid}/profile.jpg`);
        try {
            await uploadBytes(profilePicRef, file);
            console.log('Profile picture uploaded successfully.');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        }
}
                // Function to close the modal
window.closeMembershipPlansModal = function() {
            const modal = document.getElementById('membershipPlansModal');
            if (modal) {
                modal.style.display = 'none';
            } else {
                console.error('Membership Plans modal element not found.');
            }
};
        
// Fetch Gym Profiles and Display
    async function fetchGymProfiles() {
        const gymsCollection = collection(db, 'Users');
        
        // Query to get only gym owners
        const gymOwnerQuery = query(gymsCollection, where('role', '==', 'gymowner'));
        
        const gymSnapshot = await getDocs(gymOwnerQuery);
        const gymList = gymSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() // Include the document data and its ID
        }));

        const gymProfilesContainer = document.getElementById('gym-profiles'); // Ensure correct ID
        gymProfilesContainer.innerHTML = ''; // Clear existing profiles

        gymList.forEach(gym => {
            // Check if the gym status is not "Under Review"
            if (gym.status && gym.status !== 'Under Review') {
                const gymDiv = document.createElement('div');
                gymDiv.classList.add('card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

                gymDiv.innerHTML = `
                    <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                    <div class="card-body">
                        <h5 class="card-title gym-title">${gym.gymName || 'N/A'}</h5>
                        <button class="btn-custom btn-primary view-more-btn" onclick="viewMore('${gym.id}')">Gym Info</button>
                    </div>
                `;

                gymProfilesContainer.appendChild(gymDiv); // Append each gym profile to the container
            }
        });
    }

    // Function to format time from 24-hour to 12-hour format with AM/PM
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    return `${formattedHours}:${minutes} ${ampm}`;
}

    // Function to open the Gym Info Modal
    window.viewMore = async function (gymId) {
        try {
            // Fetch the gym document from Firestore using gymId
            const gymDocRef = doc(db, 'Users', gymId);
            const gymDoc = await getDoc(gymDocRef);
    
            if (gymDoc.exists()) {
                const gymData = gymDoc.data();
                const gymProfileName = gymData.gymName;
    
                // Debugging log
                console.log('Gym Profile Name:', gymProfileName);
    
                // Get and update modal elements
                const modalGymName = document.getElementById('modalGymName');
                const modalGymPhoto = document.getElementById('modalGymPhoto');
                const modalGymLocation = document.getElementById('modalGymLocation');
                const modalGymEquipment = document.getElementById('modalGymEquipment');
                const modalGymPrograms = document.getElementById('modalGymPrograms');
                const modalGymEmail = document.getElementById('modalGymEmail');
                const modalGymContact = document.getElementById('modalGymContact');
                const modalPriceRate = document.getElementById('modalPriceRate');
                const modalGymOpeningTime = document.getElementById('modalGymOpeningTime');
                const modalGymClosingTime = document.getElementById('modalGymClosingTime');
                const trainersSection = document.getElementById('trainers-section');
                const productsSection = document.getElementById('products-section');
    
                // Populate modal content with gym details
                if (modalGymName) modalGymName.innerText = gymProfileName || 'N/A';
                if (modalGymPhoto) modalGymPhoto.src = gymData.gymPhoto || 'default-photo.jpg';
                if (modalGymLocation) modalGymLocation.innerText = gymData.gymLocation || 'N/A';
                if (modalGymEquipment) modalGymEquipment.innerText = gymData.gymEquipment || 'N/A';
                if (modalGymPrograms) modalGymPrograms.innerText = gymData.gymPrograms || 'N/A';
                if (modalGymEmail) modalGymEmail.innerText = gymData.email || 'N/A';
                if (modalGymContact) modalGymContact.innerText = gymData.gymContact || 'N/A';
                if (modalPriceRate) modalPriceRate.innerText = gymData.gymPriceRate || 'N/A';
                if (modalGymOpeningTime) modalGymOpeningTime.innerText = formatTime(gymData.gymOpeningTime || 'N/A');
                if (modalGymClosingTime) modalGymClosingTime.innerText = formatTime(gymData.gymClosingTime || 'N/A');
    
                // Clear the trainers and products sections
                trainersSection.innerHTML = '';
                productsSection.innerHTML = '';
    
                // Fetch trainers for this gym
                const trainersQuery = query(
                    collection(db, 'Users'),
                    where('role', '==', 'trainer'),
                    where('GymName', '==', gymProfileName)
                );
                const trainersSnapshot = await getDocs(trainersQuery);
    
                if (!trainersSnapshot.empty) {
                    trainersSnapshot.forEach(doc => {
                        const trainerData = doc.data();
                        if (trainerData.status !== "Under Review") {
                            const trainerCard = `
                                <div class="trainer-card">
                                    <img src="${trainerData.TrainerPhoto || 'default-trainer-photo.jpg'}" alt="Trainer Photo" class="trainer-photo">
                                    <h5>${trainerData.TrainerName || 'No Name'}</h5>
                                    <button class="btn-custom btn-success" onclick="ViewTrainerInfo('${doc.id}')">Trainer Info</button>
                                </div>
                            `;
                            trainersSection.innerHTML += trainerCard;
                        }
                    });
                } else {
                    trainersSection.innerHTML = '<p>No trainers found for this gym.</p>';
                }
    
                // Fetch and display products for this gym
                const productsQuery = query(
                    collection(db, 'Products'),
                    where('gymName', '==', gymProfileName)
                );
                const productsSnapshot = await getDocs(productsQuery);
    
                if (!productsSnapshot.empty) {
                    productsSnapshot.forEach(doc => {
                        const productData = doc.data();
                        const productCard = `
                            <div class="product-card">
                                <img src="${productData.photoURL || 'default-product.jpg'}" alt="Product Photo" class="product-photo">
                                <h5>${productData.name || 'Unnamed Product'}</h5>
                                <button class="btn-custom btn-primary" onclick="ViewProductInfo('${doc.id}')">Check info</button>
                            </div>
                        `;
                        productsSection.innerHTML += productCard;
                    });
                } else {
                    productsSection.innerHTML = '<p>No products found for this gym.</p>';
                }
    
                // Show the modal
                $('#gymProfileModal').modal('show');
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    };
    async function getCurrentUserId() {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDocRef = doc(db, 'Users', user.uid); // Fetch user doc using UID
                    try {
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const userId = userData.userId; // Retrieve the userId field from the document
                            if (userId) {
                                resolve(userId); // Resolve with userId from the document
                            } else {
                                reject('userId field not found in user document.');
                            }
                        } else {
                            reject('User document does not exist.');
                        }
                    } catch (error) {
                        reject('Error fetching user document:', error);
                    }
                } else {
                    reject('No authenticated user found.');
                }
            });
        });
    }
    window.ViewProductInfo = async function (productId) {
        try {
            $('.modal').modal('hide'); // Hide any open modals
    
            // Fetch product data by ID
            const productDocRef = doc(db, 'Products', productId);
            const productDoc = await getDoc(productDocRef);
    
            if (productDoc.exists()) {
                const productData = productDoc.data();
    
                // Ensure modal elements exist
                const modalProductName = document.getElementById('modalProductName');
                const modalProductPrice = document.getElementById('modalProductPrice');
                const modalProductDescription = document.getElementById('modalProductDescription');
                const modalProductPhoto = document.getElementById('modalProductPhoto');
                const modalProductCategory = document.getElementById('modalProductCategory');
                const modalProductQuantityAvailable = document.getElementById('modalProductQuantity');
                const modalProductQuantityInput = document.getElementById('modalProductQuantityInput');
                const increaseQuantityBtn = document.getElementById('increaseQuantity');
                const decreaseQuantityBtn = document.getElementById('decreaseQuantity');
    
                let availableStock = productData.quantity || 0;
                let selectedQuantity = 1;
                let productPrice = productData.price || 0;
    
                // Display product data
                modalProductName.innerText = productData.name || 'Unnamed Product';
                modalProductPrice.innerText = `₱${productData.price || 'N/A'}`;
                modalProductDescription.innerText = productData.description || 'No description available.';
                modalProductPhoto.src = productData.photoURL || 'default-product.jpg';
                modalProductCategory.innerText = productData.category || 'N/A';
                modalProductQuantityAvailable.innerText = `Available: ${availableStock}`;
    
                // Function to update total price based on selected quantity
                function updatePrice() {
                    const totalPrice = productPrice * selectedQuantity;
                    modalProductPrice.innerText = `₱${totalPrice.toLocaleString()}`; // Format price with commas
                }
    
                // Update the displayed stock and quantity
                function updateQuantity() {
                    modalProductQuantityInput.value = selectedQuantity;
                    modalProductQuantityAvailable.innerText = `Available: ${availableStock - selectedQuantity}`;
                    updatePrice(); // Update the total price when quantity changes
                }
    
                // Increase quantity
                increaseQuantityBtn.addEventListener('click', function () {
                    if (selectedQuantity < availableStock) {
                        selectedQuantity++;
                        updateQuantity();
                    }
                });
    
                // Decrease quantity
                decreaseQuantityBtn.addEventListener('click', function () {
                    if (selectedQuantity > 1) {
                        selectedQuantity--;
                        updateQuantity();
                    }
                });
    
                // Set initial quantity and price
                modalProductQuantityInput.value = selectedQuantity;
                updatePrice(); // Set initial price based on quantity 1
    
                // Show the Product Info modal
                $('#productModal').modal('show');
    
            } else {
                console.error('Product not found!');
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
        }
    };
     // Buy Now function with confirmation and success messages
     window.buyNow = async function () {
        try {
            // Ensure user ID is available before proceeding
            const userId = await getCurrentUserId(); // Get userId from the Users collection

            // Get product details
            const productName = document.getElementById('modalProductName').innerText;
            const quantityPurchased = document.getElementById('modalProductQuantityInput').value;
            const totalPrice = document.getElementById('modalProductPrice').innerText;

            // Assuming gymName is available in the GymProfile card
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card

            // Set product details in confirmation modal
            document.getElementById('confirmProductName').innerText = productName;
            document.getElementById('confirmQuantity').innerText = quantityPurchased;
            document.getElementById('confirmTotalPrice').innerText = totalPrice;

            // Show the confirmation modal
            $('#confirmationModal').modal('show');

            // Handle confirmation action
            document.getElementById('confirmPurchaseBtn').onclick = async function () {
                try {
                    // Simulate purchase logic (e.g., update stock, etc.)
                    notificationCount++;
                    document.getElementById('notification-count').innerText = notificationCount;

                    // Create a new notification with detailed information
                    const newNotification = {
                        message: `You purchased ${quantityPurchased} of ${productName} for ${totalPrice}.`,
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        status: 'Pending Owner Approval',
                        read: false, // Unread notification
                        userId: userId, // Use the current user's userId from the document
                        gymName: gymName, // Storing gymName from GymProfile card
                        notificationId: Date.now().toString(), // Unique ID based on timestamp
                        timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
                    };

                    // Save the notification to Firestore under a 'Notifications' collection
                    await addDoc(collection(db, 'Notifications'), newNotification);

                    // Save transaction to 'Transactions' collection
                    const newTransaction = {
                        userId: userId, // Storing userId of the customer/user
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        gymName: gymName, // Storing gymName from GymProfile card
                        timestamp: new Date().toISOString() // Timestamp of the transaction
                    };

                    // Save the transaction to Firestore under a 'Transactions' collection
                    await addDoc(collection(db, 'Transactions'), newTransaction);

                    // Close the confirmation modal
                    $('#confirmationModal').modal('hide');

                    // Show success modal
                    document.getElementById('successProductName').innerText = productName;
                    document.getElementById('successQuantity').innerText = quantityPurchased;
                    document.getElementById('successTotalPrice').innerText = totalPrice;
                    $('#successModal').modal('show');

                    // Update the notification list
                    await fetchNotifications(userId);

                    // Close the product modal after the purchase
                    $('#productModal').modal('hide');
                } catch (error) {
                    console.error('Error saving notification or transaction:', error);
                }
            };
        } catch (error) {
            console.error('Error fetching current user ID:', error);
        }
    };

    let notificationCount = 0; // Initialize notificationCount to 0
    document.getElementById('confirmPurchaseBtn').onclick = async function () {
        try {
            // Simulate purchase logic (e.g., update stock, etc.)
            notificationCount++; // Increment the notification count
    
            // Update the notification count display in the UI
            document.getElementById('notification-count').innerText = notificationCount;
    
            // Create a new notification with detailed information
            const newNotification = {
                message: `You purchased ${quantityPurchased} of ${productName} for ${totalPrice}.`,
                productName: productName,
                quantity: quantityPurchased,
                totalPrice: totalPrice,
                status: 'Pending Owner Approval',
                read: false, // Unread notification
                userId: userId, // Use the current user's userId from the document
                gymName: gymName, // Storing gymName from GymProfile card
                notificationId: Date.now().toString(), // Unique ID based on timestamp
                timestamp: new Date().toISOString() // Add timestamp for ordering or filtering if needed
            };
    
            // Save the notification to Firestore under a 'Notifications' collection
            await addDoc(collection(db, 'Notifications'), newNotification);
    
            // Save transaction to 'Transactions' collection
            const newTransaction = {
                userId: userId, // Storing userId of the customer/user
                productName: productName,
                quantity: quantityPurchased,
                totalPrice: totalPrice,
                gymName: gymName, // Storing gymName from GymProfile card
                timestamp: new Date().toISOString() // Timestamp of the transaction
            };
    
            // Save the transaction to Firestore under a 'Transactions' collection
            await addDoc(collection(db, 'Transactions'), newTransaction);
    
            // Close the confirmation modal
            $('#confirmationModal').modal('hide');
    
            // Show success modal
            document.getElementById('successProductName').innerText = productName;
            document.getElementById('successQuantity').innerText = quantityPurchased;
            document.getElementById('successTotalPrice').innerText = totalPrice;
            $('#successModal').modal('show');
    
            // Update the notification list (assuming this function exists)
            await fetchNotifications(userId);
    
            // Close the product modal after the purchase
            $('#productModal').modal('hide');
        } catch (error) {
            console.error('Error saving notification or transaction:', error);
        }
    };
    
    window.showMembershipPlans = async function (gymProfileName) {
        try {
            const membershipPlansSection = document.getElementById('membershipPlansSection');
            membershipPlansSection.innerHTML = ''; // Clear the section before appending
        
            // Define an array of colors for the membership cards
            const cardColors = [
                'linear-gradient(to right, #5B247A, #1BCEDF)',  
                'linear-gradient(to right, #184E68, #57CA85)', 
                'linear-gradient(to right, #F02FC2, #6094EA)', 
                'linear-gradient(to right, #f1c40f, #f39c12)', 
                'linear-gradient(to right, #8e44ad, #9b59b6)'
            ];
        
            // Fetch membership plans where gymName matches gymProfileName
            const membershipPlansQuery = query(
                collection(db, 'MembershipPlans'),
                where('gymName', '==', gymProfileName) // Match membership plans by gymName
            );
        
            const membershipPlansSnapshot = await getDocs(membershipPlansQuery);
        
            if (!membershipPlansSnapshot.empty) {
                let colorIndex = 0; // Initialize a color index
                membershipPlansSnapshot.forEach(doc => {
                    const planData = doc.data();
                    const backgroundColor = cardColors[colorIndex % cardColors.length];
                    colorIndex++; // Increment the color index
        
                    const planCard = `
                        <div class="plan-card card mb-3" style="background: ${backgroundColor};">
                            <div class="card-body">
                                <h4 class="card-title">${planData.membershipType || 'Unnamed Plan'}</h4>
                                <h5 class="card-title">₱${planData.price || 'N/A'}</h5>
                                <p class="card-text">${planData.description || 'No description available.'}</p>
                                <button class="btn-custom btn-primary" onclick="confirmPlanPurchase('${planData.membershipType}', '${planData.price}', '${doc.id}')">Apply</button>
                            </div>
                        </div>
                    `;
        
                    // Append the plan card to the membership plans section
                    membershipPlansSection.innerHTML += planCard;
                });
            } else {
                membershipPlansSection.innerHTML = '<p>No membership plans found for this gym.</p>';
            }
        
            // Show the membership plans modal
            $('#membershipPlansModal').modal('show');
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        }
    };
    
    document.getElementById('membershipPlansBtn').addEventListener('click', function() {
        const gymProfileName = document.getElementById('modalGymName').innerText; // Get the gym name from the modal
        showMembershipPlans(gymProfileName);
    });
    
    window.confirmPlanPurchase = function (planType, planPrice, planId) {
        // Set the selected plan details in the confirmation modal
        console.log('Setting selected plan details for confirmation modal.');
        document.getElementById('selectedPlanType').innerText = planType;
        document.getElementById('selectedPlanPrice').innerText = planPrice;
    
        // Show the confirmation modal
        console.log('Showing confirmation modal.');
        $('#confirmPurchaseModal').modal('show');
    
        // Set the action for the Confirm Purchase button
        document.getElementById('confirmPurchaseBtn').onclick = async function () {
            try {
                console.log('Confirm Purchase button clicked.');
    
                // Simulate the purchase process: get the userId and gymName, then save the transaction
                const userId = await getCurrentUserId(); // Fetch the current user's userId
                console.log('User ID fetched:', userId);
    
                const gymName = document.getElementById('modalGymName').innerText; // Assuming gym name is displayed in the modal
                console.log('Gym Name fetched:', gymName);
    
                // Call the purchasePlan function to save the transaction
                await purchasePlan(planId, planType, planPrice, userId, gymName);
                console.log('Purchase successful, transaction saved.');
    
                // Close the confirmation modal
                $('#confirmPurchaseModal').modal('hide');
    
                // Show the success modal
                console.log('Showing success modal.');
                $('#successModal').modal('show');
            } catch (error) {
                console.error('Error purchasing membership plan:', error);
    
                // Close the confirmation modal
                $('#confirmPurchaseModal').modal('hide');
    
                // Show the error modal
                $('#errorModal').modal('show');
            }
        };
    };
    
    async function purchasePlan(planId, planType, planPrice, userId, gymName) {
        console.log('Saving transaction with:', { planId, planType, planPrice, userId, gymName });
        try {
            const newTransaction = {
                userId: userId,
                planId: planId,
                planType: planType,
                planPrice: planPrice,
                gymName: gymName,
                purchaseDate: new Date().toISOString(),
            };
    
            // Save the transaction to Firestore
            await addDoc(collection(db, 'Transactions'), newTransaction);
            console.log('Transaction saved successfully.');
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw new Error('Failed to save the transaction');
        }
    }
    
    


        // Function to fetch gym owner location from Firestore based on gymName
        window.fetchGymOwnerLocation = async function (gymName) {
            try {
                console.log('Fetching gym owner data for gymName:', gymName);

                // Fetch the gym owner's data from Firestore by matching the gymName and role 'gymowner'
                const userQuery = query(collection(db, 'Users'), where('role', '==', 'gymowner'), where('gymName', '==', gymName));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    console.log('Gym owner found.');

                    const gymOwnerData = userSnapshot.docs[0].data();
                    const gymOwnerName = gymOwnerData.gymName;

                    console.log('Gym Owner Name:', gymOwnerName);

                    // Return the gym location if names match
                    const gymLocation = gymOwnerData.gymLocation;

                    console.log('Gym location validated:', gymLocation);
                    return gymLocation;

                } else {
                    console.error('No gym owner found for gymName:', gymName);
                    return null;
                }
            } catch (error) {
                console.error('Error fetching gym owner location:', error);
                return null;
            }
        }

        // Function to fetch location coordinates from Nominatim (OpenStreetMap Geocoding service)
        window.fetchGymCoordinates = async function (cityName) {
            const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;

            try {
                console.log(`Fetching coordinates for city: ${cityName}`);
                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    console.log('Fetched coordinates:', lat, lon);
                    return { lat, lon };
                } else {
                    throw new Error('Location not found');
                }
            } catch (error) {
                console.error('Error fetching gym coordinates:', error);
                alert('Could not fetch the location. Please ensure the city name is correct.');
                return null;
            }
        }

        // Initialize the map using Leaflet with OpenStreetMap tiles
        let map;
        window.initMap = function(lat, lon) {
            console.log(`Initializing map with coordinates: lat=${lat}, lon=${lon}`);

            if (map) {
                console.log('Map already initialized, setting new view');
                map.setView([lat, lon], 15);
                map.invalidateSize(); // Important to refresh the map after being shown in the modal
            } else {
                console.log('Initializing new map');
                map = L.map('map').setView([lat, lon], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors'
                }).addTo(map);

                L.marker([lat, lon]).addTo(map)
                    .bindPopup('Gym Location')
                    .openPopup();
            }
        }

        window.onload = function () {
            document.getElementById('locationIcon').addEventListener('click', async function () {
                try {
                    // Get the gym name from the modal (ensure the modal is open or has valid data)
                    const gymName = document.getElementById('modalGymName').innerText;  // Fetch the gym name displayed in the modal
                    
                    if (!gymName) {
                        console.error('Gym name is not provided.');
                        alert('Gym name is not available.');
                        return;
                    }

                    // Fetch gym owner location using gymName
                    const gymLocation = await fetchGymOwnerLocation(gymName);

                    if (gymLocation) {
                        const { lat, lon } = await fetchGymCoordinates(gymLocation); // Fetch coordinates for the gym's location (city)
                        if (lat && lon) {
                            // Show the map modal
                            $('#mapModal').modal('show');

                            // Initialize the map with the coordinates after the modal is shown
                            $('#mapModal').on('shown.bs.modal', function () {
                                initMap(lat, lon); // Initialize the map inside the modal
                            });
                            
                            console.log('Map modal shown');
                        } else {
                            console.error('Coordinates not found');
                            alert('Could not fetch gym location.');
                        }
                    } else {
                        console.error('Gym location not found');
                        alert('Could not fetch gym location.');
                    }
                } catch (error) {
                    console.error('Error displaying the map:', error);
                }
            });
        };




    // Function to view trainer info in a new modal
    window.ViewTrainerInfo = async function (trainerId) {
        try {
            // Close Gym modal
            $('#gymProfileModal').modal('hide');

            // Fetch trainer data by ID
            const trainerDocRef = doc(db, 'Users', trainerId);
            const trainerDoc = await getDoc(trainerDocRef);

            if (trainerDoc.exists()) {
                const trainerData = trainerDoc.data();

                // Check if the trainer's status is "Under Review"
                if (trainerData.status === "Under Review") {
                    console.warn('Trainer is under review. Cannot display.');
                    return; // Do not display the trainer if they are under review
                }

                // Ensure each trainer modal element exists
                const modalTrainerName = document.getElementById('modalTrainerName');
                const modalTrainerPhoto = document.getElementById('modalTrainerPhoto');
                const modalTrainerExpertise = document.getElementById('modalTrainerExpertise');
                const modalTrainerExperience = document.getElementById('modalTrainerExperience');
                const modalTrainerDays = document.getElementById('modalTrainerDays');
                const modalTrainerRate = document.getElementById('modalTrainerRate'); // Trainer rate element
                const bookNowButton = document.getElementById('bookNowButton'); // Book Now button

                // Populate trainer modal with the trainer's data
                if (modalTrainerName) modalTrainerName.innerText = trainerData.TrainerName || 'N/A';
                if (modalTrainerPhoto) modalTrainerPhoto.src = trainerData.TrainerPhoto || 'default-trainer-photo.jpg';
                if (modalTrainerExpertise) modalTrainerExpertise.innerText = trainerData.Expertise || 'N/A';
                if (modalTrainerExperience) modalTrainerExperience.innerText = trainerData.Experience || 'N/A';
                if (modalTrainerDays) modalTrainerDays.innerText = trainerData.Days || 'N/A';
                if (modalTrainerRate) modalTrainerRate.innerText = `₱${trainerData.rate || 'N/A'}`; // Display rate with currency

                // Handle Book Now button (add trainer ID for booking logic)
                if (bookNowButton) {
                    bookNowButton.onclick = function() {
                        alert(`Booking Trainer: ${trainerId}`);
                        // Add your booking logic here
                    };
                }

                // Step 4: Show the Trainer Info modal
                $('#trainerProfileModal').modal('show');
            } else {
                console.error('Trainer not found!');
            }
        } catch (error) {
            console.error('Error fetching trainer data:', error);
        }
    }
    

    // Optionally, you can have other modal functions like closeModal()
    window.closeModal=function() {
        $('#gymProfileModal').modal('hide');
    }

    // Function to close the modal
    window.closeModal = function() {
        $('#gymProfileModal').modal('hide'); // Use Bootstrap's modal hide method
    }


              // Fetch notifications from Firestore and sync with localStorage
              async function fetchNotifications(userId) {
                try {
                    console.log('Fetching notifications from Firestore for userId:', userId);
            
                    // Fetch notifications from Firestore for the specific user
                    const notificationsSnapshot = await getDocs(
                        query(collection(db, 'Notifications'), where('userId', '==', userId))
                    );
            
                    const notifications = notificationsSnapshot.docs.map(doc => {
                        const data = doc.data();
                        let timestamp = data.timestamp;
            
                        // Convert Firestore Timestamp or string to Date object
                        if (timestamp && typeof timestamp.toDate === 'function') {
                            timestamp = timestamp.toDate(); // Firestore Timestamp
                        } else if (typeof timestamp === 'string') {
                            timestamp = new Date(timestamp); // String
                        } else if (!timestamp) {
                            timestamp = new Date(); // No timestamp, set to now
                        }
            
                        return {
                            ...data,
                            id: doc.id,
                            timestamp: timestamp
                        };
                    });
            
                    // Sort notifications by timestamp in descending order (newest first)
                    notifications.sort((a, b) => b.timestamp - a.timestamp);
            
                    console.log('Fetched notifications:', notifications);
            
                    // Store notifications in localStorage for persistence across refreshes
                    localStorage.setItem('notifications', JSON.stringify(notifications));
            
                    // Categorize notifications by time
                    const categorizedNotifications = categorizeNotifications(notifications);
            
                    // Display the notifications
                    displayCategorizedNotifications(categorizedNotifications);
            
                    // Update notification count after fetching all notifications
                    const unreadCount = notifications.filter(notification => !notification.read).length;
                    updateNotificationCount(unreadCount);
            
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            }
            
            // Function to categorize notifications based on time differences
            function categorizeNotifications(notifications) {
                const categorized = {
                    'New Notifications': [],
                    'Older Notifications': []
                };
            
                const now = new Date();
            
                notifications.forEach(notification => {
                    const diffInMs = now - notification.timestamp;
                    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            
                    if (diffInDays < 1) { // Less than 1 day
                        categorized['New Notifications'].push(notification);
                    } else { // 1 day or older
                        categorized['Older Notifications'].push(notification);
                    }
                });
            
                return categorized;
            }
            
            
            // Function to display categorized notifications
            function displayCategorizedNotifications(categorizedNotifications) {
                const notificationList = document.getElementById('notificationList');
                notificationList.innerHTML = ''; // Clear the list before adding new notifications
            
                for (const [category, notifications] of Object.entries(categorizedNotifications)) {
                    if (notifications.length > 0) {
                        const categoryHeader = document.createElement('h6');
                        categoryHeader.classList.add('category-header'); // Add a class for styling
                        categoryHeader.innerText = category;
                        notificationList.appendChild(categoryHeader);
            
                        notifications.forEach(notification => {
                            const notificationItem = document.createElement('p');
                            notificationItem.classList.add('list-group-item');
            
                            // Calculate how long ago the notification was received
                            const timeAgo = getTimeAgo(notification.timestamp);
            
                            // Use <strong> for unread notifications
                            const message = notification.read ? 
                                notification.message : `<strong>${notification.message}</strong>`;
            
                            notificationItem.innerHTML = `
                                ${message}<br>
                                <small>${timeAgo}</small>
                            `;
            
                            // Add event listener for showing notification details and marking it as read
                            notificationItem.addEventListener('click', () => {
                                markAsRead(notification.id, notification.userId); // Mark notification as read
                                showNotificationDetails(notification); // Show notification details in a modal
                            });
            
                            notificationList.appendChild(notificationItem);
                        });
                    }
                }
            
                // If no notifications, show a default message
                if (notificationList.innerHTML === '') {
                    notificationList.innerHTML = 
                        '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
                }
            }
            
            

                // Load notifications from localStorage when the page reloads
                function loadNotificationsFromLocalStorage() {
                    const storedNotifications = localStorage.getItem('notifications');
                    if (storedNotifications) {
                        const notifications = JSON.parse(storedNotifications);
                        console.log('Loading notifications from localStorage:', notifications);

                        displayNotifications(notifications);

                        // Update notification count after fetching all notifications
                        const unreadCount = notifications.filter(notification => !notification.read).length;
                        updateNotificationCount(unreadCount);
                    } else {
                        console.warn('No notifications found in localStorage');
                        // Optional: Provide a default message if no notifications are found.
                        document.getElementById('notificationList').innerHTML = 
                            '<p class="list-group-item text-center text-muted py-3">No notifications available</p>';
                    }
                }

                // Display notifications from Firestore or localStorage
                function displayNotifications(notifications) {
                    const notificationList = document.getElementById('notificationList');
                    notificationList.innerHTML = ''; // Clear the list before adding new notifications
                
                    // Categorize notifications into new and older
                    const categorized = categorizeNotifications(notifications);
                
                    // Display new notifications
                    if (categorized['New Notifications'].length > 0) {
                        categorized['New Notifications'].forEach(notification => {
                            const notificationItem = createNotificationItem(notification);
                            notificationList.appendChild(notificationItem);
                        });
                    } else {
                        notificationList.innerHTML = '<p class="list-group-item text-center text-muted py-3">No new notifications</p>';
                    }
                
                    // Add toggle button for older notifications
                    const toggleOlderBtn = document.createElement('button');
                    toggleOlderBtn.innerText = 'Show Older Notifications';
                    toggleOlderBtn.classList.add('btn', 'btn-link'); // Bootstrap styling
                    toggleOlderBtn.onclick = () => {
                        const olderNotificationsContainer = document.getElementById('olderNotifications');
                        if (olderNotificationsContainer.style.display === 'none') {
                            olderNotificationsContainer.style.display = 'block';
                            toggleOlderBtn.innerText = 'Hide Older Notifications';
                        } else {
                            olderNotificationsContainer.style.display = 'none';
                            toggleOlderBtn.innerText = 'Show Older Notifications';
                        }
                    };
                
                    notificationList.appendChild(toggleOlderBtn);
                
                    // Create container for older notifications
                    const olderNotificationsContainer = document.createElement('div');
                    olderNotificationsContainer.id = 'olderNotifications';
                    olderNotificationsContainer.style.display = 'none'; // Hidden by default
                
                    // Display older notifications
                    categorized['Older Notifications'].forEach(notification => {
                        const notificationItem = createNotificationItem(notification);
                        olderNotificationsContainer.appendChild(notificationItem);
                    });
                
                    notificationList.appendChild(olderNotificationsContainer);
                }
                
                // Helper function to create a notification item
                function createNotificationItem(notification) {
                    const notificationItem = document.createElement('p');
                    notificationItem.classList.add('list-group-item');
                
                    // Calculate how long ago the notification was received
                    const timeAgo = getTimeAgo(notification.timestamp);
                    const message = notification.read ? 
                                    notification.message : 
                                    `<strong>${notification.message}</strong>`;
                
                    notificationItem.innerHTML = `
                        ${message}<br>
                        <small>${timeAgo}</small>
                    `;
                
                    // Add event listener for showing notification details and marking it as read
                    notificationItem.addEventListener('click', () => {
                        markAsRead(notification.id, notification.userId); // Mark notification as read
                        showNotificationDetails(notification); // Show notification details in a modal
                    });
                
                    return notificationItem;
                }
                
                // Helper function to calculate relative time (e.g., "12 hours ago")
                function getTimeAgo(timestamp) {
                    const now = new Date();
                    const secondsAgo = Math.floor((now - timestamp) / 1000);

                    const intervals = {
                        year: 31536000,
                        month: 2592000,
                        day: 86400,
                        hour: 3600,
                        minute: 60
                    };

                    for (const interval in intervals) {
                        const timeInterval = Math.floor(secondsAgo / intervals[interval]);
                        if (timeInterval >= 1) {
                            return `${timeInterval} ${interval}${timeInterval > 1 ? 's' : ''} ago`;
                        }
                    }

                    return 'Just now';
                }

                // Update the notification count (unread notifications)
                window.updateNotificationCount = function (unreadCount) {
                    const notificationCountElement = document.getElementById('notification-count');
                    console.log('Updating unread count:', unreadCount); // Debugging

                    notificationCountElement.textContent = unreadCount;

                    if (unreadCount > 0) {
                        notificationCountElement.style.display = 'inline-block';
                    } else {
                        notificationCountElement.style.display = 'none';
                    }
                }

                // Mark a notification as read
                async function markAsRead(notificationId, userId) {
                    try {
                        const notificationRef = doc(db, 'Notifications', notificationId);
                        await updateDoc(notificationRef, { read: true });

                        // Refresh the notifications after marking one as read
                        fetchNotifications(userId);
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }

                // Show detailed notification information in a modal
                function showNotificationDetails(notification) {
                    const timeAgo = getTimeAgo(notification.timestamp);

                    const notificationModal = `
                    <div class="modal fade" id="notificationDetailsModal" tabindex="-1" role="dialog" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="notificationDetailsLabel">Purchase Details</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body" id="notificationDetailsContent">
                                    <p><strong>Ref. No.</strong>${notification.notificationId}</p>  
                                    <p><strong>Gym Name:</strong> ${notification.gymName}</p>                            
                                    <p><strong>Product:</strong> ${notification.productName}</p>
                                    <p><strong>Quantity:</strong> ${notification.quantity}</p>
                                    <p><strong>Total Price:</strong> ${notification.totalPrice}</p>
                                    <p><strong>Status:</strong> ${notification.status}</p>
                                    <p>Please wait for the owner's approval. Show this receipt to the Gym owner.</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                    
                    document.body.insertAdjacentHTML('beforeend', notificationModal);
                    $('#notificationDetailsModal').modal('show');

                    $('#notificationDetailsModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }

                // Ensure notifications are fetched after user logs in and on page load
                window.onload = function () {
                    // Load notifications from localStorage immediately on page load
                    loadNotificationsFromLocalStorage();

                    // Get the current user ID and fetch notifications from Firestore
                    getCurrentUserId().then(userId => {
                        fetchNotifications(userId);
                    }).catch(error => {
                        console.error('Error during user authentication:', error);
                    });
                };
    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        const modal = document.getElementById('confirmationModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
                // Now all event listeners and modal functions are attached when DOM is ready
                fetchGymProfiles();
                viewProducts();
            // Fetch trainers when the page loads
    });

    window.toggleChat = function() {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = chatBox.style.display === "none" || chatBox.style.display === "" ? "block" : "none";
    };

    // Initialize chat box visibility
    document.addEventListener("DOMContentLoaded", () => {
        const chatBox = document.getElementById("chatBox");
        chatBox.style.display = "none"; // Hide chat box by default
    });
    // Ensure the membership modal is hidden on page load
    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none'; // Hide the modal initially
        }
    });

    window. closeMembershipPlansModal = function() {
        const modal = document.getElementById('membershipPlansModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Membership Plans modal element not found');
        }
    }
    
    // Example function to send a message
    window.sendMessage = function() {
        const messageInput = document.getElementById("messageInput");
        const messagesContainer = document.getElementById("messages");

        if (messageInput.value.trim()) {
            const messageElement = document.createElement("div");
            messageElement.textContent = messageInput.value;
            messagesContainer.appendChild(messageElement);
            messageInput.value = ""; // Clear input after sending
        }
    };
        // Function to show the global spinner
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

        // Add event listeners to all navigation links with a 1.5-second delay
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent immediate navigation
                showSpinner();

                // Simulate loading with a 1.5-second delay
                setTimeout(() => {
                    hideSpinner();
                    window.location.href = navLink.href; // Proceed to the link
                }, 500); // 1.5 seconds delay
            });
        });

        // Add event listeners to all buttons with a 2-second delay
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function(event) {
                showSpinner();

                // Simulate loading with a 2-second delay
                setTimeout(() => {
                    hideSpinner();
                }, 1500); // 2 seconds delay
            });
        });

        // Event delegation to handle dynamically generated elements like product cards, membership plans, and view-more buttons
        document.addEventListener('click', function(event) {
            const target = event.target;

            // Check if the target is a "View More" or any dynamically generated button
            if (target.matches('.view-more-btn') || target.matches('.membership-plan-btn') || target.matches('.product-card-btn')) {
                showSpinner();

                // Simulate loading with a 2-second delay for these buttons
                setTimeout(() => {
                    hideSpinner();
                }, 1500); // 2 seconds delay
            }
        });
