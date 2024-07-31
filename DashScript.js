        import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
        import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
        import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

// Your existing JavaScript code...


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

        // Dropdown menu function
        function createDropdownMenu(role) {
            const dropdownButton = document.querySelector('.dropbtn');
            dropdownButton.textContent = `Greeting, ${role.charAt(0).toUpperCase() + role.slice(1)}`;
            
            const dropdownContent = document.querySelector('.dropdown-content');
            dropdownContent.innerHTML = ''; // Clear previous content

            if (role === 'admin') {
                dropdownContent.innerHTML += '<a href="accounts.html">Admin Management</a>';
            } else if (role === 'gym_owner') {
                dropdownContent.innerHTML += '<a href="gym-profiling.html">Gym Owner Management</a>';
            } else if (role === 'trainer') {
                dropdownContent.innerHTML += '<a href="Trainer.html">Trainer Profile</a>';
            }
            
            dropdownContent.innerHTML += '<a href="PeakPulse.html" id="logout">Log Out</a>';

            // Add event listener for logout
            document.getElementById('logout').addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.href = 'login.html'; // Redirect to login page
                }).catch((error) => {
                    console.error("Sign Out Error:", error.code, error.message);
                });
            });
        }

        // Check user authentication and role
        onAuthStateChanged(auth, (user) => {
            if (user) {
                const userId = user.uid;
                const userRef = ref(database, 'Accounts/' + userId);
                get(userRef).then((snapshot) => {
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        const role = userData.role || 'user'; // Default to 'user' if no role is found
                        createDropdownMenu(role);
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

        // Initialize FullCalendar
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                height: 'auto', // Adjust height
                aspectRatio: 1.5, // Adjust aspect ratio for better size control
                editable: true,
                selectable: true,
                events: [
                    // Sample events
                    {
                        title: 'Gym Session',
                        start: '2024-08-01T10:00:00',
                        end: '2024-08-01T12:00:00'
                    },
                    {
                        title: 'Personal Training',
                        start: '2024-08-05T09:00:00',
                        end: '2024-08-05T10:00:00'
                    }
                ],
                dateClick: function(info) {
                    alert('Date clicked: ' + info.dateStr);
                }
            });
            calendar.render();
        });

// Show/Hide notification dropdown
            document.querySelector('.fa-bell').addEventListener('click', () => {
                const notificationDropdown = document.getElementById('notificationDropdown');
                const isVisible = notificationDropdown.style.display === 'block';
                notificationDropdown.style.display = isVisible ? 'none' : 'block';
            });

            // Render notifications and add show more functionality
            const notifications = [
                { message: 'New member registration', timestamp: '2024-07-31 10:00' },
                { message: 'Payment received from John Doe', timestamp: '2024-07-30 14:30' },
                { message: 'Class schedule updated', timestamp: '2024-07-29 09:00' },
                { message: 'New promotion added', timestamp: '2024-07-28 16:45' },
                { message: 'Gym equipment maintenance due', timestamp: '2024-07-27 11:00' }
            ];

            const notificationList = document.getElementById('notificationList');
            const showMoreButton = document.getElementById('showMore');
            let displayedCount = 3;

            function renderNotifications() {
                notificationList.innerHTML = '';
                notifications.slice(0, displayedCount).forEach((notification, index) => {
                    const notificationDiv = document.createElement('div');
                    notificationDiv.className = 'notification';
                    notificationDiv.innerHTML = `
                        <p>${notification.message}</p>
                        <small>${notification.timestamp}</small>
                        <button onclick="this.parentElement.remove()">x</button>
                    `;
                    notificationList.appendChild(notificationDiv);
                });

                // Update Show More button visibility
                if (displayedCount >= notifications.length) {
                    showMoreButton.style.display = 'none';
                } else {
                    showMoreButton.style.display = 'block';
                }
            }

            showMoreButton.addEventListener('click', () => {
                displayedCount = Math.min(displayedCount + 3, notifications.length);
                renderNotifications();
            });

            renderNotifications();
