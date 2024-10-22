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


 
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

// Firebase references
const auth = firebase.auth();
const database = firebase.database();
const MemberRef = database.ref('Member');
//Starting code
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
// Function to display all Member
      function displayMemberInfo() {
        MemberRef.once('value', function(snapshot) {
            const members = snapshot.val();
            const MemberInfoBody = document.getElementById('MemberInfoBody');
            MemberInfoBody.innerHTML = ''; // Clear the table before populating
            
            if (members) {
                for (const key in members) {
                    if (members.hasOwnProperty(key)) {
                        const memberData = members[key];
                        const roleId = memberData.roleId || 'N/A';
                        const username = memberData.username || 'N/A';
                        const status = memberData.status || 'N/A';
                        const isAdmin = roleId === 'admin'; // Adjust this condition based on your roleId for Admin
        
                        // Create a new row for each member
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><input type="checkbox" class="selectMember" value="${key}" ${isAdmin ? 'disabled' : ''}></td>
                            <td>${roleId}</td>
                            <td><a href="#" onclick="viewMemberDetails('${key}'); return false;">${username}</a></td>
                            <td>${status}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Under review')" ${isAdmin ? 'disabled' : ''}>Review</button>
                                <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')" ${isAdmin ? 'disabled' : ''}>Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="blockMember('${key}')" ${isAdmin ? 'disabled' : ''}>Block</button>
                            </td>
                        `;
        
                        // Append the row to the table body
                        MemberInfoBody.appendChild(row);
                    }
                }
            } else {
                // If no members are found, display a message
                MemberInfoBody.innerHTML = '<tr><td colspan="8">No Members found.</td></tr>'; // Adjust colspan to match table
            }
        }).catch(error => {
            console.error('Error fetching data:', error);
            showToast('Error', 'Error fetching Member data. Please try again later.');
        });
        
 // Function to get the next ID
    function getNextId(callback) {
        MemberRef.once('value', function(snapshot) {
            const Members = snapshot.val();
            let maxId = 0;
    
            if (Members) {
                for (const key in Members) {
                    if (Members.hasOwnProperty(key)) {
                        const Members = Members[key];
                        const MembersId = parseInt(Members.id, 10);
                        if (!isNaN(MembersId) && MembersId > maxId) {
                            maxId = MembersId;
                        }
                    }
                }
            }
    
            callback(maxId + 1);
        }).catch(error => {
            console.error('Error fetching data for ID:', error);
            showToast('Error', 'Unable to determine next ID. Defaulting to 1.');
            callback(1);
        });
    }
// Function to add or edit Members
document.getElementById('MembersForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const memberPlanStartDate = document.getElementById('memberPlanStartDate').value.trim(); // Assuming you have this field
    const endDate = document.getElementById('endDate').value.trim(); // Assuming you have this field
    const PaymentMethod = document.getElementById('paymentMethod').value.trim(); // Assuming you have this field
    const key = document.getElementById('MembersKey').value;

    if (username && email && memberPlanStartDate && endDate && PaymentMethod) {
        getNextId(function(nextId) {
            const MembersData = {
                roleId: nextId,
                username,
                email,
                memberPlanStartDate,
                endDate,
                PaymentMethod,
                status: 'Active',
            };

            if (key) {
                MembersRef.child(key).update(MembersData).then(() => {
                    $('#MembersModal').modal('hide');
                    displayMembersInfo();
                    showToast('Success', 'Member updated successfully.');
                }).catch(error => {
                    console.error('Error updating Member:', error);
                    showToast('Error', 'Error updating Member. Please try again later.');
                });
            } else {
                MemberRef.push(MembersData).then(() => {
                    $('#MembersModal').modal('hide');
                    displayMembersInfo();
                    showToast('Success', 'Member added successfully.');
                }).catch(error => {
                    console.error('Error adding Member:', error);
                    showToast('Error', 'Error adding Member. Please try again later.');
                });
            }
        });
    } else {
        showToast('Error', 'Please fill in all required fields.');
    }
});

// Function to edit Member
window.editMember = function(key) {
    MemberRef.child(key).once('value', function(snapshot) {
        const member = snapshot.val();
        const roleId = member.roleId;

        // Check if the Member is a Gym Owner
        if (roleId.toLowerCase() === 'gym owner') { // Adjust this condition based on your roleId for Gym Owner
            showToast('Warning', 'Cannot edit Gym Owner.');
            return;
        }

        // Populate form fields with member data
        document.getElementById('username').value = member.username;
        document.getElementById('email').value = member.email;
        document.getElementById('MemberKey').value = key;
        $('#MemberModal').modal('show');
    }).catch(error => {
        console.error('Error fetching Member data:', error);
        showToast('Error', 'Error fetching Member data. Please try again later.');
    });
};

// Function to set the status of a Member
window.setStatus = function(key, status) {
    MemberRef.child(key).update({ status: status }).then(() => {
        displayMemberInfo();
        handleSuccess(`${status} successfully.`);
    }).catch(error => {
        console.error(`Error updating Member status: ${error}`);
        handleError('There was an issue updating the Member status. Please try again or contact support if the problem persists.');
    });
};

// Ensure you have these functions defined somewhere in your code
function showToast(type, message) {
    // Implementation for showing toast notifications
}

function handleSuccess(message) {
    // Implementation for handling success messages
}

function handleError(message) {
    // Implementation for handling error messages
}

function displayMemberInfo() {
    // Implementation to refresh or display member information
}


// Function to delete selected Members
window.deleteSelected = function() {
    const selectedCheckboxes = document.querySelectorAll('.selectMember:checked');
    const messageContainer = document.createElement('div');
    
    // Set message container styles
    messageContainer.style.position = 'fixed';
    messageContainer.style.top = '50%';
    messageContainer.style.left = '50%';
    messageContainer.style.transform = 'translate(-50%, -50%)'; // Center the message horizontally and vertically
    messageContainer.style.padding = '15px 25px';
    messageContainer.style.zIndex = '9999';
    messageContainer.style.backgroundColor = '#f8d7da'; // Default for error/warning
    messageContainer.style.color = '#721c24';
    messageContainer.style.borderRadius = '5px';
    messageContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    messageContainer.style.fontSize = '16px';
    messageContainer.style.fontWeight = 'bold';
    messageContainer.style.textAlign = 'center';
    messageContainer.style.display = 'none'; // Hidden initially
    
    // Add the message container to the body
    document.body.appendChild(messageContainer);

    // Function to show a message
    const showMessage = (type, text) => {
        messageContainer.innerText = text;
        if (type === 'success') {
            messageContainer.style.backgroundColor = '#d4edda';
            messageContainer.style.color = '#155724';
        } else if (type === 'warning') {
            messageContainer.style.backgroundColor = '#fff3cd';
            messageContainer.style.color = '#856404';
        } else {
            messageContainer.style.backgroundColor = '#f8d7da';
            messageContainer.style.color = '#721c24';
        }
        
        // Display the message container
        messageContainer.style.display = 'block';

        // Hide the message after 3 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 3000); // 3 seconds delay
    };

    // If no Members are selected, show warning message
    if (selectedCheckboxes.length === 0) {
        showMessage('warning', '⚠️ Please select at least one Members to delete.');
        return;
    }

    // Create custom confirmation modal
    const confirmationModal = document.createElement('div');
    confirmationModal.style.position = 'fixed';
    confirmationModal.style.top = '50%';
    confirmationModal.style.left = '50%';
    confirmationModal.style.transform = 'translate(-50%, -50%)';
    confirmationModal.style.backgroundColor = '#ffffff';
    confirmationModal.style.padding = '20px';
    confirmationModal.style.borderRadius = '8px';
    confirmationModal.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    confirmationModal.style.zIndex = '10000'; // Ensure it's above everything
    confirmationModal.style.textAlign = 'center';

    const confirmationText = document.createElement('p');
    confirmationText.innerText = 'Are you sure you want to delete the selected Members?';
    confirmationText.style.marginBottom = '20px';
    confirmationModal.appendChild(confirmationText);

    // Create "Yes" button
    const yesButton = document.createElement('button');
    yesButton.innerText = 'Yes';
    yesButton.style.marginRight = '10px';
    yesButton.style.padding = '10px 15px';
    yesButton.style.backgroundColor = '#28a745';
    yesButton.style.color = '#ffffff';
    yesButton.style.border = 'none';
    yesButton.style.borderRadius = '5px';
    yesButton.style.cursor = 'pointer';
    yesButton.onclick = () => {
        // Perform the deletion
        selectedCheckboxes.forEach(checkbox => {
            const key = checkbox.value;
            MemberRef.child(key).remove().catch(error => {
                console.error('Error deleting Member:', error);
                showMessage('error', '❌ An error occurred while deleting Member. Please try again later.');
            });
        });

        // Refresh the Member info and show success message
        displayMemberInfo();
        showMessage('success', '✅ The selected Member have been deleted successfully.');
        
        // Close the modal
        document.body.removeChild(confirmationModal);
    };

    // Create "Cancel" button
    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.style.padding = '10px 15px';
    cancelButton.style.backgroundColor = '#dc3545';
    cancelButton.style.color = '#ffffff';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '5px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.onclick = () => {
        // Close the modal without deleting
        document.body.removeChild(confirmationModal);
    };

    // Add buttons to the modal
    confirmationModal.appendChild(yesButton);
    confirmationModal.appendChild(cancelButton);

    // Append the modal to the body
    document.body.appendChild(confirmationModal);
};


// Function to toggle all checkboxes
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.selectMember');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
};

// Display Member information on page load
displayMemberInfo();

function searchMember() {
    const searchId = document.getElementById('searchMemberId').value.trim();
    MemberRef.once('value', function(snapshot) {
        const members = snapshot.val();
        const memberInfoBody = document.getElementById('MemberInfoBody');
        memberInfoBody.innerHTML = '';

        if (members) {
            let found = false;
            for (const key in members) {
                if (members.hasOwnProperty(key)) {
                    const member = members[key];
                    if (member.roleId.toString().includes(searchId)) {
                        const row = document.createElement('tr');
                        const status = member.status || 'N/A';
                        row.innerHTML = `
                            <td><input type="checkbox" class="selectMember" value="${key}"></td>
                            <td>${member.roleId || 'N/A'}</td>
                            <td><a href="#" onclick="viewMemberDetails('${key}'); return false;">${member.username || 'N/A'}</a></td>
                            <td>${status}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick="setStatus('${key}', 'Idle')">Idle</button>
                                <button class="btn btn-success btn-sm" onclick="setStatus('${key}', 'Approved')">Approve</button>
                                <button class="btn btn-danger btn-sm" onclick="removeMember('${key}')">Remove</button>
                            </td>
                        `;
                        memberInfoBody.appendChild(row);
                        found = true;
                    }
                }
            }

            if (!found) {
                memberInfoBody.innerHTML = '<tr><td colspan="5">No Members found with this ID.</td></tr>';
            }
        } else {
            memberInfoBody.innerHTML = '<tr><td colspan="5">No Members found.</td></tr>';
        }
    }).catch(error => {
        console.error('Error fetching data:', error);
        showToast('Error', 'Error fetching Member data. Please try again later.');
    });
}

window.blockMember = function(key) {
    if (confirm('Are you sure you want to block this Member?')) {
        MemberRef.child(key).update({ status: 'Blocked' }).then(() => {
            displayMemberInfo();
            handleSuccess('The Member has been successfully blocked.');
        }).catch(error => {
            console.error('Error blocking Member:', error);
            handleError('We encountered an issue blocking the Member. Please try again later.');
        });
    }       
};

function loadMembers() {
    const memberInfoBody = document.getElementById('MemberInfoBody');
    memberInfoBody.innerHTML = ''; // Clear existing content

    database.ref('Members').once('value').then(snapshot => {
        snapshot.forEach(childSnapshot => {
            const member = childSnapshot.val();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="table-checkbox" value="${childSnapshot.key}"></td>
                <td>${member.id}</td>
                <td><a href="#" onclick="viewMemberDetails('${childSnapshot.key}')">${member.username}</a></td>
                <td>${member.status}</td>
                <td><button class="btn btn-warning" onclick="viewMemberDetails('${childSnapshot.key}')">View Details</button></td>
            `;
            memberInfoBody.appendChild(row);
        });
    }).catch(error => {
        console.error('Error loading members:', error);
        showToast('Error', 'Error loading Members. Please try again later.');
    });
}

function viewMemberDetails(key) {
    MemberRef.child(key).once('value', function(snapshot) {
        const member = snapshot.val();

        if (member) {
            // Populate the modal with Member details
            document.getElementById('username').value = member.username || 'N/A';
            document.getElementById('email').value = member.email || 'N/A';
            document.getElementById('status').value = member.status || 'N/A';
            document.getElementById('role').value = member.role || 'N/A';

            // Show special fields based on role (Gym Owner, Trainer, etc.)
            const specialFieldGroup = document.getElementById('specialFieldGroup');
            specialFieldGroup.innerHTML = '';

            if (member.role === 'Gym Owner') {
                specialFieldGroup.innerHTML = `
                    <div class="form-group">
                        <label for="gymName">Gym Name</label>
                        <input type="text" name="gymName" class="form-control" id="gymName" value="${member.gymName || 'N/A'}" readonly>
                    </div>
                `;
            } else if (member.role === 'Trainer') {
                specialFieldGroup.innerHTML = `
                    <div class="form-group">
                        <label for="certifications">Certifications</label>
                        <input type="text" name="certifications" class="form-control" id="certifications" value="${member.certifications || 'N/A'}" readonly>
                    </div>
                `;
            }

            $('#MemberModal').modal('show');
        } else {
            showToast('Error', 'Member not found.');
        }
    }).catch(error => {
        console.error('Error fetching Member data:', error);
        showToast('Error', 'Error fetching Member data. Please try again later.');
    });
}

function approveMember() {
    const key = document.getElementById('MemberKey').value;
    MemberRef.child(key).update({ status: 'Approved' }).then(() => {
        $('#MemberModal').modal('hide');
        displayMemberInfo();
        showToast('Success', 'Member approved successfully.');
    }).catch(error => {
        console.error('Error approving Member:', error);
        showToast('Error', 'Error approving Member. Please try again later.');
    });
}

function showNotification(type, message) {
    const notificationContainer = document.getElementById('notification-container');
    const notificationMessage = document.getElementById('notification-message');
    const notificationText = document.getElementById('notification-text');

    // Remove any existing classes
    notificationMessage.classList.remove('success', 'info', 'warning', 'error');

    // Set the type and message
    notificationMessage.classList.add(type);
    notificationText.textContent = message;

    // Show the notification
    notificationMessage.style.display = 'block';

    // Hide the notification after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
    }

    function hideNotification() {
        const notificationMessage = document.getElementById('notification-message');
        notificationMessage.style.display = 'none';
    }

    function handleSuccess(message) {
        showNotification('success', message);
    }

    function handleError(message) {
        showNotification('error', message);
    }
    }

    function manageMembership(action, membershipData) {
        const membershipRef = database.ref('Memberships'); // Reference to Memberships in Firebase
    
        if (action === 'add') {
            // Add a new membership
            membershipRef.push(membershipData)
                .then(() => {
                    showToast('Success', 'Membership added successfully.');
                    loadMemberships(); // Reload memberships to reflect the new data
                })
                .catch(error => {
                    console.error('Error adding membership:', error);
                    showToast('Error', 'Error adding membership. Please try again later.');
                });
        } else if (action === 'update') {
            const membershipID = membershipData.MembershipID;
            membershipRef.child(membershipID).update(membershipData)
                .then(() => {
                    showToast('Success', 'Membership updated successfully.');
                    loadMemberships(); // Reload memberships to reflect the updated data
                })
                .catch(error => {
                    console.error('Error updating membership:', error);
                    showToast('Error', 'Error updating membership. Please try again later.');
                });
        } else if (action === 'delete') {
            const membershipID = membershipData.MembershipID;
            membershipRef.child(membershipID).remove()
                .then(() => {
                    showToast('Success', 'Membership deleted successfully.');
                    loadMemberships(); // Reload memberships to reflect the deleted data
                })
                .catch(error => {
                    console.error('Error deleting membership:', error);
                    showToast('Error', 'Error deleting membership. Please try again later.');
                });
        } else {
            console.error('Invalid action:', action);
            showToast('Error', 'Invalid action specified.');
        }
    }
    
    function loadMemberships() {
        const membershipRef = database.ref('Memberships'); // Reference to Memberships in Firebase
        const membershipInfoBody = document.getElementById('membershipInfoBody');
        membershipInfoBody.innerHTML = ''; // Clear existing content
    
        membershipRef.once('value')
            .then(snapshot => {
                snapshot.forEach(childSnapshot => {
                    const membership = childSnapshot.val();
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${membership.AccessLevel || 'N/A'}</td>
                        <td>${membership.AllowedClasses || 'N/A'}</td>
                        <td>${membership.Amount || 'N/A'}</td>
                        <td>${membership.BillingID || 'N/A'}</td>
                        <td>${new Date(membership.EndDate).toLocaleString() || 'N/A'}</td>
                        <td>${membership.GuestPasses || 'N/A'}</td>
                        <td>${membership.MemberID || 'N/A'}</td>
                        <td>${membership.MembershipID || 'N/A'}</td>
                        <td>${membership.MembershipType || 'N/A'}</td>
                        <td>${membership.PaymentID || 'N/A'}</td>
                        <td>${membership.PaymentStatus || 'N/A'}</td>
                        <td>${new Date(membership.StartDate).toLocaleString() || 'N/A'}</td>
                        <td>${membership.Status || 'N/A'}</td>
                        <td>${new Date(membership.TransactionDate).toLocaleString() || 'N/A'}</td>
                        <td>${membership.TransactionID || 'N/A'}</td>
                        <td>${membership.referralCode || 'N/A'}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick="editMembership('${childSnapshot.key}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteMembership('${childSnapshot.key}')">Delete</button>
                        </td>
                    `;
                    membershipInfoBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading memberships:', error);
                showToast('Error', 'Error loading memberships. Please try again later.');
            });
    }
    
    function editMembership(membershipID) {
        const membershipRef = database.ref('Memberships').child(membershipID);
        membershipRef.once('value')
            .then(snapshot => {
                const membership = snapshot.val();
    
                if (membership) {
                    // Populate the form with membership details
                    document.getElementById('AccessLevel').value = membership.AccessLevel || '';
                    document.getElementById('AllowedClasses').value = membership.AllowedClasses || '';
                    document.getElementById('Amount').value = membership.Amount || '';
                    document.getElementById('BillingID').value = membership.BillingID || '';
                    document.getElementById('EndDate').value = new Date(membership.EndDate).toISOString() || '';
                    document.getElementById('GuestPasses').value = membership.GuestPasses || '';
                    document.getElementById('MemberID').value = membership.MemberID || '';
                    document.getElementById('MembershipID').value = membership.MembershipID || '';
                    document.getElementById('MembershipType').value = membership.MembershipType || '';
                    document.getElementById('PaymentID').value = membership.PaymentID || '';
                    document.getElementById('PaymentStatus').value = membership.PaymentStatus || '';
                    document.getElementById('StartDate').value = new Date(membership.StartDate).toISOString() || '';
                    document.getElementById('Status').value = membership.Status || '';
                    document.getElementById('TransactionDate').value = new Date(membership.TransactionDate).toISOString() || '';
                    document.getElementById('TransactionID').value = membership.TransactionID || '';
                    document.getElementById('referralCode').value = membership.referralCode || '';
    
                    // Show the modal
                    $('#membershipModal').modal('show');
                } else {
                    showToast('Error', 'Membership not found.');
                }
            })
            .catch(error => {
                console.error('Error fetching membership data:', error);
                showToast('Error', 'Error fetching membership data. Please try again later.');
            });
    }
    
    function deleteMembership(membershipID) {
        if (confirm('Are you sure you want to delete this membership?')) {
            manageMembership('delete', { MembershipID: membershipID });
        }
    }
    