import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getDatabase, ref, onValue , get } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js';
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAPNGokBic6CFHzuuENDHdJrMEn6rSE92c",
    authDomain: "capstone40-project.firebaseapp.com",
    databaseURL: "https://capstone40-project-default-rtdb.firebaseio.com",
    projectId: "capstone40-project",
    storageBucket: "capstone40-project.appspot.com",
    messagingSenderId: "399081968589",
    appId: "1:399081968589:web:5b502a4ebf245e817aaa84",
    measurementId: "G-CDP5BCS8EY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app)

// Function to create dropdown menu based on user role
function createDropdownMenu(username, role) {
  const dropdownMenu = document.querySelector('.dropdown-menu');
  if (dropdownMenu) {
      dropdownMenu.innerHTML = ''; // Clear previous content
      dropdownMenu.innerHTML += `<a class="dropdown-item" href="#">Hello, ${username}</a>`;
      
      // Role-based items in the dropdown
      if (role === 'gym_owner') {
          dropdownMenu.innerHTML += '<a class="dropdown-item" href="gym-profiling.html">Gym Owner Management</a>';
      } else if (role === 'user') {
          dropdownMenu.innerHTML += '<a class="dropdown-item" href="Pinfo.html">Personal Information</a>';
          dropdownMenu.innerHTML += '<a class="dropdown-item" href="report.html">Submit a Complaint</a>';
      }

      // Logout option
      dropdownMenu.innerHTML += '<a class="dropdown-item" href="login.html" id="logout">Log Out</a>';

      // Add event listener for logout
      document.getElementById('logout')?.addEventListener('click', () => {
          signOut(auth).then(() => {
              window.location.href = 'login.html'; // Redirect to login page
          }).catch((error) => {
              console.error("Sign Out Error:", error.code, error.message);
          });
      });
  } else {
      console.error('Dropdown menu not found');
  }
}

    // Check user authentication and role
        onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = user.uid;
            const userRef = ref(database, 'Accounts/' + userId);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const username = userData.username || 'User'; // Default to 'User' if no username is found
                    const role = userData.role || 'user'; // Default to 'user' if no role is found
                    createDropdownMenu(username, role);
                } else {
                    // Redirect to login if no user data is found
                    window.location.href = 'login.html';
                }
            }).catch((error) => {
                console.error("Error fetching user data:", error);
            });
        } else {
            // Redirect to login if no user is authenticated
            window.location.href = 'login.html';
        }
        });


        const profilePicture = document.getElementById('profile-picture');

        // Fetch user data when authenticated
        auth.onAuthStateChanged((user) => {
            if (user) {
                const userId = user.uid;
                const profilePicRef = storageRef(storage, 'profilePictures/' + userId + '/profile.jpg');

                // Fetch and display the profile picture
                getDownloadURL(profilePicRef)
                    .then((url) => {
                        profilePicture.src = url; // Set the profile picture
                    })
                    .catch((error) => {
                        console.error("Error loading profile picture:", error);
                        profilePicture.src = 'framework/img/Profile.png'; // Default picture if not available
                    });
            } else {
                window.location.href = 'login.html'; // Redirect to login if user is not authenticated
            }
        });

        const map = L.map('map').setView([10.3095, 123.8914], 13); // Default coordinates

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Function to locate the gym on the map
        async function locateGym(location) {
            try {
                const { lat, lon } = await geocodeAddress(location);
                if (lat && lon) {
                    map.setView([lat, lon], 13);
                    L.marker([lat, lon]).addTo(map).bindPopup(`Gym Location: ${location}`).openPopup();
                    await fetchWeatherData(lat, lon);
                } else {
                    console.error('Unable to locate the gym.');
                }
            } catch (error) {
                console.error('Error locating the gym:', error);
            }
        }
        
        // Function to fetch weather data
        async function MapData(lat, lon) {
            const apiKey = '3c52706688064b3038c2328bbbc4cba0'; // Replace with your OpenWeatherMap API key
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Error ${response.status}: ${errorData.message}`);
                }
                
                const data = await response.json();
                if (data.weather && data.weather.length > 0) {
                    const weatherDescription = data.weather[0].description;
                    const temperature = data.main.temp;
        
                    const marker = L.marker([lat, lon]).addTo(map);
                    marker.bindPopup(`
                        <b>Weather:</b><br>
                        ${weatherDescription}<br>
                        Temperature: ${temperature}°C
                    `).openPopup();
                } else {
                    console.error('Weather data is missing or in an unexpected format:', data);
                }
            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        }        
        // Call the function with the coordinates for Lapu-Lapu City
        MapData(10.3095, 123.8914); // Coordinates for Lapu-Lapu City
        
        // Function to geocode address
        async function geocodeAddress(address) {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.length > 0) {
                    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                } else {
                    console.error('Address not found');
                    return null;
                }
            } catch (error) {
                console.error('Error geocoding address:', error);
                return null;
            }
        }
        
        // Event listener for search button
        document.getElementById('searchButton')?.addEventListener('click', async () => {
            const address = document.getElementById('searchBar').value;
            if (address) {
                try {
                    const location = await geocodeAddress(address);
                    if (location) {
                        map.setView([location.lat, location.lon], 13); // Center map on the searched location
                        L.marker([location.lat, location.lon]).addTo(map)
                            .bindPopup(`<b>${address}</b>`)
                            .openPopup();
                        
                        // Optionally fetch weather data for the searched location
                        await MapData(location.lat, location.lon);
                    }
                } catch (error) {
                    console.error('Error during search:', error);
                }
            } else {
                console.warn('Search input is empty.');
            }
        });

        
        document.addEventListener("DOMContentLoaded", function() {
            // Reference to the trainers table in Firebase
            const trainersRef = ref(database, 'TrainerForm');
            // Reference to the membership plans in Firebase
            const membershipPlansRef = ref(database, 'membershipPlans');
            // Reference to the gym profiles in Firebase
            const GymProfileref = ref(database, 'GymForms');

            // Function to redirect to login
            window.redirectToLogin = function() {
              window.location.href = 'login.html';
            }
          
            // Function to create HTML for each trainer
            window.createTrainerCard = function(trainer) {
                return `
                    <div class="trainer-card">
                        <img src="${trainer.TrainerPhoto}" alt="${trainer.TrainerName}" class="trainer-photo">
                        <h3>${trainer.TrainerName}</h3>
                        <a href="#" class="btn-book-now" onclick='showTrainerProfileModal(${JSON.stringify(trainer).replace(/"/g, '&quot;')})'>View</a>
                    </div>
                `;
            };
            
            window.showTrainerProfileModal = function(trainer) {
                document.getElementById('modalTrainerPhoto').src = trainer.TrainerPhoto;
                document.getElementById('modalTrainerName').textContent = trainer.TrainerName;
                document.getElementById('modalTrainerExperience').textContent = trainer.Experience;
                document.getElementById('modalTrainerExpertise').textContent = trainer.Expertise;
                document.getElementById('modalTrainerDays').textContent = trainer.Days; // Correct element for days
                document.getElementById('modalTrainerRate').textContent = trainer.rate; // Ensure this is set
            
                const modal = document.getElementById('trainerProfileModal');
                modal.style.display = 'block'; // Show the modal
            };
            
            window.closeTrainerModal = function() {
                const modal = document.getElementById('trainerProfileModal');
                modal.style.display = 'none'; // Hide the modal
            }
            
            // Close the modal when clicking outside of the modal content
            window.onclick = function(event) {
                const modal = document.getElementById('trainerProfileModal');
                if (event.target === modal) {
                    closeTrainerModal();
                }
            }
            window.bookTrainer = function(TrainerName, rate) {
                const confirmationMessage = `
                    <p>Do you want to book ${TrainerName}?</p>
                    <button id="confirmBookingYes" class="btn">Yes</button>
                    <button id="confirmBookingNo" class="btn">No</button>
                `;
                
                const confirmationArea = document.getElementById('confirmationArea');
                confirmationArea.innerHTML = confirmationMessage;
                confirmationArea.style.display = 'block'; // Show the confirmation area
            
                closeTrainerModal();
            
                document.getElementById('confirmBookingYes').onclick = function() {
                    confirmBooking(TrainerName, rate); // Pass both name and rate
                    confirmationArea.style.display = 'none'; // Hide confirmation area after confirmation
                };
                
                document.getElementById('confirmBookingNo').onclick = function() {
                    confirmationArea.style.display = 'none'; // Hide confirmation area if no
                };
            };
            
            function confirmBooking(TrainerName, rate) {
                const bookingDetails = `
                    <p>Your booking for ${TrainerName} is confirmed!</p>
                    <p>Proceed to payment (Cash Only).</p>
                `;
                document.getElementById('bookingDetails').innerHTML = bookingDetails;
            
                // Set Trainer's name and Rate in the payment modal
                document.getElementById('paymentTrainerName').textContent = TrainerName;
                document.getElementById('paymentTrainerRate').textContent = rate;
            
                // Show the payment modal
                const paymentModal = document.getElementById('paymentModal');
                paymentModal.style.display = 'block'; // Show the payment modal
            }
            
            window.closePaymentModal = function() {
                const paymentModal = document.getElementById('paymentModal');
                paymentModal.style.display = 'none'; // Hide the payment modal
            };
            document.getElementById('trainerPayment').addEventListener('click', function() {
                const paymentMethod = document.getElementById('paymentMethod').value;
                const successMessage = `Your booking with the trainer is confirmed! Payment Method: ${paymentMethod}`;
                displaySuccessMessage(successMessage);
                closePaymentModal(); // Close the payment modal
            });
                        
            // Function to create a Membership Plan Card
            window.createMembershipCard =function(plan) {
              return `
                <div class="membership-plan">
                  <h3>${plan.name}</h3>
                  <p class="price">₱${plan.price}</p>
                  <p class="description">${plan.description}</p>
                  <a href="login.html" class="btn btn-secondary">Apply Now</a>
                </div>
              `;
            }
          
            // Function to create Gym Profile Card
            window. createGymProfileCard = function(gym) {
                return `
                  <div class="gym-profile-card">
                    <div class="gym-profile-header">
                      <img src="${gym.gymPhoto}" alt="${gym.gymName}" class="gym-photo">
                      <h3>${gym.gymName}</h3>
                    </div>
                    <div class="gym-profile-details">
                        <a href="#" class="btn-primary view-button" onclick='showGymProfileModal(${JSON.stringify(gym).replace(/"/g, '&quot;')})'>View</a>
                    </div>
                  </div>
                `;
            }
            window.showGymProfileModal = function(gym) {
                document.getElementById('modalGymPhoto').src = gym.gymPhoto;
                document.getElementById('modalGymName').textContent = gym.gymName;
                document.getElementById('modalGymLocation').textContent = gym.gymLocation;
                document.getElementById('modalGymEquipment').textContent = gym.gymEquipment;
                document.getElementById('modalGymPrograms').textContent = gym.gymPrograms;
                document.getElementById('modalGymContact').textContent = gym.gymContact;
                document.getElementById('modalGymOpeningTime').textContent = `${gym.gymOpeningTime} AM`;
                document.getElementById('modalGymClosingTime').textContent = `${gym.gymClosingTime} PM`;
            
                // Get the gym location
                const location = gym.gymLocation;
            
                // Fetch coordinates from OpenWeatherMap Geocoding API
                const apiKey = '3c52706688064b3038c2328bbbc4cba0'; // Replace with your OpenWeatherMap API key
                const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}`;
            
                fetch(geocodingUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data && data.coord) {
                            const lat = data.coord.lat;
                            const lon = data.coord.lon;
            
                            // Set the map URL using OpenStreetMap
                            const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
                            document.getElementById('modalGymMap').src = mapSrc;
                        } else {
                            document.getElementById('modalGymMap').src = "";
                            alert("Unable to retrieve location data.");
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching geocoding data:', error);
                        document.getElementById('modalGymMap').src = "";
                        alert("Failed to load location information.");
                    });
            
                const modal = document.getElementById('gymProfileModal');
                modal.style.display = 'block'; // Show the modal
            }
            
            window.closeModal = function() {
                const modal = document.getElementById('gymProfileModal');
                modal.style.display = 'none'; // Hide the modal
            }
            
            // Close the modal when clicking outside of the modal content
            window.onclick = function(event) {
                const modal = document.getElementById('gymProfileModal');
                if (event.target === modal) {
                    closeModal();
                }
            }
            
            let membershipPlans = []; // Global array to hold membership plans

            // Function to fetch membership plans from Firebase
            function fetchMembershipPlans() {
                onValue(membershipPlansRef, function(snapshot) {
                    const data = snapshot.val();
                    membershipPlans = []; // Clear previous data

                    for (const key in data) {
                        membershipPlans.push(data[key]); // Push each plan into the array
                    }

                    // Update the main section if necessary
                    updateMembershipSection();
                });
            }

            // Function to update the membership section
            function updateMembershipSection() {
                const membershipSection = document.getElementById('membership-table');
                if (membershipSection) {
                    membershipSection.innerHTML = ''; // Clear existing content

                    membershipPlans.forEach(plan => {
                        membershipSection.innerHTML += createMembershipCard(plan);
                    });
                } else {
                    console.error("Membership section not found in the DOM");
                }
            }
            // Function to view membership plans in modal
            window.viewMembershipPlans = function() {
                const content = membershipPlans.map(plan => `
                    <div class="membership-plan">
                        <h3>${plan.membershipType}</h3>
                        <p class="price">₱${plan.price}</p>
                        <p class="description">${plan.description}</p>
                        <a href="#" class="btn btn-secondary" onclick="applyForMembership(event, '${plan.membershipType}', ${plan.price})">Apply Now</a>
                    </div>
                `).join(""); // Join array to a single string
            
                document.getElementById('membershipPlansContent').innerHTML = content;
            
                const modal = document.getElementById('membershipPlansModal');
                modal.style.display = 'block'; // Show the modal
            }
            
            // Function to handle membership application
            window.applyForMembership = function(event, membershipType, price) {
                event.preventDefault(); // Prevent default anchor behavior
            
                // Show checkout modal with the selected membership details
                const checkoutDetails = `
                    <p>Membership Type: ${membershipType}</p>
                    <p>Price: ₱${price}</p>
                `;
                document.getElementById('checkoutDetails').innerHTML = checkoutDetails;
            
                const modal = document.getElementById('checkoutModal');
                modal.style.display = 'block'; // Show the checkout modal
            }
            
            // Close checkout modal
            window.closeCheckoutModal = function() {
                const modal = document.getElementById('checkoutModal');
                modal.style.display = 'none'; // Hide the modal
            }
            
            // Confirm payment button event
            document.getElementById('confirmPayment').addEventListener('click', function() {
                const successMessage = 'Great news! Your membership is officially active. We’re excited to have you join our community!'; // Customized message
                displaySuccessMessage(successMessage); // Display the success message
                closeCheckoutModal(); // Close the modal
            });
            
            // Function to display success message in the center
            function displaySuccessMessage(message) {
                const messageContainer = document.createElement('div');
                messageContainer.innerText = message;
                messageContainer.style.position = 'fixed';
                messageContainer.style.top = '50%';
                messageContainer.style.left = '50%';
                messageContainer.style.transform = 'translate(-50%, -50%)';
                messageContainer.style.padding = '20px';
                messageContainer.style.backgroundColor = '#4CAF50'; // Green background
                messageContainer.style.color = 'white';
                messageContainer.style.borderRadius = '5px';
                messageContainer.style.zIndex = '1000';
                
                document.body.appendChild(messageContainer);
            
                // Remove message after 3 seconds
                setTimeout(() => {
                    document.body.removeChild(messageContainer);
                }, 3000);
            }
            
            // Load membership plans when the page is ready
            window.onload = fetchMembershipPlans;
            
            // Close membership plans modal
            window.closeMembershipPlansModal = function() {
                const modal = document.getElementById('membershipPlansModal');
                modal.style.display = 'none'; // Hide the modal
            }
            
          
            // Function to handle the click event of "Locate Me" buttons
            function handleLocateButtonClick(event) {
                const target = event.target; // Get the actual clicked element
            
                // Check if the target is the button we expect
                if (target && target.classList.contains('locate-button')) {
                    const location = target.getAttribute('data-location');
                    if (location) {
                        const searchBar = document.getElementById('searchBar');
                        if (searchBar) {
                            searchBar.value = location; // Update search bar
            
                            // Trigger the search functionality
                            const searchButton = document.getElementById('searchButton');
                            if (searchButton) {
                                searchButton.click();
                            }
                        } else {
                            console.error('Search bar not found');
                        }
                    } else {
                        console.error('Location data attribute not found');
                    }
                }
            }
            
            // Add event listener for dynamically created "Locate Me" buttons
            document.addEventListener('click', handleLocateButtonClick);

     
            // Fetch trainers data from Firebase
            onValue(trainersRef, function(snapshot) {
              const data = snapshot.val();
              const trainerProfilesContainer = document.getElementById('trainer-profiles');
          
              if (trainerProfilesContainer) {
                trainerProfilesContainer.innerHTML = ''; // Clear existing content
          
                for (const key in data) {
                  if (data.hasOwnProperty(key)) {
                    const trainer = data[key];
                    trainerProfilesContainer.innerHTML += createTrainerCard(trainer);
                  }
                }
              } else {
                console.error("Trainer profiles container not found in the DOM");
              }
            });
          
            // Fetch membership plans data from Firebase
            onValue(membershipPlansRef, function(snapshot) {
              const data = snapshot.val();
              const membershipSection = document.getElementById('membership-table');
              
              if (membershipSection) {
                membershipSection.innerHTML = ''; // Clear existing content
          
                for (const key in data) {
                  const plan = data[key];
                  membershipSection.innerHTML += createMembershipCard(plan);
                }
              } else {
                console.error("Membership section not found in the DOM");
              }
            });
          
            // Fetch gym profiles data from Firebase
            onValue(GymProfileref, function(snapshot) {
                const data = snapshot.val();
                console.log('Gym profiles data:', data); // Debugging line
                const gymprofilesection = document.getElementById('gym-profile');
                
                if (gymprofilesection) {
                  gymprofilesection.innerHTML = ''; // Clear existing content
              
                  for (const key in data) {
                    if (data.hasOwnProperty(key)) {
                      const gym = data[key];
                      console.log('Processing gym:', gym); // Debugging line
                      gymprofilesection.innerHTML += createGymProfileCard(gym);
                    }
                  }
                } else {
                  console.error("Gym Profile section not found in the DOM");
                }
              });
          });
          document.addEventListener('DOMContentLoaded', () => {
            const locateButton = document.getElementById('locate-button');
            if (locateButton) {
              locateButton.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default anchor behavior
                const location = this.getAttribute('data-location');
                locateGym(location);
              });
            }
          });
          const personalInfoLink = document.querySelector('.dropdown-item[href="Pinfo.html"]');
          if (personalInfoLink) {
              personalInfoLink.addEventListener('click', function(event) {
                  window.location.href = 'Pinfo.html'; // Explicitly navigate to the page
              });
          }

          window.filterProfiles = function() {
            const input = document.getElementById('search-input');
            const filter = input.value.toLowerCase();
            const profiles = document.querySelectorAll('.gym-profile-item'); // Assuming each gym profile has this class
    
            profiles.forEach(profile => {
                const text = profile.textContent.toLowerCase();
                profile.style.display = text.includes(filter) ? '' : 'none';
            });
        }
      
      let selectedDate; // Variable to store the selected date

      document.addEventListener('DOMContentLoaded', function() {
        const calendarEl = document.getElementById('calendar');
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [], // Initially empty
            dateClick: function(info) {
                selectedDate = info.dateStr; // Save the selected date
                $('#noteModal').modal('show'); // Show the custom modal
            }
        });
    
        calendar.render();
    
        // Load notes from localStorage
        const savedNotes = JSON.parse(localStorage.getItem('calendarNotes')) || [];
        savedNotes.forEach(note => {
            calendar.addEvent({
                title: note.title,
                start: note.start,
                allDay: true
            });
        });
    
        // Save note button event
        document.getElementById('saveNote').addEventListener('click', function() {
            const noteText = document.getElementById('noteText').value;
            if (noteText) {
                // Add event to calendar
                calendar.addEvent({
                    title: noteText,
                    start: selectedDate,
                    allDay: true
                });
    
                // Save to localStorage
                savedNotes.push({ title: noteText, start: selectedDate });
                localStorage.setItem('calendarNotes', JSON.stringify(savedNotes));
    
                $('#noteModal').modal('hide'); // Hide the modal
                document.getElementById('noteText').value = ''; // Clear the textarea
            }
        });
    });
    window.updateNotificationBell = function(userId) {
        const notificationsRef = ref(database, 'notifications/' + userId);
        
        get(notificationsRef).then((snapshot) => {
            const notificationContent = document.getElementById('notification-content');
            notificationContent.innerHTML = ''; // Clear existing content
    
            if (snapshot.exists()) {
                const notifications = snapshot.val();
                const totalNotifications = notifications.transaction + notifications.emails + notifications.membershipPlans;
    
                const notificationBell = document.getElementById('notification-bell');
                notificationBell.querySelector('.badge').textContent = totalNotifications > 0 ? totalNotifications : '';
    
                // Populate the dropdown
                if (totalNotifications > 0) {
                    if (notifications.transaction > 0) {
                        notificationContent.innerHTML += `<div>New Transactions: ${notifications.transaction}</div>`;
                    }
                    if (notifications.emails > 0) {
                        notificationContent.innerHTML += `<div>New Emails: ${notifications.emails}</div>`;
                    }
                    if (notifications.membershipPlans > 0) {
                        notificationContent.innerHTML += `<div>New Membership Plans: ${notifications.membershipPlans}</div>`;
                    }
                }
            } else {
                console.log('No notifications found for user:', userId);
            }
        }).catch((error) => {
            console.error('Error fetching notifications:', error);
        });
    };
    
    window.toggleDropdown = function() {
        const dropdown = document.getElementById('notification-dropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    };
    
    window.onclick = function(event) {
        const dropdown = document.getElementById('notification-dropdown');
        const bell = document.getElementById('notification-bell');
    
        if (!bell.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = 'none'; // Close the dropdown
        }
    };
    
    // Attach click event to the bell
    document.getElementById('notification-bell').addEventListener('click', toggleDropdown);
    

    window.toggleChat = function() {
        const chatBox = document.getElementById('chatBox');
        chatBox.style.display = chatBox.style.display === 'none' || chatBox.style.display === '' ? 'block' : 'none';
    }
    window. receiveMessage = function(message) {
        const messagesContainer = document.getElementById('messages');
        
        // Create a new message element
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messagesContainer.appendChild(messageElement);
    
        // Open the chat box when a message is received
        toggleChat();
    }