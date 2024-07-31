import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

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
const storage = getStorage(app);
const accountRef = ref(database, 'Accounts');
const ReportFormDB = ref(database, 'ReportForm');
const gymRef = ref(database, 'gyms');

// Example of using Firebase Storage
const uploadImage = async (file) => {
    try {
        const storageReference = storageRef(storage, 'gym_images/' + file.name);
        const uploadResult = await uploadBytes(storageReference, file);
        const downloadURL = await getDownloadURL(storageReference);
        console.log('File available at', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
    }
};


    // Function to display all accounts
    function displayAccountInfo() {
        const accountInfoBody = document.getElementById('accountInfoBody');
        if (!accountInfoBody) {
            console.error('accountInfoBody element not found');
            return;
        }
    
        accountRef.once('value', function(snapshot) {
            const accounts = snapshot.val();
            accountInfoBody.innerHTML = '';
    
            if (accounts) {
                for (const key in accounts) {
                    if (accounts.hasOwnProperty(key)) {
                        const account = accounts[key];
                        const row = document.createElement('tr');
    
                        const status = account.online
                            ? 'Online'
                            : `Offline (Last: ${new Date(account.lastOnline).toLocaleString()})`;
    
                        row.innerHTML = `
                            <td><input type="checkbox" class="selectAccount" value="${key}"></td>
                            <td>${account.id || 'N/A'}</td>
                            <td>${account.username || 'N/A'}</td>
                            <td>${status || 'N/A'}</td>
                            <td>
                                <button class="btn btn-warning btn-sm" onclick="editAccount('${key}')">Edit</button>
                            </td>
                        `;
    
                        accountInfoBody.appendChild(row);
                    }
                }
            } else {
                accountInfoBody.innerHTML = '<tr><td colspan="5">No accounts found.</td></tr>';
            }
        }).catch(error => {
            console.error('Error fetching data:', error);
        });
    }

    // Function to get the next ID (based on the highest existing ID)
    function getNextId(callback) {
        accountRef.once('value', function(snapshot) {
            const accounts = snapshot.val();
            let maxId = 0;

            if (accounts) {
                for (const key in accounts) {
                    if (accounts.hasOwnProperty(key)) {
                        const account = accounts[key];
                        const accountId = parseInt(account.id, 10);
                        if (!isNaN(accountId) && accountId > maxId) {
                            maxId = accountId;
                        }
                    }
                }
            }

            callback(maxId + 1);
        }).catch(error => {
            console.error('Error fetching data for ID:', error);
            callback(1); // Default to 1 if there's an error
        });
    }

    // Function to add or edit account
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();

            checkUserLoggedIn().then(user => {
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();
                const key = document.getElementById('accountKey').value;

                if (username && email) {
                    getNextId(function(nextId) {
                        const accountData = {
                            id: nextId,
                            username,
                            email,
                            online: true, // default online status
                            lastOnline: new Date().toISOString() // current timestamp
                        };

                        if (key) {
                            accountRef.child(key).update(accountData).then(() => {
                                $('#accountModal').modal('hide');
                                displayAccountInfo();
                            }).catch(error => {
                                console.error('Error updating account:', error);
                            });
                        } else {
                            accountRef.push(accountData).then(() => {
                                $('#accountModal').modal('hide');
                                displayAccountInfo();
                            }).catch(error => {
                                console.error('Error adding account:', error);
                            });
                        }
                    });
                }
            }).catch(errorMessage => {
                document.getElementById('error-message').innerHTML = errorMessage;
            });
        });
    } else {
        console.error('accountForm element not found');
    }

    // Function to edit account
    window.editAccount = function(key) {
        checkUserLoggedIn().then(user => {
            accountRef.child(key).once('value', function(snapshot) {
                const account = snapshot.val();
                document.getElementById('username').value = account.username;
                document.getElementById('email').value = account.email;
                document.getElementById('accountKey').value = key;
                $('#accountModal').modal('show');
            }).catch(error => {
                console.error('Error fetching account data:', error);
            });
        }).catch(errorMessage => {
            document.getElementById('error-message').innerHTML = errorMessage;
        });
    };

    // Function to delete account
    window.deleteAccount = function(key) {
        checkUserLoggedIn().then(user => {
            if (confirm('Are you sure you want to delete this account?')) {
                accountRef.child(key).remove().then(() => {
                    displayAccountInfo();
                }).catch(error => {
                    console.error('Error deleting account:', error);
                });
            }
        }).catch(errorMessage => {
            document.getElementById('error-message').innerHTML = errorMessage;
        });
    };

    // Load account data on page load
    displayAccountInfo();

    // Handle report complaints
    const reportForm = document.getElementById('ReportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();

            checkUserLoggedIn().then(user => {
                const reportTitle = document.getElementById('name').value.trim();
                const reportDetails = document.getElementById('issue').value.trim();
                const reportEmail = document.getElementById('email').value.trim();

                if (reportTitle && reportDetails) {
                    const newReport = {
                        title: reportTitle,
                        details: reportDetails,
                        timestamp: new Date().toISOString()
                    };

                    ReportFormDB.push(newReport).then(() => {
                        document.getElementById('name').value = '';
                        document.getElementById('issue').value = '';
                        document.getElementById('email').value = '';
                        alert('Report submitted successfully!');
                    }).catch(error => {
                        console.error('Error submitting report:', error);
                    });
                } else {
                    alert('Please fill in both fields.');
                }
            }).catch(errorMessage => {
                document.getElementById('error-message').innerHTML = errorMessage;
            });
        });
    } else {
        console.error('ReportForm element not found');
    }

    // Function to display report complaints
    function displayReports() {
        const manageReportsContainer = document.getElementById('manageReportsContainer');
        if (!manageReportsContainer) {
            console.error('manageReportsContainer element not found');
            return;
        }

        ReportFormDB.once('value', function(snapshot) {
            const reports = snapshot.val();
            manageReportsContainer.innerHTML = '';

            if (reports) {
                for (const key in reports) {
                    if (reports.hasOwnProperty(key)) {
                        const report = reports[key];
                        const reportDiv = document.createElement('div');
                        reportDiv.className = 'complaint-container';
                        reportDiv.setAttribute('data-key', key); // Set a data attribute to identify the complaint
                        reportDiv.innerHTML = `
                            <div class="complaint-title">${report.title || 'No Title'}</div>
                            <div class="complaint-details">${report.details || 'No Details'}</div>
                            <small>Submitted on: ${new Date(report.timestamp).toLocaleString()}</small>
                            <div class="reply-section">
                                <textarea id="reply-${key}" class="form-control" rows="3" placeholder="Write your reply here..."></textarea>
                                <button class="btn btn-primary reply-btn" onclick="replyToComplaint('${key}')">Send Reply</button>
                            </div>
                        `;
                        manageReportsContainer.appendChild(reportDiv);
                    }
                }
            } else {
                manageReportsContainer.innerHTML = '<p>No reports found.</p>';
            }
        }).catch(error => {
            console.error('Error fetching reports:', error);
        });
    }

    // Function to reply to a complaint
    window.replyToComplaint = function(key) {
        checkUserLoggedIn().then(user => {
            const replyText = document.getElementById(`reply-${key}`).value.trim();
            if (replyText) {
                const complaintRef = ReportFormDB.child(key);
                complaintRef.update({
                    reply: replyText,
                    replied: true
                }).then(() => {
                    const complaintElement = document.querySelector(`.complaint-container[data-key="${key}"]`);
                    if (complaintElement) {
                        complaintElement.remove();
                        alert('Reply sent successfully!');
                    } else {
                        console.error('Complaint element not found');
                    }
                }).catch(error => {
                    console.error('Error sending reply:', error);
                });
            } else {
                alert('Please enter a reply.');
            }
        }).catch(errorMessage => {
            document.getElementById('error-message').innerHTML = errorMessage;
        });
    };

    // Load report data on page load
    displayReports();

    // Event listener for gym form submission
    document.getElementById('gymForm').addEventListener('submit', function(e) {
        e.preventDefault();

        checkUserLoggedIn().then(user => {
            const id = document.getElementById('inputId').value;
            const name = document.getElementById('inputName').value;
            const image = document.getElementById('inputImage').files[0];

            if (image) {
                const storageRef = storage.ref('gym_images/' + image.name);
                storageRef.put(image).then(function(snapshot) {
                    snapshot.ref.getDownloadURL().then(function(url) {
                        saveGym(id, name, url);
                    }).catch(function(error) {
                        console.error('Error getting download URL:', error);
                    });
                }).catch(function(error) {
                    console.error('Error uploading image:', error);
                });
            } else {
                saveGym(id, name, '');
            }
        }).catch(errorMessage => {
            document.getElementById('error-message').innerHTML = errorMessage;
        });
    });

    // Function to save gym information
    function saveGym(id, name, imageUrl) {
        const newGymRef = gymRef.push();
        newGymRef.set({
            id: id,
            name: name,
            imageUrl: imageUrl
        }, function(error) {
            if (error) {
                alert(error.message);
            } else {
                alert('Gym information saved successfully!');
                document.getElementById('gymForm').reset();
                displayGymDetails();
            }
        });
    }

    // Function to display gym details in the modal
    function displayGymDetails() {
        gymRef.once('value', function(snapshot) {
            const gyms = snapshot.val();
            const gymDetailsBody = document.getElementById('gymDetailsBody');
            gymDetailsBody.innerHTML = '';

            for (const key in gyms) {
                if (gyms.hasOwnProperty(key)) {
                    const gym = gyms[key];
                    const row = `<tr>
                        <td>${gym.id}</td>
                        <td>${gym.name}</td>
                        <td><img src="${gym.imageUrl}" alt="Gym Photo" style="width: 100px; height: auto;"/></td>
                    </tr>`;
                    gymDetailsBody.innerHTML += row;
                }
            }
        });
    }

    // Display gym details when the modal is opened
    $('#gymModal').on('show.bs.modal', function () {
        displayGymDetails();

        const signupForm = document.getElementById('signupForm');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
    
        // Function to clear messages after a delay
        function clearMessages() {
            setTimeout(() => {
                errorMessage.textContent = '';
                successMessage.textContent = '';
            }, 5000); // 5000ms = 5 seconds
        }
    
        // Function to get the next ID for a given role using transaction
        async function getNextId(role) {
            const idRef = ref(database, `RoleIds/${role}`);
            
            try {
                // Run a transaction to ensure ID is incremented atomically
                const updatedId = await runTransaction(idRef, (currentId) => {
                    if (currentId === null) {
                        return 0; // Start with ID 1 if no ID exists
                    } else {
                        return currentId + 1; // Increment ID
                    }
                });

                // Check if the transaction was successful
                if (updatedId.committed) {
                    console.log(`Next ID for ${role}: ${updatedId.snapshot.val()}`);
                    return updatedId.snapshot.val();
                } else {
                    throw new Error("Transaction was not committed.");
                }
            } catch (error) {
                console.error("Error updating ID:", error);
                throw new Error("Failed to get next ID.");
            }
        }
    
        // Listen for form submit
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            // Get form values
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = document.getElementById('role').value || 'admin'; // Default to 'admin' if no role is selected
    
            // Validate form fields
            if (!username || !email || !password || !confirmPassword) {
                errorMessage.textContent = "Please fill in all the fields.";
                clearMessages();
                return;
            }
            if (password !== confirmPassword) {
                errorMessage.textContent = "Passwords do not match.";
                clearMessages();
                return;
            }
    
            try {
                // Create user with email and password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const uid = user.uid;
    
                // Get the next ID for the role
                const nextId = await getNextId(role);
    
                // Save user data to the database
                const userData = {
                    id: nextId,
                    username: username,
                    email: email,
                    role: role, // Save role as provided or default to 'admin'
                };
    
                await set(ref(database, 'Accounts/' + uid), userData);
    
                // Display success message
                successMessage.textContent = "Sign up successful. You can now log in.";
                errorMessage.textContent = '';  // Clear any previous error message
                signupForm.reset();  // Reset the form
    
                // Clear the success message after 5 seconds
                clearMessages();
            } catch (error) {
                errorMessage.textContent = error.message;
                clearMessages();
            }
        });
    });

