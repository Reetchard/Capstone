import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, addDoc,getDoc,query,where,updateDoc,onSnapshot,orderBy, limit} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'; 
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
     
window.filterGyms = function() {
    const searchInput = document.getElementById('gymSearch').value.toLowerCase(); // Get search box value
    const gymProfiles = document.getElementById('gym-profiles'); // Container for gym profiles
    const gyms = gymProfiles.getElementsByClassName('gym'); // All gym profile elements

    // Iterate through all gym profiles
    for (let i = 0; i < gyms.length; i++) {
        const gymName = gyms[i].getAttribute('data-name').toLowerCase(); // Get the data-name attribute
        if (searchInput === '' || gymName.includes(searchInput)) {
            gyms[i].style.display = ''; // Show matching gyms or all gyms if input is empty
        } else {
            gyms[i].style.display = 'none'; // Hide gyms that don't match
        }
    }
}


window.searchGyms = async function searchGyms() {
    const searchInput = document.getElementById('gymSearch').value.trim().toLowerCase();
    const searchContainer = document.querySelector('.search-container');
    const clearIcon = document.getElementById('clearIcon'); // Get the clear icon element

    searchContainer.style.position = 'relative'; // Ensure results are positioned below the container

    // Show or hide the "X" icon based on input
    if (searchInput !== '') {
        clearIcon.style.display = 'block'; // Show the "X" icon when typing
    } else {
        clearIcon.style.display = 'none'; // Hide the "X" icon when input is empty
    }

    // Remove any existing search results
    let existingResults = document.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }

    if (searchInput === '') {
        // Show all gym profiles when input is empty (i.e., no filter applied)
        fetchGymProfiles();
        return; // Exit if no search input
    }

    try {
        const gymsCollection = collection(db, 'GymOwner');
        const gymSnapshot = await getDocs(gymsCollection); // Fetch all gyms

        const matchingGyms = gymSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(gym => 
                gym.gymName && gym.gymName.toLowerCase().includes(searchInput) &&
                gym.status && gym.status !== 'Under Review'
            );

        const resultsContainer = document.createElement('div');
        resultsContainer.classList.add('search-results'); // Use the CSS class for styling

        if (matchingGyms.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result-item">No gyms found.</div>';
        } else {
            matchingGyms.forEach(gym => {
                const resultItem = document.createElement('div');
                resultItem.classList.add('search-result-item');
                resultItem.textContent = gym.gymName;

                // Display the selected gym profile on click
                resultItem.onclick = () => {
                    document.getElementById('gymSearch').value = gym.gymName; // Update the search input
                    resultsContainer.remove(); // Clear search suggestions
                    fetchGymProfiles(gym.gymName); // Fetch and display only the selected gym profile
                };

                resultsContainer.appendChild(resultItem);
            });
        }

        searchContainer.appendChild(resultsContainer); // Append results below the container

        // Close the results when clicking outside
        document.addEventListener('click', function closeResults(event) {
            if (!searchContainer.contains(event.target)) {
                resultsContainer.remove();
                document.removeEventListener('click', closeResults); // Remove the event listener after closing
            }
        });

    } catch (error) {
        console.error('Error fetching gyms:', error);
    }
};

// Event listener for the "X" icon (clear the input)
document.getElementById('clearIcon').addEventListener('click', () => {
    const searchInput = document.getElementById('gymSearch');
    searchInput.value = ''; // Clear the search input field
    searchInput.focus(); // Focus back to the input field
    document.getElementById('clearIcon').style.display = 'none'; // Hide the "X" icon
    fetchGymProfiles(); // Show all gyms again
});




// Fetch and display gyms, optionally filtered by name
async function fetchGymProfiles(filterName = null) {
    const gymsCollection = collection(db, 'GymOwner');
    const gymOwnerQuery = query(gymsCollection, where('role', '==', 'gymowner'));

    const gymSnapshot = await getDocs(gymOwnerQuery);
    const gymList = gymSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() // Include the document data and its ID
    }));

    const gymProfilesContainer = document.getElementById('gym-profiles'); // Ensure correct ID
    gymProfilesContainer.innerHTML = ''; // Clear existing profiles

    gymList.forEach(gym => {
        // Check if the gym matches the filter or if no filter is applied
        if (gym.status && gym.status !== 'Decline' && (!filterName || gym.gymName === filterName)) {
            const gymDiv = document.createElement('div');
            gymDiv.classList.add('trainer-card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

            gymDiv.innerHTML = `
                <div class="gym-card-container">
                    <img src="${gym.gymPhoto || 'default-photo.jpg'}" alt="${gym.gymName || 'Gym'}" class="card-img-top gym-photo" />
                    <div class="card-body">
                        <h5 class="card-title gym-title">${gym.gymName || 'N/A'}</h5>
                        <button class="btn-custom btn-primary view-more-btn" onclick="viewMore('${gym.id}')">Gym Info</button>
                    </div>
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
            const gymDocRef = doc(db, 'GymOwner', gymId);
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
                const modalGymservices = document.getElementById('modalGymservices');
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
                if (modalGymservices) modalGymservices.innerText = gymData.gymServices || 'N/A';
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
                    collection(db, 'Trainer'),
                    where('role', '==', 'trainer'),
                    where('gymName', '==', gymProfileName)
                );
                const trainersSnapshot = await getDocs(trainersQuery);
    
                if (!trainersSnapshot.empty) {
                    trainersSnapshot.forEach(doc => {
                        const trainerData = doc.data();
                        if (trainerData.status !== "Decline") {
                            const trainerCard = `
                                <div class="trainer-card">
                                    <img src="${trainerData.TrainerPhoto || 'default-trainer-photo.jpg'}" alt="Trainer Photo" class="trainer-photo">
                                    <h5>${trainerData.username || 'No Name'}</h5>
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
                            <div class="trainer-card">
                                <img src="${productData.photoURL || 'default-product.jpg'}" alt="Product Photo" class="product-photo">
                                <h5>${productData.name || 'Unnamed Product'}</h5>
                                <button class="btn-custom btn-primary" onclick="ViewProductInfo('${doc.id}')">View Details</button>
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
    // Function to check if the user's membership is approved
    async function checkMembershipStatus(userId, gymName) {
        // Check for undefined values
        if (!userId || !gymName) {
            console.error("Error: userId or gymName is undefined.");
            return false; // Exit early if values are invalid
        }

        try {
            // Query the Transactions collection to find membership status
            const membershipQuery = query(
                collection(db, 'Transactions'),
                where('userId', '==', userId),
                where('gymName', '==', gymName)
            );
            const membershipSnapshot = await getDocs(membershipQuery);

            // Check each document for 'Approved' status
            if (!membershipSnapshot.empty) {
                for (const doc of membershipSnapshot.docs) {
                    const transaction = doc.data();
                    if (transaction.status === 'Accepted') {
                        return true; // Return true if any document has 'Approved' status
                    }
                }
            }

            // Return false if no document has 'Approved' status
            return false;
        } catch (error) {
            console.error("Error checking membership status:", error);

            // Display SweetAlert message if an error occurs
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Approval Needed',
                    text: "⚠️ Ooops! Your membership needs Gym Owner's approval. Please contact support or complete any pending steps to proceed.",
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                });
            } else {
                console.error("SweetAlert (Swal) is not defined.");
            }

            return false;
        }
    }
    
window.ViewProductInfo = async function (productId) {
    try {
        // Hide any open modals before showing the product info
        $('.modal').modal('hide');

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
            let productPrice = parseFloat(productData.price) || 0; // Convert to float to handle decimals

            // Ensure price is always displayed with commas and two decimal places
            function formatPrice(price) {
                return '₱' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            // Store the original product price in a dataset for consistent access
            modalProductPrice.dataset.originalPrice = productPrice;

            // Display product data
            modalProductName.innerText = productData.name || 'Unnamed Product';
            modalProductPrice.innerText = formatPrice(productPrice);
            modalProductDescription.innerText = productData.description || 'No description available.';
            modalProductPhoto.src = productData.photoURL || 'default-product.jpg';
            modalProductPhoto.setAttribute('data-product-id', productId); // Store productId in the photo element
            modalProductCategory.innerText = productData.category || 'N/A';
            modalProductQuantityAvailable.innerText = `Available: ${availableStock}`;

            // Function to update total price based on selected quantity
            function updatePrice() {
                const totalPrice = productPrice * selectedQuantity;
                modalProductPrice.innerText = formatPrice(totalPrice); // Update the total price display
            }

            // Update the displayed stock and quantity
            function updateQuantity() {
                modalProductQuantityInput.value = selectedQuantity;
                modalProductQuantityAvailable.innerText = `Available: ${availableStock - selectedQuantity}`;
                updatePrice(); // Update the total price when quantity changes
            }

            // Remove existing event listeners to prevent duplication
            increaseQuantityBtn.onclick = null;
            decreaseQuantityBtn.onclick = null;

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
            Swal.fire({
                icon: 'error',
                title: 'Product Not Found',
                text: 'The requested product could not be found.',
            });
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while fetching product details. Please try again.',
        });
    }
};

    
    
    window.buyNow = async function () {
        try {
            const modalProductPhoto = document.getElementById("modalProductPhoto");
            const productId = modalProductPhoto.dataset.productId;
                        // Validate productId
                        if (!productId) {
                            console.error("Product ID is undefined.");
                            Swal.fire({
                                icon: "error",
                                title: "Error",
                                text: "Product ID is missing. Please try again.",
                            });
                            return;
                        }
            // Ensure user ID is available before proceeding
            const userId = await getCurrentUserId(); // Get userId from the Users collection
    
            // Get product details
            const productName = document.getElementById('modalProductName').innerText;
            const quantityPurchased = document.getElementById('modalProductQuantityInput').value;
            const totalPrice = document.getElementById('modalProductPrice').innerText;
            if (!quantityPurchased || !productPrice) {
                console.error("Invalid inputs:", { productId, quantityPurchased, productPrice });
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Quantity or price is invalid. Please try again.",
                });
                return;
            }     
            // Continue with the purchase process...
            console.log("Processing purchase for:", { productId, productName, quantityPurchased, productPrice });
    
            // Fetch product from Firestore
            const productDocRef = doc(db, "Products", productId);
            const productDoc = await getDoc(productDocRef);
    
            if (!productDoc.exists()) {
                Swal.fire({
                    icon: "error",
                    title: "Product Not Found",
                    text: "The selected product does not exist in the database.",
                });
                return;
            }
            const productData = productDoc.data();
            const availableStock = productData.quantity || 0;
    
            // Check stock availability
            if (quantityPurchased > availableStock) {
                Swal.fire({
                    icon: "error",
                    title: "Insufficient Stock",
                    text: `Only ${availableStock} units are available.`,
                });
                return;
            }
    
            // Update the product quantity in Firestore
            const updatedStock = availableStock - quantityPurchased;
            await updateDoc(productDocRef, { quantity: updatedStock });      
            // Assuming gymName is available in the GymProfile card
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card
    
            // Set product details in confirmation modal
            document.getElementById('confirmProductName').innerText = productName;
            document.getElementById('confirmQuantity').innerText = quantityPurchased;
            document.getElementById('confirmTotalPrice').innerText = totalPrice;
    
            // Show the confirmation modal
            $('#confirmationModal').modal('show');
            document.getElementById('notification-count').innerText = notificationCount;
            // Handle confirmation action
            document.getElementById('confirmPurchaseBtn').onclick = async function () {
                try {

                        // Check if user already has a pending or active transaction for the same product
                    const existingTransactionQuery = query(
                        collection(db, 'Transactions'),
                        where('userId', '==', userId),
                        where('status', 'in', ['Pending', 'Active'])  // Check for active or pending transactions
                    );
                    const existingTransactionSnapshot = await getDocs(existingTransactionQuery);
            
                    if (!existingTransactionSnapshot.empty) {
                        // If there's already an active or pending transaction for this product, prevent purchase
                        Swal.fire({
                            icon: 'error',
                            title: 'Purchase Conflict',
                            text: `You already have a pending or active transaction for ${productName}. Please wait for it to complete before purchasing again.`,
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#3085d6'
                        });
                        return; // Stop further processing
                    }
                    // Simulate purchase logic (e.g., update stock, etc.)
                    notificationCount++;
    
                    // Create a new notification with detailed information
                    const newNotification = {
                        message : `You purchased ${quantityPurchased} of ${productName} for ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
                        type : 'Products', 
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        status: 'Pending',
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
                        type: 'Products',
                        userId: userId, // Storing userId of the customer/user
                        productName: productName,
                        quantity: quantityPurchased,
                        totalPrice: totalPrice,
                        status : 'Pending',           
                        gymName: gymName, // Storing gymName from GymProfile card
                        timestamp: new Date().toISOString() // Timestamp of the transaction

                    };
    
                    // Save the transaction to Firestore under a 'Transactions' collection
                    await addDoc(collection(db, 'Transactions'), newTransaction);
    
                    // Close the confirmation modal
                    $('#confirmationModal').modal('hide');
    
                    // Ensure that success modal elements exist before setting innerText
                    const successProductName = document.getElementById('successProductName');
                    const successQuantity = document.getElementById('successQuantity');
                    const successTotalPrice = document.getElementById('successTotalPrice');
    
                    if (successProductName && successQuantity && successTotalPrice) {
                        // Show success modal with details if elements exist
                        successProductName.innerText = productName;
                        successQuantity.innerText = quantityPurchased;
                        successTotalPrice.innerText = totalPrice;
                        $('#successModal').modal('show');
                    } else {
                        console.error('Success modal elements not found.');
                    }
    
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
            document.getElementById('notification-count').innerText = notificationCount;
    
            const productId = document.getElementById('modalProductPhoto').dataset.productId;
            if (!productId) {
                console.error('Product ID is undefined.');
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Product ID is missing. Please try again.',
                });
                return;
            }
    
            const productName = document.getElementById('modalProductName').innerText;
            const quantityPurchased = parseInt(document.getElementById('modalProductQuantityInput').value, 10) || 0;
            const productPrice = parseFloat(document.getElementById('modalProductPrice').dataset.originalPrice) || 0;
            const gymName = document.getElementById('modalGymName').innerText;
    
            if (!quantityPurchased || !productPrice) {
                console.error('Invalid input:', { quantityPurchased, productPrice });
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Quantity or price is invalid. Please try again.',
                });
                return;
            }
    
            // Ensure user is authenticated and get userId
            const authUser = auth.currentUser;
            if (!authUser) {
                throw new Error("No authenticated user found.");
            }
            
            const userId = authUser.uid;
    
            // Check if user already has a pending or active transaction for the same product
            const existingTransactionQuery = query(
                collection(db, 'Transactions'),
                where('userId', '==', userId),
                where('status', 'in', ['Pending', 'Active'])  // Check for active or pending transactions
            );
            const existingTransactionSnapshot = await getDocs(existingTransactionQuery);
    
            if (!existingTransactionSnapshot.empty) {
                // If there's already an active or pending transaction for this product, prevent purchase
                Swal.fire({
                    icon: 'error',
                    title: 'Purchase Conflict',
                    text: `You already have a pending or active transaction for ${productName}. Please wait for it to complete before purchasing again.`,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6'
                });
                return; // Stop further processing
            }
    
            // Fetch the product document from Firestore
            const productDocRef = doc(db, 'Products', productId);
            const productDoc = await getDoc(productDocRef);
    
            if (!productDoc.exists()) {
                Swal.fire({
                    icon: 'error',
                    title: 'Product Not Found',
                    text: 'The selected product does not exist in the database.',
                });
                return;
            }
    
            const productData = productDoc.data();
            const availableStock = productData.quantity || 0;
    
            // Ensure enough stock is available
            if (quantityPurchased > availableStock) {
                Swal.fire({
                    icon: 'error',
                    title: 'Insufficient Stock',
                    text: `Only ${availableStock} units are available.`,
                });
                return;
            }
    
            // Update the product quantity in Firestore
            const updatedStock = availableStock - quantityPurchased;
            await updateDoc(productDocRef, { quantity: updatedStock });
            document.getElementById('notification-count').innerText = notificationCount;
    
            // Add notification
            const newNotification = {
                message: `You purchased ${quantityPurchased} of ${productName} for ₱${(productPrice * quantityPurchased).toFixed(2)}.`,
                productName: productName,
                type: 'Products',
                quantity: quantityPurchased,
                totalPrice: productPrice * quantityPurchased,
                status: 'Pending',
                read: false, // Unread notification
                userId: userId, // Use the current user's userId from the document
                gymName: gymName, // Storing gymName from GymProfile card
                notificationId: Date.now().toString(),
                timestamp: new Date().toISOString(),
            };
    
            console.log('Notification:', newNotification);
    
            // Save the notification to Firestore
            await addDoc(collection(db, 'Notifications'), newNotification);
    
            // Save transaction to 'Transactions' collection
            const newTransaction = {
                type: 'Products',
                userId: userId, // Storing userId of the customer/user
                productName: productName,
                quantity: quantityPurchased,
                totalPrice: productPrice * quantityPurchased,
                status: 'Pending',
                gymName: gymName, // Storing gymName from GymProfile card
                timestamp: new Date().toISOString() // Timestamp of the transaction
            };
    
            console.log('Transaction:', newTransaction);
    
            // Save the transaction to Firestore
            await addDoc(collection(db, 'Transactions'), newTransaction);
            
            // Close the confirmation modal
            $('#confirmationModal').modal('hide');
    
            // Show success modal
            document.getElementById('successProductName').innerText = productName;
            document.getElementById('successQuantity').innerText = quantityPurchased;
            document.getElementById('successTotalPrice').innerText = (productPrice * quantityPurchased).toFixed(2);
            $('#successModal').modal('show');
    
            // Update the notification list (assuming this function exists)
            await fetchNotifications(userId);
            // Update the UI or redirect
            $('#productModal').modal('hide');
        } catch (error) {
            console.error('Error saving notification, transaction, or updating stock:', error);
            Swal.fire({
                icon: 'error',
                title: 'Purchase Failed',
                text: 'An error occurred while completing your purchase. Please try again.',
            });
        }
    };
    
    

    document.getElementById('membershipPlansBtn').addEventListener('click', function() {
        // Hide any open modals before showing the new one
        $('.modal').modal('hide'); // Hides all open modals
    
        const gymProfileName = document.getElementById('modalGymName').innerText;
        showMembershipPlans(gymProfileName);
    });
    
    // Function to fetch and display the membership plans
    window.showMembershipPlans = async function(gymProfileName) {
        try {
            // Clear and prepare the membership plans section
            const membershipPlansSection = document.getElementById('membershipPlansSection');
            membershipPlansSection.innerHTML = ''; 
            
            const cardColors = [
                'linear-gradient(to right, #6094EA, #f9f9f9, #6094EA)',  
                'linear-gradient(to right, #184E68, #57CA85)', 
                'linear-gradient(to right, #F02FC2, #6094EA)'
            ];
    
            const membershipPlansQuery = query(
                collection(db, 'MembershipPlans'),
                where('gymName', '==', gymProfileName)
            );
            
            const membershipPlansSnapshot = await getDocs(membershipPlansQuery);
    
            if (!membershipPlansSnapshot.empty) {
                let colorIndex = 0;
                membershipPlansSnapshot.forEach(doc => {
                    const planData = doc.data();
                    const backgroundColor = cardColors[colorIndex % cardColors.length];
                    colorIndex++;
    
                    const planCard = `
                        <div class="plan-card card mb-3" style="background: ${backgroundColor};">
                            <div class="card-body">
                                <h4 class="card-title">${planData.membershipType || 'Unnamed Plan'}</h4>
                                <h5 class="card-title">₱${planData.price || 'N/A'}</h5>
                                <p class="card-text">${planData.description || 'No description available.'}</p>
                                <button class="btn-custom btn-primary" onclick="confirmPlanPurchase('${planData.membershipType}', '${planData.price}', '${planData.membershipDays}', '${doc.id}')">Apply</button>
                            </div>
                        </div>
                    `;
    
                    membershipPlansSection.innerHTML += planCard;
                });
            } else {
                membershipPlansSection.innerHTML = '<p>No membership plans found for this gym.</p>';
            }
    
            // Show the membership plans modal using Bootstrap 5's JavaScript API
            const membershipPlansModal = new bootstrap.Modal(document.getElementById('membershipPlansModal'), { backdrop: 'static', keyboard: false });
            membershipPlansModal.show();
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        }
    };  
    
    window.confirmPlanPurchase = function(planType, price, membershipDays, planId) {
        console.log('confirmPlanPurchase triggered for:', planType, price, planId, membershipDays);
    
        // Hide any open modals before showing the confirmation modal
        $('.modal').modal('hide'); // This hides any open modals
    
        // Set the selected plan details in the confirmation modal
        document.getElementById('selectedPlanType').innerText = planType;
        document.getElementById('selectedPlanPrice').innerText = price;
    
        // Show the confirmation modal
        const confirmPurchaseModal = new bootstrap.Modal(document.getElementById('confirmPurchaseModal'), {
            backdrop: 'static',
            keyboard: false,
            focus: false
        });
    
        confirmPurchaseModal.show();
    
        // Set the action for the Confirm Purchase button
        document.getElementById('confirmMemberPurchaseBtn').onclick = async function() {
            try {
                const userId = await getCurrentUserId();
                if (!userId) throw new Error('No user ID found. Please log in.');
    
                const gymName = document.getElementById('modalGymName').innerText;
                if (!gymName) throw new Error('Gym name not available.');
    
                console.log('Proceeding with purchase for:', planType, price, membershipDays, planId, userId, gymName);
    
                // Check if the user already has an active or pending membership plan
                const existingMembershipQuery = query(
                    collection(db, 'Transactions'),
                    where('userId', '==', userId),
                    where('status', 'in', ['Pending Owner Approval', 'Active']) // Check for active or pending memberships
                );
                const existingMembershipSnapshot = await getDocs(existingMembershipQuery);
    
                if (!existingMembershipSnapshot.empty) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Membership Already Active or Pending',
                        text: 'You already have an active or pending membership plan.',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6'
                    });
                    confirmPurchaseModal.hide(); // Hide the confirmation modal
                    return; // Stop the purchase process
                }
    
                // Call the purchasePlan function to save the transaction
                await purchasePlan(planId, planType, price, membershipDays, userId, gymName);
                await displayMembershipNotificationDot();
    
                // Hide the confirmation modal before showing the success modal
                confirmPurchaseModal.hide();
    
                // Success modal content
                const successModalContent = `
                    <div id="membershipSuccessModal" class="modal fade" tabindex="-1" role="dialog">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Membership Purchase Successful!</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body text-center">
                                    <div class="icon-container">
                                        <i class="fas fa-check-circle fa-3x"></i>
                                    </div>
                                    <p class="modal-text">
                                        Your membership purchase was successful! Thank you for choosing <strong id="gymNameSuccess">${gymName}</strong>.
                                    </p>
                                    <p><strong>Plan:</strong> ${planType}</p>
                                    <p><strong>Price:</strong> ₱${price}</p>
                                    <p class="processing-text">Please wait for the Gym owner's approval.</p>
                                    <div class="processing-time">
                                        <i class="fas fa-clock"></i> <span>Processing Time: Up to 24 hours</span>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" id="okButton" class="btn btn-success">OK</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    
                // Inject success modal into the body (if not already present)
                document.body.insertAdjacentHTML('beforeend', successModalContent);
    
                // Show the success modal
                const membershipSuccessModal = new bootstrap.Modal(document.getElementById('membershipSuccessModal'), {
                    backdrop: 'static',
                    keyboard: false,
                    focus: false
                });
    
                membershipSuccessModal.show();
    
                // Add event listener to the dynamically created OK button to close the modal
                document.getElementById('okButton').addEventListener('click', function() {
                    membershipSuccessModal.hide();  // Hide the success modal when OK is clicked
                    document.getElementById('membershipSuccessModal').remove(); // Clean up the modal from DOM after it's hidden
                });
    
            } catch (error) {
                console.error('Error during membership purchase:', error.message);
                
                // Show error message using SweetAlert
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'There was an error processing your request.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6'
                });
    
                confirmPurchaseModal.hide(); // Hide the confirmation modal on error
                const errorModal = new bootstrap.Modal(document.getElementById('errorModal'), { backdrop: 'static', keyboard: false });
                errorModal.show();
            }
        };
    };
    
    
    
    

    async function purchasePlan(planId, planType, price, membershipDays, userId, gymName) {
        try {
            console.log('Attempting to save transaction:', { planId, planType, price, membershipDays, userId, gymName });
            const newTransaction = {
                type : 'membership',
                userId: userId,
                planId: planId,
                planType: planType,
                price: price,
                membershipDays: membershipDays, // Save the membership duration
                gymName: gymName,
                purchaseDate: new Date().toISOString(), // Save the current date and time
                status: 'Pending Owner Approval' // Default status for membership
            };
            // Save the transaction to Firestore
            await addDoc(collection(db, 'Transactions'), newTransaction);
            console.log('Transaction saved successfully.');

        const message = `A new member has applied; please review it for approval.`;
        const notification = {
            userId: userId,
            gymName: gymName,
            message: message,
            timestamp: new Date().toISOString(), // Current date and time
            status: 'Unread' // Default status
        };
        await addDoc(collection(db, 'MemberNotif'), notification);
        console.log('Member notification saved successfully.');   
        } catch (error) {
            console.error('Error saving transaction:', error);
            throw new Error('Failed to save the transaction');
        }
    }
    


    // Function to display the red dot on the Membership link
    function displayMembershipNotificationDot() {
        const membershipDot = document.getElementById('membershipNotificationDot');
        if (membershipDot) {
            membershipDot.style.display = 'inline'; // Show the red dot
        }
    }
    // Function to hide the red dot when the user navigates to the Membership section
    function clearMembershipNotificationDot() {
        const membershipDot = document.getElementById('membershipNotificationDot');
        if (membershipDot) {
            membershipDot.style.display = 'none'; // Hide the red dot
        }
    }

    // Attach an event listener to the Membership link to clear the notification dot when clicked
    document.querySelector('.nav-link[href="#Membership"]').addEventListener('click', clearMembershipNotificationDot);


    // Function to show the Membership Status modal
    document.querySelector('.nav-link[href="#Membership"]').addEventListener('click', async function () {
        try {
            // Fetch the current user's ID
            const userId = await getCurrentUserId();

            if (!userId) {
                console.error('No user ID found. Please log in.');
                return;
            }

            console.log(`User ID: ${userId}`);

            // Fetch the user's current membership status and history
            await fetchMembershipStatusAndHistory(userId);

            // Show the membership status modal
            $('#membershipStatusModal').modal('show');
        } catch (error) {
            console.error('Error showing membership status:', error);
        }
    });

    // Function to fetch the user's membership status and history
    async function fetchMembershipStatusAndHistory(userId) {
        try {
            const currentMembershipStatusDiv = document.getElementById('currentMembershipStatus');
            const membershipHistoryDiv = document.getElementById('membershipHistory');
    
            currentMembershipStatusDiv.innerHTML = ''; // Clear previous data
            membershipHistoryDiv.innerHTML = ''; // Clear previous history
    
            console.log(`Fetching membership status for userId: ${userId}`);
    
            // Fetch all memberships (current and history)
            const membershipQuery = query(
                collection(db, 'Transactions'),
                where('userId', '==', userId),
                orderBy('purchaseDate', 'desc') // Order by the latest purchase first
            );
    
            const membershipSnapshot = await getDocs(membershipQuery);
    
            if (membershipSnapshot.empty) {
                console.log('No memberships found for this user.');
                currentMembershipStatusDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; background-color: transparent; border-radius: 10px;">
                        <p style="font-size: 1.2em; color: #888;">No active membership found.</p>
                    </div>`;
                return;
            }
    
            let currentMembershipHtml = '';
            let historyHtml = '<ul style="list-style: none; padding: 0;">';
            const today = new Date(); // Get the current date
    
            membershipSnapshot.forEach(doc => {
                const membership = doc.data();
                console.log('Membership Data:', membership); // Debug the membership data
    
                const purchaseDate = new Date(membership.purchaseDate);
                const durationInDays = membership.duration || 30; // Use duration from Firestore or default to 30 days
                const expirationDate = new Date(purchaseDate.getTime() + durationInDays * 24 * 60 * 60 * 1000);
    
                const membershipHtml = `
                    <li style="margin-bottom: 15px;">
                        <div style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: linear-gradient(135deg, #f7f7f7 0%, #eaeaea 100%);
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); transition: transform 0.3s;">
                            <h4 style="font-size: 1.5em; font-weight: bold; color: #5B247A; margin-bottom: 8px;">
                                <i class="fas fa-dumbbell" style="color: #1BCEDF;"></i> 
                                ${membership.gymName || 'Unnamed Gym'}
                            </h4>
                            <p style="margin: 8px 0;"><strong>Plan:</strong> ${membership.planType || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong>Price:</strong> <span style="color: #28a745;">₱${membership.price || 'N/A'}</span></p>
                            <p style="margin: 8px 0;"><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                            <p style="margin: 8px 0;"><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                            <p style="margin: 8px 0;"><strong>Status:</strong> 
                                <span style="color: ${membership.status === 'Accepted' ? '#28a745' : '#FF5722'};">${membership.status || 'N/A'}</span>
                            </p>
                        </div>
                    </li>
                `;
    
                // Check if the membership has expired
                if (expirationDate < today) {
                    // If expired, add to membership history
                    historyHtml += membershipHtml;
                } else {
                    // If not expired, show as the current membership with countdown
                    currentMembershipHtml = `
                        <div class="membership-card">
                            <h4 class="gym-name">
                                ${membership.gymName || 'Unnamed Gym'}
                            </h4>
                            <div class="membership-info">
                                <p><strong>Plan:</strong> ${membership.planType || 'N/A'}</p>
                                <p><strong>Price:</strong> <span class="price">₱${membership.price || 'N/A'}</span></p>
                                <p><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                                <p><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                                <p><strong>Time Remaining:</strong> <span id="countdown" class="countdown"></span></p>
                                    <p style="margin: 10px 0;"><strong>Status:</strong> 
                                    <span style="color: ${membership.status === 'Delete' ? '#28a745' : '#FF5722'};">${membership.status || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    `;
    
                    // Render the current membership HTML before starting the countdown
                    currentMembershipStatusDiv.innerHTML = currentMembershipHtml;
    
                    // Now that the HTML is rendered, start the countdown only if the status is approved
                    startCountdown(expirationDate, membership.status);
                }
            });
    
            historyHtml += '</ul>';
    
            // If no current membership, show message
            if (currentMembershipHtml === '') {
                currentMembershipStatusDiv.innerHTML = `
                    <div style="text-align: center; padding: 20px; background-color: transparent; border-radius: 10px;">
                        <p style="font-size: 1.2em; color: #888;">No active membership found.</p>
                    </div>`;
            }
    
            // Render HTML for the membership history
            membershipHistoryDiv.innerHTML = `
                <div style="padding: 20px; background: linear-gradient(135deg, #6EACDA 0%,  #4d4d4d 100%);; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <h4 style="color: #ffffff; font-weight: bold;">Membership History</h4>
                    ${historyHtml}
                </div>`;
        } catch (error) {
            console.error('Error fetching membership status and history:', error);
        }
    }
        // Global variable to store the interval ID
        let countdownInterval;

        function startCountdown(expirationDate, status) {
            const countdownElement = document.getElementById('countdown');

            // Debugging log to check values passed to the function
            console.log(`Starting countdown with expirationDate: ${expirationDate}, status: ${status}`);

            // Check if the countdown element is present in the DOM
            if (!countdownElement) {
                console.error('Countdown element not found');
                return;
            }

            // Only start the countdown if the status is "Approved"
            if (status !== 'Accepted') {
                countdownElement.innerText = status === 'Pending Owner Approval' ? 'Pending Owner Approval' : 'Status not approved';
                console.log('Countdown will not start, status is not approved.');
                return;
            }

            // Clear any existing interval to prevent multiple intervals from running
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }

            // Validate expirationDate to avoid NaN issues
            expirationDate = new Date(expirationDate);
            if (isNaN(expirationDate.getTime())) {
                countdownElement.innerText = 'Invalid expiration date';
                console.error('Invalid expirationDate value:', expirationDate);
                return;
            }

            console.log(`Expiration date calculated as: ${expirationDate.toLocaleString()}`);

            const updateCountdown = () => {
                const currentTime = new Date();
                const timeRemaining = expirationDate - currentTime;

                // Stop countdown and display "Expired" when timeRemaining is zero or less
                if (timeRemaining <= 0) {
                    countdownElement.innerText = 'Expired';
                    clearInterval(countdownInterval); // Clear the interval when expired
                    return;
                }

                // Calculate days, hours, minutes, and seconds remaining
                const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

                // Log the remaining time for debugging
                console.log(`Time remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`);

                // Update countdown text
                countdownElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            };

            // Start the countdown interval and assign it to countdownInterval
            countdownInterval = setInterval(updateCountdown, 1000);

            // Immediately call updateCountdown to display the initial time remaining without waiting 1 second
            updateCountdown();
        }

        // DEBUGGING CHECK
        // Call the startCountdown function directly with sample data to test if it's working
        // Replace this with the actual expiration date from your data if testing in your setup
        startCountdown(new Date('2024-11-29T13:48:46+08:00'), 'Approved'); // Test with a specific expiration date and Approved status

    
    async function fetchGymOwnerLocation(gymName) {
        try {
            const gymQuery = query(
                collection(db, 'GymOwner'), 
                where('gymName', '==', gymName), 
                where('role', '==', 'gymowner') 
            );

            const gymSnapshot = await getDocs(gymQuery);

            if (!gymSnapshot.empty) {
                const gymData = gymSnapshot.docs[0].data();
                const gymLocation = gymData.gymLocation || ''; 
                console.log('Gym Location found:', gymLocation);
                return gymLocation;
            } else {
                console.error('No gym found with the given name.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching gym location:', error);
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
            // Use custom toast notification for errors
            showToast('error', 'Location is reloading. Please wait for a moment.');
            return null;
        }
    };
    
    
    // Initialize the map using Leaflet with OpenStreetMap tiles
    let map; // Global map instance

    window.initMap = function(lat, lon) {
        console.log(`Initializing map with coordinates: lat=${lat}, lon=${lon}`);

        const mapContainer = document.getElementById('map');
        
        if (!mapContainer) {
            console.error('Map container not found in the DOM.');
            return;
        }

        // Ensure the map container is visible (in the modal)
        console.log('Map container found, attempting to initialize map.');

        // Clear any existing map content or reset the map instance
        mapContainer.innerHTML = ""; // Clear any existing map content

        if (map) {
            // If map instance already exists, reset it by removing the map
            map.remove();
            map = null; // Reset the map to null to allow re-initialization
        }

        // Initialize a new map instance
        map = L.map('map').setView([lat, lon], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors'
        }).addTo(map);

        L.marker([lat, lon]).addTo(map)
            .bindPopup('Gym Location')
            .openPopup();

        console.log('Map initialized successfully.');
    };

    // Ensure map initialization happens after the modal is fully displayed
    document.addEventListener("DOMContentLoaded", function () {
        const locationIcon = document.getElementById('locationIcon');

        if (!locationIcon) {
            console.error('Location icon not found in the DOM.');
            return;
        }

        locationIcon.addEventListener('click', async function () {
            try {
                console.log('Location icon clicked');

                // Get the gym name from the modal
                const gymName = document.getElementById('modalGymName').innerText;
                console.log('Gym Name:', gymName);

                if (!gymName) {
                    console.error('Gym name is not provided.');
                    alert('Gym name is not available.');
                    return;
                }

                // Fetch gym owner location using gymName
                const gymLocation = await fetchGymOwnerLocation(gymName);
                console.log('Gym Location (City):', gymLocation);

                if (gymLocation) {
                    const { lat, lon } = await fetchGymCoordinates(gymLocation);
                    console.log('Fetched lat and lon:', lat, lon);

                    if (lat && lon) {
                        // Check if the map modal exists
                        const mapModal = document.getElementById('mapModal');
                        if (!mapModal) {
                            console.error('Map modal not found in the DOM.');
                            return;
                        }

                        // Show the map modal
                        console.log('Showing map modal.');
                        $('#mapModal').modal('show');

                        // Initialize the map after the modal is fully shown
                        $('#mapModal').on('shown.bs.modal', function () {
                            console.log('Map modal fully shown, initializing map.');
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
    });


    function initializeMessageListener() {
        const messagesRef = collection(db, 'Messages');
        
        // Listen for messages sent to the current user that are unread
        onSnapshot(
            query(messagesRef, where('to', '==', auth.currentUser.uid), where('status', '==', 'unread')),
            (snapshot) => {
                const hasUnreadMessages = !snapshot.empty;
                updateMessageDot(hasUnreadMessages);
            }
        );
    }
    
    function updateMessageDot(hasUnread) {
        const messageIcon = document.getElementById('messageIcon');
        if (messageIcon) {
            if (hasUnread) {
                messageIcon.classList.add('red-dot'); // Show red dot if there are unread messages
            } else {
                messageIcon.classList.remove('red-dot'); // Remove red dot if no unread messages
            }
        }
    }
    
    // Initialize the listener after the user is authenticated
    document.addEventListener("DOMContentLoaded", () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                initializeMessageListener();
            }
        });
    });
    
    window.ViewTrainerInfo = async function(trainerId) {
        try {
            const userId = await getCurrentUserId(); // Get userId from the Users collection
            const gymName = document.getElementById('modalGymName').innerText; // Get gym name from GymProfile card
            const membershipApproved = await checkMembershipStatus(userId, gymName);
    
            console.log("Membership status approved:", membershipApproved); // Debug log
    
            if (!membershipApproved) {
                Swal.fire({
                    icon: 'error',
                    title: 'Booking Not Allowed',
                    text: "⚠️ You cannot book a trainer until you apply for our plan and get it approved.",
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33',
                    background: '#fff',
                });
                return;
            }
    
            $('#gymProfileModal').modal('hide');
    
            const trainerDocRef = doc(db, 'Trainer', trainerId);
            const trainerDoc = await getDoc(trainerDocRef);
    
            if (trainerDoc.exists()) {
                const trainerData = trainerDoc.data();
    
                if (trainerData.status === "Under Review") {
                    showToast("error", "This trainer is currently under review and cannot be booked.");
                    return;
                }
    
                // Format the trainer rate to two decimal places
                function formatRate(rate) {
                    return '₱' + parseFloat(rate).toFixed(2); // Ensure two decimal places
                }
    
                // Populate the trainer modal with fetched data
                document.getElementById('modalTrainerName').innerText = trainerData.username || 'N/A';
                document.getElementById('modalTrainerPhoto').src = trainerData.TrainerPhoto || 'default-trainer-photo.jpg';
                document.getElementById('modalTrainerExpertise').innerText = trainerData.Expertise || 'N/A';
                document.getElementById('modalTrainerExperience').innerText = trainerData.Experience || 'N/A';
                document.getElementById('modalTrainerDays').innerText = trainerData.Days || 'N/A';
                document.getElementById('modalTrainerRate').innerText = formatRate(trainerData.rate || '0'); // Default to '0' if rate is not available
    
                // Trainer rating section
                const trainerRatingContainer = document.getElementById('trainerRatingContainer');
                if (!trainerRatingContainer) {
                    console.error("Trainer rating container not found in the DOM.");
                    return;
                }
    
                await displayTrainerRating(trainerId, trainerRatingContainer);
    
                // Attach trainer ID to the submit rating button
                const submitRatingButton = document.getElementById("submitRatingButton");
                if (submitRatingButton) {
                    submitRatingButton.setAttribute("data-trainer-id", trainerId);
                }
    
                // Book Now button logic
                document.getElementById('bookNowButton').onclick = function() {
                    $('#trainerProfileModal').modal('hide');
                    showBookingConfirmation(trainerData, trainerId, userId, gymName);
                };
    
                // Show the trainer profile modal
                $('#trainerProfileModal').modal('show');
            } else {
                showToast("error", "Trainer not found.");
            }
        } catch (error) {
            console.error("Error fetching trainer data:", error);
            showToast("error", "An error occurred while fetching trainer data.");
        }
    };
    window.showBookingConfirmation = async function (trainerData, trainerId) {
        const confirmTrainerName = document.getElementById('confirmTrainerName');
        const confirmTrainerRate = document.getElementById('confirmTrainerRate');
        const confirmBookingButton = document.getElementById('confirmBookingButton');
        const bookNowTrainerButton = document.getElementById('BookNowTrainer');
        
        const gymName = document.getElementById('modalGymName') 
            ? document.getElementById('modalGymName').innerText 
            : "Default Gym";
        const price = trainerData?.rate || '0';
    
        function formatRate(rate) {
            return '₱' + parseFloat(rate).toFixed(2);
        }
    
        let email = '';
        let fullName = '';
        let userId = '';
    
        try {
            // Ensure user is authenticated
            const authUser = auth.currentUser;
    
            if (!authUser) {
                throw new Error("No authenticated user found.");
            }
    
            console.log("Fetching userId for UID:", authUser.uid);
            
            // Step 1: Fetch userId from Firestore using uid
            const userDocRef = doc(db, 'Users', authUser.uid);
            const userDoc = await getDoc(userDocRef);
    
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userId = userData?.userId;
    
                if (!userId) {
                    throw new Error("UserId not found in Firestore document.");
                }
    
                console.log("UserId found:", userId);
    
                email = userData?.email || authUser.email || 'N/A';
                fullName = userData?.username || authUser.displayName || 'Unknown User';
            } else {
                throw new Error("User document does not exist in Firestore.");
            }
    
            const emailInput = document.getElementById('userEmail');
            const nameInput = document.getElementById('username');
            
            if (emailInput && nameInput) {
                emailInput.value = email;
                nameInput.value = fullName;
            } else {
                console.error("Form inputs not found.");
            }
    
        } catch (error) {
            console.error("Error fetching user details:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'An unexpected error occurred.',
            });
            return;
        }
    
        // Update modal content
        confirmTrainerName.innerText = trainerData?.username || "Unknown Trainer";
        confirmTrainerRate.innerText = formatRate(price);
    
        // Show the booking modal
        if (confirmBookingButton) {
            confirmBookingButton.onclick = function () {
                $('#bookingConfirmationModal').modal('hide');
                $('#bookingTrainerModal').modal('show');
            };
        }
    
        if (bookNowTrainerButton) {
            bookNowTrainerButton.onclick = async function () {
                try {
                    const bookingDateInput = document.getElementById('date');
                    const messageInput = document.getElementById('message');
                    const bookingDate = bookingDateInput.value.trim();
                    const message = messageInput?.value.trim() || "";
    
                    if (!bookingDate) {
                        showToast("error", "Please select a booking date.");
                        return;
                    }
    
                    // Check if the user already has a booking for the same trainer and date
                    const existingBookingQuery = query(
                        collection(db, 'Reservations'),
                        where('userId', '==', userId),
                        where('trainerId', '==', trainerId),
                        where('bookingDate', '==', bookingDate),
                        where('status', 'in', ['Pending', 'Active'])  // Check for active or pending bookings
                    );
                    const existingBookingSnapshot = await getDocs(existingBookingQuery);
    
                    if (!existingBookingSnapshot.empty) {
                        // If there's already a booking for this trainer on this date, prevent booking
                        Swal.fire({
                            icon: 'error',
                            title: 'Booking Conflict',
                            text: `You already have an active or pending booking with ${trainerData?.username || "this trainer"} on ${bookingDate}. Please choose a different date.`,
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#3085d6'
                        });
                        return; // Stop further processing
                    }
    
                    $('#bookingTrainerModal').modal('hide');
    
                    const reservationData = {
                        username: trainerData?.username || "Unknown Trainer",
                        trainerId: trainerId,
                        gymName: gymName,
                        userId: userId,
                        rate: price,
                        fullName: fullName,
                        bookingDate: bookingDate,
                        email: email,
                        message: message,
                        status: 'Pending',
                        timestamp: new Date().toISOString()
                    };
    
                    await saveToReservationCollection(reservationData);
    
                    // Send notification to trainer
                    const notificationMessage = `Booked a session with ${trainerData?.username || "Unknown Trainer"}`;
                    const notificationData = {
                        notificationId: Date.now().toString(),
                        username: trainerData?.username || "Unknown Trainer",
                        gymName: gymName,
                        price: price || "N/A",
                        bookingDate: bookingDate,
                        status: "Pending",
                        email: email
                    };
    
                    await saveNotificationToDatabase(notificationMessage, userId, "Booking_trainer", notificationData);
                    
                    const memberNotification = {
                        userId: trainerId,  // Notify the trainer using trainerId
                        username: trainerData?.username,  // Trainer's username
                        customerUsername: fullName,       // Customer's username (full name)
                        customerEmail: email,             // Customer's email
                        gymName: gymName,
                        message: `A customer has made a reservation!`,
                        timestamp: new Date().toISOString(),
                        status: 'Unread',
                        type: "Booking"
                    };
                    await addDoc(collection(db, 'TrainerNotif'), memberNotification);
                    console.log('Trainer notification saved successfully.');
    
                    showToast("success", `Successfully booked a session with ${trainerData?.username || "Unknown Trainer"}!`);
    
                    // Update notifications for user
                    fetchNotifications(userId);
    
                } catch (error) {
                    console.error("Error booking trainer:", error);
                    showToast("error", "Failed to book the trainer. Please try again.");
                }
            };
        }
    
        $('#bookingConfirmationModal').modal('show');
    };
    
    
    
    
        
        async function saveTrainerNotification(trainerId, userName) {
            try {
                const notificationData = {
                    trainerId: trainerId,
                    message: `${userName} has booked a session with you. Please check your schedule and prepare accordingly.`,
                    timestamp: new Date().toISOString()
                };
                // Simulate saving to the fetchTrainerNotifications collection
                await saveToDatabase('fetchTrainerNotifications', notificationData);
            } catch (error) {
                console.error("Error saving trainer notification:", error);
            }
        }
        
    
    // Function to display trainer ratings with dynamic star count updates
async function displayTrainerRating() {
    try {
        const ratingQuery = query(
            collection(db, "RatingAndFeedback"),
            where("username", "==", document.getElementById("modalTrainerName").innerText)
        );

        const ratingSnapshot = await getDocs(ratingQuery);

        let ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;
        let totalRatingsCount = 0;

        // Count ratings and calculate the total for average calculation
        ratingSnapshot.forEach(doc => {
            const data = doc.data();
            const rating = data.rating;

            if (ratingCounts.hasOwnProperty(rating)) {
                ratingCounts[rating] += 1;
                totalRating += rating;
                totalRatingsCount += 1;
            }
        });

        // Calculate the average rating (scaled to 10.0)
        const averageRating = totalRatingsCount > 0 ? ((totalRating / totalRatingsCount) * 2).toFixed(1) : 0;

        // Update the star counts
        for (let star = 5; star >= 1; star--) {
            const starCountElement = document.getElementById(`star-${star}-count`);
            if (starCountElement) {
                starCountElement.innerText = `(${ratingCounts[star]})`;
            }
        }

        // Update the overall rating (star rating in decimal format)
        const overallRatingElement = document.querySelector("#trainerRatingContainer .star-rating .star[data-value='average']");
        const overallRatingCountElement = document.getElementById("average-rating-count");

        if (overallRatingElement) {
            overallRatingElement.innerText = `★★★★★`;
        }

        if (overallRatingCountElement) {
            overallRatingCountElement.innerText = `(${totalRatingsCount})`;
        }

        // Display the average rating (scaled to 10.0) in the UI next to the stars
        const averageRatingElement = document.getElementById("average-rating-value");
        if (averageRatingElement) {
            averageRatingElement.innerText = `${averageRating}/10`; // Display as "9.8/10.0"
        }

    } catch (error) {
        console.error("Error fetching ratings:", error);
    }
}

    // Function to update star icons and rating count in a given container
    window. setTrainerRating = function(container, rating, ratingCount) {
        const stars = container.querySelectorAll('.star'); // Assuming stars are in the #trainerRating container
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
        // Display the rating count next to the stars
        const ratingCountContainer = container.querySelector('.rating-count');
        if (ratingCountContainer) {
            ratingCountContainer.innerText = `(${ratingCount})`;
        }
    }

    // Toggle function to show/hide the collapsible star rating section
    window.toggleRatings = function(event) {
        event.preventDefault();
        const collapsibleRatings = document.getElementById('collapsibleRatings');
        const toggleLink = document.getElementById('toggleRatings');
        
        if (collapsibleRatings.style.display === 'none') {
            collapsibleRatings.style.display = 'block';
            toggleLink.innerText = 'Show Less';
        } else {
            collapsibleRatings.style.display = 'none';
            toggleLink.innerText = 'Show More';
        }
    };
    document.addEventListener("DOMContentLoaded", function() {
        const auth = getAuth(); // Initialize Firebase Auth
        const rateTrainerButton = document.getElementById("rateTrainerButton");
        const rateStars = document.querySelectorAll("#rateStars .rate-star");
        let selectedRating = 0;
    
        // Check if the "Rate Trainer" button exists
        if (rateTrainerButton) {
            rateTrainerButton.addEventListener("click", function() {
                $('#rateTrainerModal').modal('show');
            });
        }
    
        // Set up star rating selection in the modal if stars exist
        if (rateStars.length > 0) {
            rateStars.forEach(star => {
                star.addEventListener("click", function() {
                    selectedRating = parseInt(this.getAttribute("data-value"));
                    updateStarSelection(selectedRating);
                });
            });
        } else {
            console.warn("No stars found for rating selection.");
        }
    
        // Function to highlight stars based on selection
        function updateStarSelection(rating) {
            if (rateStars.length === 0) {
                console.warn("rateStars array is empty or undefined.");
                return;
            }
            rateStars.forEach((star, index) => {
                star.classList.toggle("selected", index < rating);
            });
        }
    
        // Submit rating and update Firestore if the button exists
        const submitRatingButton = document.getElementById("submitRatingButton");
        if (submitRatingButton) {
            submitRatingButton.addEventListener("click", async function() {
                const feedbackText = document.getElementById("feedbackText").value;
                const authUser = auth.currentUser;
    
                if (!authUser) {
                    showToast("error", "Please log in to submit a rating.");
                    return;
                }
    
                // Get trainerId from the button's data attribute
                const trainerId = this.getAttribute("data-trainer-id");
                if (!trainerId) {
                    console.error("trainerId is not set. Cannot proceed with rating submission.");
                    showToast("error", "Trainer information is missing. Please try again.");
                    return;
                }
    
                try {
                    const gymNameElement = document.getElementById("modalGymName");
                    const gymName = gymNameElement ? gymNameElement.innerText : null;
    
                    if (!gymName) {
                        showToast("error", "Gym name not found in the profile. Please check the gym profile card.");
                        return;
                    }
    
                    // Retrieve the user document from Firestore
                    const userDocRef = doc(db, "Users", authUser.uid);
                    const userDoc = await getDoc(userDocRef);
    
                    if (!userDoc.exists()) {
                        showToast("error", "User data not found.");
                        return;
                    }
    
                    const userData = userDoc.data();
                    const userId = userData.userId;
    
                    // Ensure a rating is selected
                    if (selectedRating > 0) {
                        $('#rateTrainerModal').modal('hide');
    
                        // Save the rating and feedback to Firestore
                        const username = document.getElementById("modalTrainerName").innerText;
                        await addDoc(collection(db, "RatingAndFeedback"), {
                            userId: userId,
                            username: username,
                            gymName: gymName,
                            rating: selectedRating,
                            feedback: feedbackText,
                            timestamp: new Date().toISOString()
                        });
    
                        showToast("success", `You rated ${username} ${selectedRating} stars!`);
    
                        // Update the displayed rating in the main view
                        const trainerRatingContainer = document.getElementById("trainerRatingContainer");
                        await displayTrainerRating(trainerId, trainerRatingContainer);
    
                        // Reset selected rating and feedback field for next use
                        selectedRating = 0;
                        updateStarSelection(selectedRating);
                        document.getElementById("feedbackText").value = "";
    
                    } else {
                        alert("Please select a rating before submitting.");
                    }
                } catch (error) {
                    console.error("Error saving rating and feedback:", error);
                    showToast("error", "Failed to submit rating. Please try again.");
                }
            });
        }
    });
    


        // Function to fetch reserved dates for a specific trainer from Firestore
        async function getTrainerBookedDates(username) {
            const bookedDates = [];
            try {
                const transactionsQuery = query(
                    collection(db, "Reservations"),
                    where("username", "==", username)
                );
                const querySnapshot = await getDocs(transactionsQuery);

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.bookingDate && data.username === username) {
                        const date = data.bookingDate.toDate 
                            ? data.bookingDate.toDate().toISOString().split('T')[0] 
                            : data.bookingDate;

                        bookedDates.push({
                            title: 'Booked',
                            start: date,
                            color: '#4154f1',
                            textColor: '#ffa31a'
                        });
                    }
                });

                console.log("Fetched booked dates:", bookedDates); // Debug log
            } catch (error) {
                console.error("Error fetching booked dates:", error);
            }

            return bookedDates;
        }
        
        // Initialize FullCalendar with booked dates when the modal opens
        $('#calendarModal').on('shown.bs.modal', async function () {
            const username = document.getElementById('modalTrainerName').innerText.trim();
            const bookedDates = await getTrainerBookedDates(username);

            const calendarEl = document.getElementById('calendar');
            if (!calendarEl) {
                console.error("Calendar element not found!");
                return;
            }
            calendarEl.innerHTML = '';

            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                selectable: true,
                events: bookedDates,
                dateClick: function(info) {
                    const isBooked = bookedDates.some(event => event.start === info.dateStr);
                    if (isBooked) {
                        alert("This date is already booked. Please choose another date.");
                    } else {
                        $('#reservationDate').val(info.dateStr); // Set the selected date
                        $('#calendarModal').modal('hide'); // Close the modal after selecting a date
                    }
                },
                displayEventTime: false,
                eventContent: function(arg) {
                    let customEl = document.createElement('div');
                    customEl.style.color = '#f9f9f9';
                    customEl.style.fontWeight = 'bold';
                    customEl.style.textAlign = 'center';
                    customEl.textContent = arg.event.title;
                    return { domNodes: [customEl] };
                }
            });

            calendar.render();
            console.log("Calendar rendered with booked dates:", bookedDates); // Debug log
        });

        // Clear all fields when the modal is closed
        $('#calendarModal').on('hidden.bs.modal', function () {
            $('#calendar').html(''); // Clear calendar content to destroy the instance
            $('#reservationDate').val(''); // Clear the reservation date field
            $('#modalTrainerName').val(''); // Clear the trainer name field
        });

        

        // Function to fetch reservations and initialize the calendar for a specific trainer
            window. fetchAndDisplayReservations= async function (username) {
            try {
                // Query Firestore for reservations where trainerName matches
                const reservationsQuery = query(
                    collection(db, 'Reservations'),
                    where("username", "==", username)
                );
                const querySnapshot = await getDocs(reservationsQuery); // Await Firestore response

                // Prepare booked dates array based on matching reservations
                const bookedDates = [];
                querySnapshot.forEach((doc) => {
                    const reservationData = doc.data();

                    // Validate that the reservation's trainerName matches the modal's trainer name
                    if (reservationData.username === username) {
                        // Check if bookingDate is a Firestore Timestamp
                        let date;
                        if (reservationData.bookingDate.toDate) {
                            // Firestore Timestamp format - convert to date string
                            date = reservationData.bookingDate.toDate().toISOString().split('T')[0];
                        } else {
                            // Assume bookingDate is already in "YYYY-MM-DD" string format
                            date = reservationData.bookingDate;
                        }

                        bookedDates.push({
                            title: 'Booked',
                            start: date,
                            color: '#ff0000' // Red color for booked dates
                        });
                    }
                });

                console.log("Booked dates for trainer:", bookedDates); // Debug log

                // Initialize the calendar with booked dates for the specific trainer
                initializeTrainerCalendar(bookedDates);
            } catch (error) {
                console.error("Error fetching reservations data:", error);
            }
        }

      // Function to save data to the Reservations collection
    async function saveToReservationCollection(data) {
        try {
            // Add data to the "Reservations" collection
            await addDoc(collection(db, "Reservations"), data);
            console.log("Reservation saved successfully:", data);
        } catch (error) {
            console.error("Error saving to Reservations collection:", error);
            throw new Error("Could not save reservation. Please try again later.");
        }
    }
        // Global function to show the notification dot
        window.showNotificationDot = function() {
            const notificationDot = document.getElementById('messagesNotification');
            if (notificationDot) {
                notificationDot.style.display = 'inline-block';
                console.log("Notification dot is now visible.");
            } else {
                console.error("Notification dot element not found in the DOM.");
            }
        };

        // Event listener to hide the notification dot when the messages are viewed
        document.getElementById('messages').addEventListener('click', function() {
            const notificationDot = document.getElementById('messagesNotification');
            if (notificationDot) {
                notificationDot.style.display = 'none';
                console.log("Notification dot has been hidden.");
            }
        });
        // Save booking to Firestore Transactions collection
        async function saveBookingToDatabase(username, gymName, userId, price, type) {
            try {
                await addDoc(collection(db, "Transactions"), {
                    type : 'Booking_trainer',
                    username,
                    gymName,
                    userId,
                    price,
                    status: "Pending Approval",
                    timestamp: new Date()
                });
            } catch (error) {
                console.error("Error saving booking to Transactions collection:", error);
            }
        }

        // Save notification to Firestore Notifications collection
        async function saveNotificationToDatabase(message, userId, type, notificationData) {
            try {
                const dataToSave = {
                    message,
                    userId,
                    type,
                    timestamp: new Date().toISOString(),
                    notificationId: notificationData.notificationId || Date.now().toString(), // Generate a reference ID if not provided
                    price: notificationData.price || null, // Default to null if price is undefined
                    ...notificationData // Spread additional data provided
                };
        
                // Ensure there are no undefined values in dataToSave
                for (let key in dataToSave) {
                    if (dataToSave[key] === undefined) {
                        dataToSave[key] = null; // Replace undefined with null
                    }
                }
        
                await addDoc(collection(db, "Notifications"), dataToSave);
                console.log("Notification saved successfully:", dataToSave);
            } catch (error) {
                console.error("Error saving notification to Notifications collection:", error);
            }
        }
        
        
        
    function showToast(type, message) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            console.error("Toast container element 'toastContainer' not found in the DOM.");
            return; // Exit the function if toastContainer is not found
        }
    
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type === "success" ? "success" : "danger"} border-0`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("aria-atomic", "true");
    
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
    
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
    
        toast.addEventListener('hidden.bs.toast', () => {
            toastContainer.removeChild(toast);
        });
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
            
            // Function to toggle visibility of older notifications
            function toggleOlderNotifications() {
                const olderNotificationsDiv = document.getElementById('olderNotifications');
                const toggleButton = document.getElementById('toggleButton');
            
                if (olderNotificationsDiv.style.display === 'none') {
                    olderNotificationsDiv.style.display = 'block';
                    toggleButton.innerText = 'Hide Older Notifications';
                } else {
                    olderNotificationsDiv.style.display = 'none';
                    toggleButton.innerText = 'Show Older Notifications';
                }
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
            
                        // Create a div for older notifications to toggle visibility
                        const isOlder = (category === 'Older Notifications');
                        const notificationContainer = document.createElement('div');
                        notificationContainer.id = isOlder ? 'olderNotifications' : '';
                        notificationContainer.style.display = isOlder ? 'none' : 'block'; // Hide older notifications initially
            
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
            
                            notificationContainer.appendChild(notificationItem);
                        });
            
                        notificationList.appendChild(notificationContainer);
                    }
                }
            
                // Add toggle button for older notifications
                if (categorizedNotifications['Older Notifications'].length > 0) {
                    const toggleButton = document.createElement('button');
                    toggleButton.id = 'toggleButton';
                    toggleButton.classList.add('btn', 'btn-secondary', 'mt-2');
                    toggleButton.innerText = 'Show Older Notifications';
                    toggleButton.addEventListener('click', toggleOlderNotifications);
                    notificationList.appendChild(toggleButton);
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

                function showNotificationDetails(notification) {
                    const formatPrice = (price) => {
                        if (price == null || price === '') {
                            return 'N/A'; // Return 'N/A' for null, undefined, or empty values
                        }
                    
                        // Convert price to a string (if not already) and sanitize it
                        const numericPrice = parseFloat(
                            typeof price === 'string' ? price.replace(/[^\d.-]/g, '') : price
                        );
                    
                        // Return formatted price or 'N/A' if not a valid number
                        return !isNaN(numericPrice)
                            ? `₱${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A';
                    };                    
                    function formatDate(date) {
                        if (!date) return null; // Return null if the date is undefined or null
                        const parsedDate = new Date(date); // Parse the date
                        if (isNaN(parsedDate)) return null; // Return null for invalid dates
                    
                        // Array of month names
                        const monthNames = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                    
                        // Extract month, day, and year
                        const month = monthNames[parsedDate.getMonth()]; // Get month name
                        const day = String(parsedDate.getDate()).padStart(2, '0'); // Get day with leading zero
                        const year = parsedDate.getFullYear(); // Get full year (e.g., 2024)
                    
                        return `${month} ${day}, ${year}`;
                    }
                    
                    
                    let notificationContent = '';
                    let cancelButton = '';
                
                    if (notification.type === "Booking_trainer") {
                        notificationContent = `
                            <p class="gym-name">${notification.gymName || 'N/A'}</p>
                            <p class="ref-number"><strong>Ref. No:</strong> ${notification.notificationId || 'N/A'}</p>
                            <div class="product-info">
                                <p><strong>Trainer:</strong> ${notification.username || 'N/A'}</p>
                                <p><strong>Date:</strong> ${formatDate(notification.bookingDate) || 'N/A'}</p>
                                <p><strong>Rate:</strong> ${formatPrice(notification.price)}</p>
                                <p><strong>Status:</strong> ${notification.status || 'N/A'}</p>
                            </div>
                            <hr>
                            <p class="footer-info">Show this booking confirmation to the Gym owner upon arrival.</p>
                        `;
                        cancelButton = `
                            <div class="modal-footer">
                                <button class="btn btn-danger" id="cancelBookingButton">Cancel Booking</button>
                            </div>
                        `;
                    } else if (notification.type === "Products") {
                        notificationContent = `
                            <p class="gym-name">${notification.gymName || 'N/A'}</p>
                            <p class="ref-number"><strong>Ref. No:</strong> ${notification.notificationId || 'N/A'}</p>
                            <div class="product-info">
                                <p><strong>Product:</strong> ${notification.productName || 'N/A'}</p>
                                <p><strong>Quantity:</strong> ${notification.quantity || 'N/A'}</p>
                                <p><strong>Total Price:</strong> ${formatPrice(notification.totalPrice)}</p>
                                <p><strong>Status:</strong> ${notification.status || 'N/A'}</p>
                            </div>
                            <hr>
                            <p class="footer-info">Show this order list to the Gym owner upon collection.</p>
                        `;
                        cancelButton = `
                            <div class="modal-footer">
                                <button class="btn btn-danger" id="cancelPurchaseButton">Cancel Purchase</button>
                            </div>
                        `;
                    } 
                    else if (notification.type === "Day Pass") {
                        // Ensure both price and gymprice are valid numbers, defaulting to 0 if not valid
                        const price = parseFloat(notification.price) || 0;  // Default to 0 if not a valid number
                    
                        // Remove peso sign and any other non-numeric characters from gymprice, then parse it to float
                        const gymPrice = parseFloat(String(notification.gymprice).replace(/[^\d.-]/g, '')) || 0;  // Ensure it's a string before applying replace
                    
                        // Log values for debugging
                        console.log("Price: ", price);
                        console.log("Gym Price: ", gymPrice);
                    
                        // Calculate total price
                        const totalPrice = price + gymPrice;
                    
                        // Log the totalPrice for debugging
                        console.log("Total Price: ", totalPrice);
                    
                        // Prepare notification content
                        notificationContent = `
                            <p class="gym-name">${notification.gymName || 'N/A'}</p>
                            <p class="ref-number"><strong>Ref. No:</strong> ${notification.notificationId || 'N/A'}</p>
                            <div class="day-pass-info">
                                <p><strong>Date:</strong> ${formatDate(notification.Date) || 'N/A'}</p>
                                <p><strong>Total Price:</strong> ${formatPrice(totalPrice)}</p> <!-- Total Price Displayed here -->
                                <p><strong>Status:</strong> ${notification.status || 'N/A'}</p>
                            </div>
                            <hr>
                            <p class="footer-info">Present this receipt to the Gym reception.</p>
                        `;
                        
                        cancelButton = `
                            <div class="modal-footer">
                                <button class="btn btn-danger" id="cancelDayPassButton">Cancel Day Pass</button>
                            </div>
                        `;
                    }
                    
                     else {
                        notificationContent = `<p>No details available for this notification type.</p>`;
                    }
                
                    const notificationModal = `
                        <div class="modal fade" id="notificationDetailsModal" tabindex="-1" role="dialog" aria-labelledby="notificationDetailsLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="notificationDetailsLabel">
                                            ${notification.type === "Booking_trainer" ? "Booking Confirmation" :
                                            notification.type === "Products" ? "Purchased Product" :
                                            notification.type === "Day Pass" ? "Day Pass Confirmation" : "Notification"}
                                        </h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body" id="notificationDetailsContent">
                                        ${notificationContent}
                                    </div>
                                    ${cancelButton}
                                </div>
                            </div>
                        </div>
                    `;
                
                    document.body.insertAdjacentHTML('beforeend', notificationModal);
                    $('#notificationDetailsModal').modal('show');
                
                    if (notification.type === "Booking_trainer") {
                        document.getElementById('cancelBookingButton')?.addEventListener('click', () => {
                            $('#notificationDetailsModal').modal('hide');
                            showbookingConfirmationModal('Are you sure you want to cancel your booking?', async () =>
                                await cancelBooking(notification.userId)
                            );
                        });
                
                    } else if (notification.type === "Products") {
                        document.getElementById('cancelPurchaseButton')?.addEventListener('click', () => {
                            $('#notificationDetailsModal').modal('hide');
                            showproductConfirmationModal('Are you sure you want to cancel this purchase?', async () =>
                                await cancelPurchase(notification.userId)
                            );
                        });
                
                    } else if (notification.type === "Day Pass") {
                        document.getElementById('cancelDayPassButton')?.addEventListener('click', () => {
                            $('#notificationDetailsModal').modal('hide');
                            showDayPassConfirmationModal('Are you sure you want to cancel this day pass?', async () =>
                                await cancelDayPass(notification.userId)
                            );
                        });
                    }
                
                    $('#notificationDetailsModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                function showbookingConfirmationModal(bookmessage, onConfirm) {
                    const confirmationModal = `
                        <div class="modal fade" id="bookingconfirmationModal" tabindex="-1" role="dialog" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="confirmationModalLabel">Confirmation</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>${bookmessage}</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                        <button class="btn btn-danger" id="confirmBookingActionButton">Yes, Proceed</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', confirmationModal);
                    $('#bookingconfirmationModal').modal('show');
                
                    document.getElementById('confirmBookingActionButton').addEventListener('click', async () => {
                        try {
                            showSpinner(); // Show the spinner
                            await onConfirm(); // Execute the confirm action
                        } catch (error) {
                            console.error('Error during confirmation:', error);
                        } finally {
                            hideSpinner(); // Hide the spinner after completion
                            $('#bookingconfirmationModal').modal('hide');
                        }
                    });
                
                    $('#bookingconfirmationModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                
                function showproductConfirmationModal(productmessage, onConfirm) {
                    const confirmationModal = `
                        <div class="modal fade" id="productconfirmationModal" tabindex="-1" role="dialog" aria-labelledby="confirmationModalLabel" aria-hidden="true">
                            <div class="modal-dialog modal-dialog-centered" role="document">
                                <div class="modal-content">
                                    <div class="modal-header">
                                        <h5 class="modal-title" id="confirmationModalLabel">Confirmation</h5>
                                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <p>${productmessage}</p>
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                                        <button class="btn btn-danger" id="confirmProductActionButton">Yes, Proceed</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', confirmationModal);
                    $('#productconfirmationModal').modal('show');
                
                    // Add event listener for the confirmation button
                    document.getElementById('confirmProductActionButton').addEventListener('click', async () => {
                        try {
                            showSpinner(); // Show the spinner while processing
                            await onConfirm(); // Execute the provided action
                        } catch (error) {
                            console.error('Error during product confirmation:', error);
                        } finally {
                            hideSpinner(); // Hide the spinner after the action is complete
                            $('#productconfirmationModal').modal('hide');
                        }
                    });
                
                    // Remove modal from the DOM once it's hidden
                    $('#productconfirmationModal').on('hidden.bs.modal', function () {
                        this.remove();
                    });
                }
                async function cancelPurchase(userId) {                
                                try {
                                    console.log(`Attempting to cancel purchase for user ID: ${userId}`);
                                    showSpinner(); // Show spinner during processing
                
                                    // Step 1: Fetch the notification for the purchase
                                    console.log('Fetching notifications for purchase cancellation...');
                                    const notificationsQuery = query(
                                        collection(db, "Notifications"),
                                        where("userId", "==", userId),
                                        where("type", "==", "Products")
                                    );
                
                                    const notificationsSnapshot = await getDocs(notificationsQuery);
                
                                    if (notificationsSnapshot.empty) {
                                        console.warn(`No purchase notifications found for user ID ${userId}.`);
                                        throw new Error(`No purchase found for user ID ${userId}.`);
                                    }
                
                                    // Update the first matching notification
                                    const notificationDocRef = notificationsSnapshot.docs[0].ref;
                                    await updateDoc(notificationDocRef, { status: "Cancelled" });
                                    console.log('Notification status updated to "Cancelled".');
                
                                    // Step 2: Fetch the transaction for the purchase
                                    console.log('Fetching transactions for purchase cancellation...');
                                    const transactionsQuery = query(
                                        collection(db, "Transactions"),
                                        where("userId", "==", userId),
                                        where("type", "==", "Products")
                                    );
                
                                    const transactionsSnapshot = await getDocs(transactionsQuery);
                
                                    if (transactionsSnapshot.empty) {
                                        console.warn(`No product transactions found for user ID ${userId}.`);
                                        throw new Error(`No transaction found for user ID ${userId}.`);
                                    }
                
                                    // Update the first matching transaction
                                    const transactionDocRef = transactionsSnapshot.docs[0].ref;
                                    await updateDoc(transactionDocRef, { status: "Cancelled" });
                                    console.log('Transaction status updated to "Cancelled".');
                
                                    // Step 3: Success message and UI updates
                                    showToast("success", "Product purchase successfully cancelled.");
                                    $('#notificationDetailsModal').modal('hide');
                                } catch (error) {
                                    console.error('Error during purchase cancellation:', error);
                                    showToast("error", `Failed to cancel purchase: ${error.message}`);
                                }
                            }
                        
                    
                    
                
                
                
                async function cancelBooking(userId) {
                    try {
                        console.log(`Attempting to cancel booking for user ID: ${userId}`);
                
                        // Query the Notifications collection
                        const notificationsQuery = query(
                            collection(db, "Notifications"),
                            where("userId", "==", userId),
                            where("type", "==", "Booking_trainer")
                        );
                
                        const notificationsSnapshot = await getDocs(notificationsQuery);
                
                        if (notificationsSnapshot.empty) {
                            console.warn(`No booking notifications found for user ID ${userId}.`);
                            throw new Error(`No booking found for user ID ${userId}.`);
                        }
                
                        // Update the first matching notification
                        const notificationDocRef = notificationsSnapshot.docs[0].ref;
                        await updateDoc(notificationDocRef, { status: "Cancelled" });
                        console.log('Notification status updated to "Cancelled".');
                
                        // Query the Transactions collection
                        const transactionsQuery = query(
                            collection(db, "Transactions"),
                            where("userId", "==", userId),
                            where("type", "==", "Booking_trainer")
                        );
                
                        const transactionsSnapshot = await getDocs(transactionsQuery);
                
                        if (transactionsSnapshot.empty) {
                            console.warn(`No booking transactions found for user ID ${userId}.`);
                            throw new Error(`No transaction found for user ID ${userId}.`);
                        }
                
                        // Update the first matching transaction
                        const transactionDocRef = transactionsSnapshot.docs[0].ref;
                        await updateDoc(transactionDocRef, { status: "Cancelled" });
                        console.log('Transaction status updated to "Cancelled".');
                
                        showToast("success", "Booking successfully cancelled.");
                        $('#notificationDetailsModal').modal('hide');
                    } catch (error) {
                        console.error("Error cancelling booking:", error);
                        showToast("error", `Failed to cancel booking: ${error.message}`);
                    }
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
                fetchGymCoordinates();
            // Fetch trainers when the page loads
    });

    window.closeMembershipPlansModal = function() {
        const modalElement = document.getElementById('membershipPlansModal');
        if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.hide();  // Use Bootstrap's modal API to hide the modal
        } else {
            console.error('Membership Plans modal element not found');
        }
    };
    
    
// Example function to send a message
window.sendMessage = function () {
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
    navLink.addEventListener('click', function (event) {
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
    button.addEventListener('click', function (event) {
        showSpinner();

        // Simulate loading with a 2-second delay
        setTimeout(() => {
            hideSpinner();
        }, 1500); // 2 seconds delay
    });
});

// Event delegation to handle dynamically generated elements like product cards, membership plans, and view-more buttons
document.addEventListener('click', function (event) {
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

let currentChatUserId = null;
let messagesCache = []; // Cache for messages
const userCache = {}; // Cache for user details to reduce database calls
const unreadMessages = new Set(); // Track unread messages

// Initialize the chat modal and clear previous chats
document.querySelector('a[href="#chatModal"]').addEventListener('click', async function (event) {
    event.preventDefault();
    const chatModal = new bootstrap.Modal(document.getElementById('chatModal'));
    chatModal.show();
    document.querySelector('#usersContainer').innerHTML = '';
    document.querySelector('#inboxContainer').innerHTML = '';

    // Load inbox messages
    await loadInboxMessages();
});

// Fetch all users for searching
async function fetchUsers(searchTerm = '') {
    const userQuery = query(
        collection(db, 'Users'),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
    );
    try {
        const querySnapshot = await getDocs(userQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'user' }));
    } catch (error) {
        console.error("Error fetching users: ", error);
        return [];
    }
}

async function fetchTrainers(searchTerm = '') {
    const trainerQuery = query(
        collection(db, 'Trainer'),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
    );
    try {
        const querySnapshot = await getDocs(trainerQuery);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'trainer' }));
    } catch (error) {
        console.error('Error fetching trainers: ', error);
        return [];
    }
}

// Combined function to search both Users and Trainers collections
async function searchAllCollections(searchTerm) {
    try {
        const [users, trainers] = await Promise.all([
            fetchUsers(searchTerm),
            fetchTrainers(searchTerm),
        ]);
        return [...users, ...trainers]; // Merge results from both collections
    } catch (error) {
        console.error('Error searching collections:', error);
        return [];
    }
}

// Display trainers and users in the search result
function displaySearchResults(results) {
    const searchResultsContainer = document.querySelector('#searchResultsContainer');
    const inboxContainer = document.querySelector('#inboxContainer');

    searchResultsContainer.innerHTML = ''; // Clear previous search results

    // Limit to a certain number of results displayed
    const maxDisplayCount = 5; // Set the maximum number of results to display

    // Display only the first maxDisplayCount trainers and users
    results.slice(0, maxDisplayCount).forEach(result => {
        const resultElement = document.createElement('div');
        resultElement.className = 'result-item';
        resultElement.innerHTML = `
            <img src="${result.TrainerPhoto || result.photoURL || 'default-profile.png'}" alt="User Photo" class="result-photo">
            <div class="result-details">
                <p class="result-name">${result.username || result.username || 'Unknown'}</p>
                <p class="result-email">${result.TrainerEmail || result.email}</p>
            </div>
        `;

        resultElement.addEventListener('click', async () => {
            startChat(result.id, result.username || result.username || result.email);
            searchResultsContainer.innerHTML = ''; // Clear search results
            searchResultsContainer.style.display = 'none'; // Hide search results
            inboxContainer.style.display = 'block'; // Show inbox
            await loadInboxMessages(); // Reload inbox messages
        });

        searchResultsContainer.appendChild(resultElement); // Append to search results
    });

    // Show search results only if there are trainers or users found
    searchResultsContainer.style.display = results.length > 0 ? 'block' : 'none';
}

window.searchTrainers = async function (searchTerm) {
    const inboxContainer = document.getElementById('inboxContainer');
    const searchResultsContainer = document.getElementById('searchResultsContainer');

    // If the search term is empty, clear search results, show inbox, and reload inbox messages
    if (!searchTerm.trim()) {
        searchResultsContainer.innerHTML = ''; // Clear search results
        searchResultsContainer.style.display = 'none'; // Hide search results container
        inboxContainer.style.display = 'block'; // Show inbox container
        await loadInboxMessages(); // Reload inbox messages to restore the original inbox content
        return;
    }

    // If there's a search term, perform the search and display results
    const results = await searchAllCollections(searchTerm); // Fetch users and trainers
    displaySearchResults(results); // Display results
};

        // Start a chat with a selected trainer
        function startChat(trainerId, username) {
            if (currentChatUserId === trainerId) return; // Prevent reloading the same chat
            currentChatUserId = trainerId;
        
            document.getElementById('chatWith').textContent = `${username}`;
            document.querySelector('#searchInput').value = username;
        
            const messagesContainer = document.querySelector('#messagesContainer');
            messagesContainer.innerHTML = ''; // Clear previous chat messages
        
            document.getElementById('chatHeader').style.display = 'block';
            document.getElementById('messagesContainer').style.display = 'block';
            document.getElementById('messageInputContainer').style.display = 'block';
        
            // Mark messages from this trainer as read
            unreadMessages.forEach(messageId => {
                if (messageId.startsWith(currentChatUserId)) {
                    unreadMessages.delete(messageId);
                }
            });
        
            loadMessages(); // Load messages for the selected chat
        }
        
        async function getUserDetails(userId) {
            // Return cached data if available
            if (userCache[userId]) {
                return userCache[userId];
            }
        
            try {
                const trainerRef = doc(db, 'Trainer', userId); // Reference to Trainer collection
                const trainerSnap = await getDoc(trainerRef);
        
                if (trainerSnap.exists()) {
                    const trainerData = trainerSnap.data();
        
                    // Check if TrainerPhoto exists directly in Firestore
                    if (trainerData.TrainerPhoto) {
                        console.log(`Found TrainerPhoto in Firestore for user: ${userId}`);
                        userCache[userId] = trainerData; // Cache trainer data with Firestore TrainerPhoto
                        return trainerData; // Return data directly if TrainerPhoto exists
                    } else {
                        // Log warning if no TrainerPhoto found
                        console.warn(`No TrainerPhoto found for user: ${userId}`);
                        trainerData.TrainerPhoto = null; // Explicitly set to null if no photo is found
                    }
        
                    // Cache and return trainer data
                    userCache[userId] = trainerData;
                    return trainerData;
                } else {
                    console.warn("No trainer found for ID:", userId);
                    return null;
                }
            } catch (error) {
                console.error("Error fetching trainer details:", error);
                return null;
            }
        }
        
        
        
        
        let unsubscribeSentMessages = null;
        let unsubscribeReceivedMessages = null;
        
        async function loadMessages() {
            const userId = auth.currentUser.uid;
            const messagesContainer = document.querySelector('#messagesContainer');
        
            // Clear previous listeners if they exist
            if (unsubscribeSentMessages) unsubscribeSentMessages();
            if (unsubscribeReceivedMessages) unsubscribeReceivedMessages();
        
            // Real-time listener for sent messages
            const sentMessagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', userId),
                where('to', '==', currentChatUserId),
                orderBy('timestamp')
            );
        
            // Real-time listener for received messages
            const receivedMessagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', currentChatUserId),
                where('to', '==', userId),
                orderBy('timestamp')
            );
        
            // Clear message cache and container
            messagesCache = [];
            messagesContainer.innerHTML = '';
        
            // Render messages in real-time
            const renderMessages = (messages) => {
                messages.forEach(async (messageData) => {
                    if (!messagesCache.some(msg => msg.id === messageData.id)) {
                        messagesCache.push(messageData); // Cache message to avoid duplicates
                        const fromUser = await getUserDetails(messageData.from);
                        const isSelf = messageData.from === userId;
        
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message ' + (isSelf ? 'self' : 'other');
        
                        const avatarElement = document.createElement('div');
                        avatarElement.className = 'avatar';
        
                        if (fromUser?.TrainerPhoto) {
                            const avatarImage = document.createElement('img');
                            avatarImage.src = fromUser.TrainerPhoto;
                            avatarImage.alt = `${fromUser.username}'s avatar`;
                            avatarImage.style.width = '30px';
                            avatarImage.style.height = '30px';
                            avatarImage.style.borderRadius = '50%';
                            avatarElement.appendChild(avatarImage);
                        } else {
                            avatarElement.textContent = isSelf ? 'You' : (fromUser ? fromUser.username[0].toUpperCase() : '?');
                        }
        
                        const messageContent = document.createElement('div');
                        messageContent.className = 'message-content ' + (isSelf ? 'self' : 'other');
                        messageContent.textContent = messageData.message;
        
                        const timestamp = document.createElement('span');
                        timestamp.className = 'timestamp';
                        timestamp.textContent = messageData.timestamp.toDate().toLocaleTimeString();
        
                        messageContent.appendChild(timestamp);
        
                        if (isSelf) {
                            messageElement.appendChild(messageContent);
                            messageElement.appendChild(avatarElement);
                        } else {
                            messageElement.appendChild(avatarElement);
                            messageElement.appendChild(messageContent);
                        }
        
                        messagesContainer.appendChild(messageElement);
                    }
                });
        
                // Auto-scroll to the latest message
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            };
        
            // Add listeners
            unsubscribeSentMessages = onSnapshot(sentMessagesQuery, (snapshot) => {
                const sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderMessages(sentMessages);
            });
        
            unsubscribeReceivedMessages = onSnapshot(receivedMessagesQuery, (snapshot) => {
                const receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderMessages(receivedMessages);
            });
        }
        async function loadInboxMessages() {
            const userId = auth.currentUser.uid; // Get the ID of the currently logged-in user
            const inboxContainer = document.getElementById('inboxContainer');
            inboxContainer.innerHTML = ''; // Clear the inbox
        
            // Query to get messages where the current user is either the sender or receiver
            const messagesQuery = query(
                collection(db, 'Messages'),
                where('from', '==', userId), // Messages sent by the user
                orderBy('timestamp', 'desc')
            );
        
            const receivedMessagesQuery = query(
                collection(db, 'Messages'),
                where('to', '==', userId), // Messages received by the user
                orderBy('timestamp', 'desc')
            );
        
            try {
                // Fetch the sent and received messages
                const sentMessagesSnapshot = await getDocs(messagesQuery);
                const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);
        
                // Map to store the latest message for each unique user
                const recentMessages = new Map();
        
                // Process the sent messages
                sentMessagesSnapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const otherUserId = messageData.to;
        
                    // Update the recentMessages map if it's a new message or has a more recent timestamp
                    if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                        recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                    }
                });
        
                // Process the received messages
                receivedMessagesSnapshot.forEach((doc) => {
                    const messageData = doc.data();
                    const otherUserId = messageData.from;
        
                    // Update the recentMessages map if it's a new message or has a more recent timestamp
                    if (!recentMessages.has(otherUserId) || recentMessages.get(otherUserId).timestamp < messageData.timestamp) {
                        recentMessages.set(otherUserId, { ...messageData, docId: doc.id });
                    }
                });
        
                // If no messages were found, display a 'no conversation' message
                if (recentMessages.size === 0) {
                    const noConversationMessage = document.createElement('div');
                    noConversationMessage.className = 'no-conversation-message';
                    noConversationMessage.textContent = 'No Conversations Available';
                    inboxContainer.appendChild(noConversationMessage);
                    return; // Exit if no messages are available
                }
        
                // Display each recent message in the inbox
                for (const [otherUserId, messageData] of recentMessages.entries()) {
                    const otherUser = await getUserDetails(otherUserId); // Get user details
        
                    // Check if otherUser is null or undefined
                    if (!otherUser) {
                        console.warn(`User details not found for userId: ${otherUserId}`);
                        continue; // Skip this entry if user details are missing
                    }
        
                    // Fallback for missing photo and username/email
                    const photoURL = otherUser.TrainerPhoto || 'default-photo-url';
                    const userName = otherUser.username || otherUser.email || 'Unknown User';
        
                    // Debugging: Log user details to identify missing fields
                    console.log("User Details:", otherUser);
        
                    // Create a new inbox item
                    // Create inbox item dynamically
                    const inboxItem = document.createElement('div');
                    inboxItem.className = 'inbox-item';

                    // Populate the inbox with message and user details
                    inboxItem.innerHTML = `
                        <img src="${photoURL}" alt="User Photo" class="inbox-user-photo">
                        <div class="inbox-user-details">
                            <span class="user-name">${userName}</span>
                            <span class="user-message">${messageData.message}</span>
                        </div>
                    `;

                    // Apply bold for unread messages
                    if (messageData.status === 'Unread') {
                        inboxItem.classList.add('bold');  // Add bold class
                    }

                    // Event listener to handle clicks (mark as read)
                    inboxItem.addEventListener('click', async () => {
                        startChat(otherUserId, userName);
                        inboxItem.classList.remove('bold');  // Remove bold when clicked
                        displayChatHeader(otherUser);

                        // Update Firestore to mark the message as read
                        try {
                            const messageRef = doc(db, 'Messages', messageData.docId);
                            await updateDoc(messageRef, { status: 'Read' });  // Set status to 'Read'
                            console.log('Message marked as read');
                        } catch (error) {
                            console.error('Error updating message status:', error);
                        }
                    });

        
                    // Append the inbox item to the container
                    inboxContainer.appendChild(inboxItem);
                }
            } catch (error) {
                console.error("Error fetching inbox messages:", error);
            }
        }
        
        
        

        // Call loadInboxMessages when the chat modal is opened
        document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);

        function displayChatHeader(user) {
            document.getElementById('chatHeader').style.display = 'flex';
            document.getElementById('chatWith').textContent = user.username || user.email;
            document.getElementById('chatUserPhoto').src = user.TrainerPhoto || 'default-profile.png'; // Display user photo or a default if unavailable
            document.getElementById('messagesContainer').style.display = 'block';
            document.getElementById('messageInputContainer').style.display = 'block';
        }
        
        // Send a message
        async function sendMessage() {
            const messageInput = document.querySelector('#messageInput');
            const messageText = messageInput.value.trim();
            if (messageText && currentChatUserId) {
                const userId = auth.currentUser.uid;
                try {
                    await addDoc(collection(db, 'Messages'), {
                        from: userId,
                        to: currentChatUserId,
                        message: messageText,
                        timestamp: new Date(), // Firebase.Timestamp can also be used
                        status: "Unread"
                    });
                    messageInput.value = ''; // Clear input
                } catch (error) {
                    console.error("Error sending message: ", error);
                }
            }
        }
        
        
        
        // Event listener for the search input
        document.querySelector('#searchInput').addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            searchTrainers(searchTerm);
        });
        
        // Event listener for the send message button
        document.getElementById('sendMessageButton').addEventListener('click', sendMessage);

        // Bind Enter key press to send a message as well
    document.getElementById('messageInput').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage(event);
        }
        });
        
        // Load inbox messages when the chat modal is opened
        document.querySelector('a[href="#chatModal"]').addEventListener('click', loadInboxMessages);
        
      // Add toggle functionality for the menu
    document.addEventListener('DOMContentLoaded', function () {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        menuToggle.addEventListener('click', function () {
            menuToggle.classList.toggle('active'); // Animate the bars
            sidebar.classList.toggle('open'); // Toggle the sidebar visibility
        });

        // Optional: Close sidebar when clicking outside
        document.addEventListener('click', function (event) {
            if (!menuToggle.contains(event.target) && !sidebar.contains(event.target)) {
                menuToggle.classList.remove('active');
                sidebar.classList.remove('open');
            }
        });
});

let unsubscribeUnreadListener;  // Store the listener reference globally

// Listen for clicks on inbox items and mark messages as read
document.addEventListener('click', async (event) => {
    const inboxItem = event.target.closest('.inbox-item');

    if (inboxItem) {
        const userId = auth.currentUser?.uid;
        if (userId) {
            await markAllMessagesAsRead(userId);
        }
    }
});

// Mark all unread messages as read (Batch Update)
async function markAllMessagesAsRead(userId) {
    try {
        const messagesRef = collection(db, 'Messages');
        const querySnapshot = await getDocs(
            query(messagesRef, where('to', '==', userId), where('status', '==', 'Unread'))
        );

        if (querySnapshot.empty) {
            console.log('No unread messages.');
            return;
        }

        // Detach the current snapshot listener
        if (unsubscribeUnreadListener) {
            unsubscribeUnreadListener();
        }

        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
            const messageRef = docSnapshot.ref;
            batch.update(messageRef, { status: 'Read' });
        });

        await batch.commit();
        console.log('All messages marked as read.');

        // Update the UI immediately
        updateMessageNotification(0);

        // Re-attach the listener to reflect the latest state
        listenForUnreadMessages(userId);

    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Real-time listener for unread messages
function listenForUnreadMessages(userId) {
    const messagesRef = collection(db, 'Messages');

    unsubscribeUnreadListener = onSnapshot(
        query(messagesRef, where('to', '==', userId), where('status', '==', 'Unread')),
        (snapshot) => {
            const unreadCount = snapshot.size;
            updateMessageNotification(unreadCount);  // Update unread count in real-time
        },
        (error) => {
            console.error('Error listening for unread messages:', error);
        }
    );
}

// Update unread message count in UI
function updateMessageNotification(unreadCount) {
    const messageNotificationElement = document.getElementById('messagesNotification');

    if (unreadCount > 0) {
        messageNotificationElement.textContent = unreadCount;
        messageNotificationElement.style.display = 'flex';
    } else {
        messageNotificationElement.style.display = 'none';
    }
}

// Start listener when user logs in
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            listenForUnreadMessages(user.uid);
        }
    });
});


document.getElementById('dayPassForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const calendarDate = document.getElementById('calendarDate').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!calendarDate || !email || selectedServices.length === 0) {
        return;
    }

    try {
        await addDoc(collection(db, 'DayPasses'), {
            calendarDate,
            email,
            selectedServices,
            totalPrice: totalServicePrice.toFixed(2),
            status: 'Pending'
        });

        $('#dayPassModal').modal('hide');
    } catch (error) {
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    const userId = await getCurrentUserId();

    if (userId) {
        try {
            // Query the Users collection for the logged-in user by userId
            const userQuery = query(collection(db, 'Users'), where("userId", "==", userId));
            const querySnapshot = await getDocs(userQuery);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];  // Assume the first matching document
                const userEmail = userDoc.data().email;

                // Populate email field and disable it
                const emailField = document.getElementById("email");
                emailField.value = userEmail;
                emailField.setAttribute("readonly", true);  // Make email field non-editable
            } else {

            }
        } catch (error) {
        }
    } else {
    }
});

document.addEventListener("DOMContentLoaded", async function () {
    const dayPassForm = document.getElementById("dayPassForm");

    if (dayPassForm) {
        dayPassForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const selectedDate = document.getElementById("calendarDate").value;
            const price = document.getElementById("dynamicPrice").innerText;
            const gymName = document.getElementById("modalGymName").innerText;
            const gymprice = document.getElementById("GymPriceRate").innerText;

            const userId = await getCurrentUserId();

            try {
                // Check if the user already has an active or pending DayPass for the same date
                const existingDayPassQuery = query(
                    collection(db, 'Transactions'),
                    where('userId', '==', userId),
                    where('type', '==', 'Day Pass'),
                    where('status', 'in', ['Pending', 'Active']),
                    where('date', '==', selectedDate)  // Check for the same date
                );
                const existingDayPassSnapshot = await getDocs(existingDayPassQuery);

                if (!existingDayPassSnapshot.empty) {
                    // If there's already a pending or active DayPass for the same date, prevent new application
                    Swal.fire({
                        icon: 'error',
                        title: 'Unable to Apply for DayPass',
                        text: `You already have a DayPass application for ${selectedDate}. Please wait for approval before applying again.`,
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6'
                    });
                    return; // Stop the process
                }

                const cleanPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
                const cleanGymPrice = parseFloat(gymprice.replace(/[^\d.-]/g, '')) || 0;
                const totalPrice = cleanPrice + cleanGymPrice;

                const newNotification = {
                    message: `Day Pass Access for ${gymName} on ${selectedDate} at ₱${cleanGymPrice.toLocaleString()}. Services: ₱${cleanPrice.toLocaleString()}. Total: ₱${totalPrice.toLocaleString()}.`,
                    type: 'Day Pass',
                    email: email,
                    status: 'Pending',
                    price: cleanPrice,
                    Date: selectedDate,
                    read: false,
                    gymName: gymName,
                    gymprice: cleanGymPrice,
                    notificationId: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    userId: userId
                };

                await addDoc(collection(db, 'Notifications'), newNotification);

                const newTransaction = {
                    type: 'Day Pass',
                    userId: userId,
                    gymName: gymName,
                    email: email,
                    date: selectedDate,
                    totalPrice: cleanPrice.toFixed(2),
                    gymprice: cleanGymPrice,
                    status: 'Pending',
                    timestamp: new Date().toISOString()
                };

                await addDoc(collection(db, 'Transactions'), newTransaction);
                await fetchNotifications(userId);

                Swal.fire({
                    icon: 'success',
                    title: 'Day Pass Confirmed!',
                    html: `
                        <p><strong>Gym Name:</strong> ${gymName}</p>
                        <p><strong>Service Rate:</strong> ₱${cleanPrice.toLocaleString()}</p>
                        <p><strong>Gym Rate:</strong> ₱${cleanGymPrice.toLocaleString()}</p>  
                        <p><strong>Total Price:</strong> ₱${totalPrice.toLocaleString()}</p>                       
                        <p><strong>Date:</strong> ${selectedDate}</p>
                        <p><strong>Email:</strong> ${email}</p>
                    `,
                    confirmButtonText: 'Okay',
                });

                $('#dayPassModal').modal('hide');
            } catch (error) {
                console.error('Error creating Day Pass:', error);
            }
        });
    }
});


let selectedServices = [];
let totalServicePrice = 0;

window.handleDayPass = async function () {
    const modalGymName = document.getElementById("modalGymName").innerText.trim();

    if (!modalGymName) {
        return;
    }

    try {
        const gymOwnerRef = collection(db, "GymOwner");
        const q = query(gymOwnerRef, where("gymName", "==", modalGymName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const gymData = querySnapshot.docs[0].data();

            const gymPriceRate = gymData.gymPriceRate || 0;
            const gymPriceRateFormatted = gymPriceRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const servicePriceRate = gymData.PriceRate || 0;
            const servicePriceRateFormatted = servicePriceRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            document.getElementById("GymPriceRate").innerText = `₱${gymPriceRateFormatted}`;
            document.getElementById("dynamicPrice").innerText = `₱${servicePriceRateFormatted}`;
            updateTotalPrice(); // Update total price dynamically

            displayAvailableServices(gymData.gymServices);

            flatpickr("#calendarDate", {
                dateFormat: "Y-m-d",
                minDate: "today"
            });

            const dayPassModal = new bootstrap.Modal(document.getElementById('dayPassModal'));
            dayPassModal.show();
        } else {
            alert("Gym details not found. Please try again.");
        }
    } catch (error) {
        console.error('Error handling Day Pass modal:', error);
    }
};

function displayAvailableServices(services = []) {
    const servicesContainer = document.getElementById('availableServicesList');
    servicesContainer.innerHTML = '';

    const validServices = services.filter(service => service && service.trim() !== '');

    if (validServices.length === 0) {
        servicesContainer.innerHTML = '<p>No services available.</p>';
        return;
    }

    validServices.forEach((service, index) => {
        const serviceItem = document.createElement('div');
        serviceItem.classList.add('d-flex', 'align-items-center', 'justify-content-between', 'p-1', 'border-bottom');

        serviceItem.innerHTML = `
            <div>
                <input type="checkbox" class="service-checkbox" data-price="100" id="service-${index}" value="${service}">
                <label for="service-${index}" class="ml-2">${service} - ₱100.00</label>
            </div>
        `;
        servicesContainer.appendChild(serviceItem);
    });

    document.querySelectorAll('.service-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleServiceSelection);
    });
}

function handleServiceSelection() {
    selectedServices = [];
    totalServicePrice = 0;

    document.querySelectorAll('.service-checkbox:checked').forEach(checkbox => {
        selectedServices.push(checkbox.value);
        totalServicePrice += parseFloat(checkbox.dataset.price) || 0;
    });

    document.getElementById('dynamicPrice').innerText = `₱${totalServicePrice.toFixed(2)}`;
    updateTotalPrice(); // Update total price dynamically
}

function updateTotalPrice() {
    const serviceRate = parseFloat(document.getElementById('dynamicPrice').innerText.replace(/[^\d.-]/g, '')) || 0;
    const gymRate = parseFloat(document.getElementById('GymPriceRate').innerText.replace(/[^\d.-]/g, '')) || 0;
    const totalPrice = serviceRate + gymRate;

    document.getElementById('TotalPrice').innerText = `₱${totalPrice.toFixed(2)}`;
}
