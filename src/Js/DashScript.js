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
            const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=hourly,daily&appid=${apiKey}&units=metric`;
        
            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.current && data.current.weather && data.current.weather.length > 0) {
                    const weatherDescription = data.current.weather[0].description;
                    const temperature = data.current.temp;
        
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
          
            // Function to show the confirmation message
            function showConfirmationMessage() {
              const messageElement = document.getElementById('confirmation-message');
              if (messageElement) {
                messageElement.classList.add('active');
                setTimeout(() => {
                  messageElement.classList.remove('active');
                }, 5000); // Hide message after 5 seconds
              }
            }
          
            // Function to redirect to login
            window.redirectToLogin = function() {
              window.location.href = 'login.html';
            }
          
            // Function to create HTML for each trainer
            window.createTrainerCard = function(trainer) {
              return `
                <div class="trainer-card">
                  <img src="${trainer.TrainerPhoto}" alt="${trainer.Name}" class="trainer-photo">
                  <h3>${trainer.TrainerName}</h3>
                  <p><strong>Available Only:</strong> ${trainer.Days}</p>
                  <p><strong>Experience:</strong> ${trainer.Experience}</p>
                  <p><strong>Expertise:</strong> ${trainer.Expertise}</p>
                  <a href="#" class="btn-book-now" onclick="showConfirmationMessage()">Book Me Now</a>
                </div>
              `;
            }
          
            // Function to create a Membership Plan Card
            function createMembershipCard(plan) {
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
            function createGymProfileCard(gym) {
                return `
                  <div class="gym-profile-card">
                    <div class="gym-profile-header">
                      <img src="${gym.gymPhoto}" alt="${gym.gymName}" class="gym-photo">
                      <h3>${gym.gymName}</h3>
                    </div>
                    <div class="gym-profile-details">
                      <p><strong>Location:</strong> ${gym.gymLocation}</p>
                      <p><strong>Equipment:</strong> ${gym.gymEquipment}</p>
                      <p><strong>Programs:</strong> ${gym.gymPrograms}</p>
                      <p><strong>Contact:</strong> ${gym.gymContact}</p>
                      <p><strong>Opening Time:</strong> ${gym.gymOpeningTime}AM</p>
                      <p><strong>Closing Time:</strong> ${gym.gymClosingTime}PM</p>
                      <a href="#" class="btn-primary" onclick="showConfirmationMessage()">Contact Us</a>
                      <a href="#" class="btn-secondary locate-button" data-location="${gym.gymLocation}">Locate Me</a>
                    </div>
                  </div>
                `;
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
    
    function updateNotificationBell(userId) {
        const notificationsRef = ref(database, 'notifications/' + userId);
        
        get(notificationsRef).then((snapshot) => {
            if (snapshot.exists()) {
                const notifications = snapshot.val();
                const totalNotifications = notifications.transaction + notifications.emails + notifications.membershipPlans;
                
                const notificationBell = document.getElementById('notification-bell');
                if (totalNotifications > 0) {
                    notificationBell.innerHTML = `<i class="fas fa-bell"></i> <span class="badge">${totalNotifications}</span>`;
                } else {
                    notificationBell.innerHTML = `<i class="fas fa-bell"></i>`;
                }
            } else {
                console.log('No notifications found for user:', userId);
            }
        }).catch((error) => {
            console.error('Error fetching notifications:', error);
        });
    }
    