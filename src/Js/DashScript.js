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

        let currentMembershipHtml = '';
        let historyHtml = '<ul style="list-style: none; padding: 0;">';
        const today = new Date(); // Get the current date

        membershipSnapshot.forEach(doc => {
            const membership = doc.data();
            const purchaseDate = new Date(membership.purchaseDate);
            const durationInDays = membership.duration || 30; // Use duration from Firestore or default to 30 days
            const expirationDate = new Date(purchaseDate.getTime() + durationInDays * 24 * 60 * 60 * 1000);

            // Skip memberships that are still in "Pending Owner Approval" status
            if (membership.status === 'Pending Owner Approval') {
                return; // Skip this iteration if the status is pending
            }

            const membershipHtml = `
                <li style="margin-bottom: 15px;">
                    <div style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f4f4f4;">
                        <h4 style="font-size: 1.4em; color: #5B247A;"><strong>Gym:</strong> ${membership.gymName}</h4>
                        <p><strong>Plan:</strong> ${membership.planType}</p>
                        <p><strong>Price:</strong> ₱${membership.planPrice}</p>
                        <p><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                        <p><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${membership.status}</p>
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
                    <div style="padding: 10px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                        <h4 style="font-size: 1.5em; color: #5B247A;"><strong>Gym:</strong> ${membership.gymName}</h4>
                        <p><strong>Plan:</strong> ${membership.planType}</p>
                        <p><strong>Price:</strong> ₱${membership.planPrice}</p>
                        <p><strong>Purchased on:</strong> ${purchaseDate.toLocaleDateString()}</p>
                        <p><strong>Expires on:</strong> ${expirationDate.toLocaleDateString()}</p>
                        <p><strong>Time Remaining:</strong> <span id="countdown"></span></p>
                        <p><strong>Status:</strong> ${membership.status}</p>
                    </div>
                `;

                // Render the current membership HTML before starting the countdown
                currentMembershipStatusDiv.innerHTML = currentMembershipHtml;

                // Now that the HTML is rendered, start the countdown
                startCountdown(expirationDate);
            }
        });

        historyHtml += '</ul>';

        // If no current membership, show message
        if (currentMembershipHtml === '') {
            currentMembershipHtml = '<p>No active membership found.</p>';
        }

        // Render HTML for the membership history
        membershipHistoryDiv.innerHTML = historyHtml;

    } catch (error) {
        console.error('Error fetching membership status and history:', error);
    }
}

// Function to start the countdown timer
function startCountdown(expirationDate) {
    const countdownElement = document.getElementById('countdown');
    
    // Check if the countdown element is present in the DOM
    if (!countdownElement) {
        console.error('Countdown element not found');
        return;
    }

    const updateCountdown = () => {
        const now = new Date();
        const timeRemaining = expirationDate - now;

        if (timeRemaining <= 0) {
            countdownElement.innerText = 'Expired';
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        countdownElement.innerText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    // Update countdown every second
    setInterval(updateCountdown, 1000);
}






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
                gymDiv.classList.add('trainer-card', 'gym-profile', 'mb-3'); // Add Bootstrap card classes

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
                            <div class="trainer-card">
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
    document.getElementById('membershipPlansBtn').addEventListener('click', function() {
        const gymProfileName = document.getElementById('modalGymName').innerText;
        showMembershipPlans(gymProfileName);
    });
    //////////////////////////////////////////////////////////////////////////////////MembershipPlan
    // Function to fetch and display the membership plans
    window.showMembershipPlans = async function(gymProfileName) {
        try {
            const membershipPlansSection = document.getElementById('membershipPlansSection');
            membershipPlansSection.innerHTML = ''; 
    
            // Define an array of colors for the membership cards
            const cardColors = [
                'linear-gradient(to right, #5B247A, #1BCEDF)',  
                'linear-gradient(to right, #184E68, #57CA85)', 
                'linear-gradient(to right, #F02FC2, #6094EA)'
            ];
    
            // Fetch membership plans where gymName matches gymProfileName
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
    
            // Show the membership plans modal using Bootstrap 5's JavaScript API
            const membershipPlansModal = new bootstrap.Modal(document.getElementById('membershipPlansModal'), { backdrop: 'static', keyboard: false });
            membershipPlansModal.show();
        } catch (error) {
            console.error('Error fetching membership plans:', error);
        }
    };
    
    window.confirmPlanPurchase = function(planType, planPrice, planId) {
        console.log('confirmPlanPurchase triggered for:', planType, planPrice, planId);
    
        // Set the selected plan details in the confirmation modal
        document.getElementById('selectedPlanType').innerText = planType;
        document.getElementById('selectedPlanPrice').innerText = planPrice;
    
        // Show the confirmation modal using Bootstrap 5's JavaScript API
        const confirmPurchaseModal = new bootstrap.Modal(document.getElementById('confirmPurchaseModal'), { backdrop: 'static', keyboard: false });
        confirmPurchaseModal.show();
    
        // Set the action for the Confirm Purchase button
        document.getElementById('confirmPurchaseBtn').onclick = async function() {
            try {
                console.log('Confirm Purchase button clicked.');
    
                const userId = await getCurrentUserId();
                console.log('User ID:', userId);
                if (!userId) {
                    throw new Error('No user ID found. Please log in.');
                }
    
                const gymName = document.getElementById('modalGymName').innerText;
                console.log('Gym Name:', gymName);
                if (!gymName) {
                    throw new Error('Gym name not available.');
                }
    
                console.log('Proceeding with purchase for:', planType, planPrice, planId, userId, gymName);
    
                // Call the purchasePlan function to save the transaction
                await purchasePlan(planId, planType, planPrice, userId, gymName);
                console.log('Purchase successful, transaction saved.');
    
                // Close the confirmation modal
                confirmPurchaseModal.hide();
    
                // Update membership success modal fields
                document.getElementById('successPlanType').innerText = planType;
                document.getElementById('successPlanPrice').innerText = planPrice;
                document.getElementById('gymNameSuccess').innerText = gymName;
    
                // Show the membership success modal using Bootstrap 5's JavaScript API
                const membershipSuccessModal = new bootstrap.Modal(document.getElementById('membershipSuccessModal'), { backdrop: 'static', keyboard: false });
                membershipSuccessModal.show();
    
                // Notify the user with a custom notification (in-app)
                await notifyUser(userId, planType, gymName);
    
            } catch (error) {
                console.error('Error during membership purchase:', error.message);
                alert('There was an error: ' + error.message);
    
                // Close the confirmation modal in case of an error
                confirmPurchaseModal.hide();
    
                // Show the error modal using Bootstrap 5's JavaScript API
                const errorModal = new bootstrap.Modal(document.getElementById('errorModal'), { backdrop: 'static', keyboard: false });
                errorModal.show();
            }
        };
    };
    

// Function to handle the actual purchase process and save the transaction
async function purchasePlan(planId, planType, planPrice, userId, gymName) {
    try {
        console.log('Attempting to save transaction:', { planId, planType, planPrice, userId, gymName });
        const newTransaction = {
            userId: userId,
            planId: planId,
            planType: planType,
            planPrice: planPrice,
            gymName: gymName,
            purchaseDate: new Date().toISOString(), // Save the current date and time
            status: 'Pending Owner Approval' // Default status for membership
        };

        // Save the transaction to Firestore
        await addDoc(collection(db, 'Transactions'), newTransaction);
        console.log('Transaction saved successfully.');
    } catch (error) {
        console.error('Error saving transaction:', error);
        throw new Error('Failed to save the transaction');
    }
}

// Function to notify the user with a custom notification
async function notifyUser(userId, planType, gymName) {
    try {
        console.log('Notifying user:', { userId, planType, gymName });
        const notification = {
            userId: userId,
            message: `You have successfully purchased the ${planType} plan from ${gymName}.`,
            read: false, // Unread notification
            timestamp: new Date().toISOString(),
        };

        // Save the notification to Firestore
        await addDoc(collection(db, 'Notifications'), notification);
        console.log('Notification sent successfully.');
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

    
    
        // Function to fetch the gym owner's location (e.g., city) based on the gymName
        async function fetchGymOwnerLocation(gymName) {
            try {
                const gymQuery = query(
                    collection(db, 'Users'), 
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
                console.error('Error fetching gym coordinates:', error);
                alert('Could not fetch the location. Please ensure the city name is correct.');
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
                fetchGymCoordinates();
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
