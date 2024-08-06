document.addEventListener('DOMContentLoaded', () => {
    const errorMessage = document.getElementById('errorMessage');
    const guestButton = document.getElementById('guestButton');
    const guestDropdown = document.getElementById('guestDropdown');
    const logoutButton = document.getElementById('logoutButton');
    const guestButtonItem = document.getElementById('guestButtonItem');
    const contactForm = document.getElementById('contact-form');
    const guestIdContainer = document.getElementById('guest-id'); // Ensure this exists

    // Function to show the error message and hide it after 2 seconds
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 2000); // Hide after 2 seconds
        }
    }

    // Function to generate a random guest ID
    function generateGuestId() {
        return `GuestId-${Math.floor(Math.random() * 10000)}`;
    }

    // Function to update UI based on guest login state
    function updateUIForGuest() {
        const guestId = localStorage.getItem('guestId');
        if (guestId) {
            guestIdContainer.textContent = `${guestId}`;
            guestButtonItem.style.display = 'none'; // Hide the guest button
            guestDropdown.style.display = 'block'; // Show the dropdown menu
        } else {
            guestIdContainer.textContent = 'Your Guest ID: N/A';
            guestButtonItem.style.display = 'block'; // Show the guest button
            guestDropdown.style.display = 'none'; // Hide the dropdown menu
        }
    }

    // Initial UI update
    updateUIForGuest();

    // Handle guest login with delay
    if (guestButton) {
        guestButton.addEventListener('click', event => {
            event.preventDefault(); // Prevent default button behavior

            // Show loading state or delay
            setTimeout(() => {
                // Generate and store a new guest ID
                const guestId = generateGuestId();
                localStorage.setItem('guestId', guestId);

                // Update the UI to reflect the logged-in guest
                updateUIForGuest();
            }, 1500); // Delay for 1500 milliseconds
        });
    }

    // Handle guest log out with delay
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Show loading state or delay
            setTimeout(() => {
                // Remove the guest ID from localStorage
                localStorage.removeItem('guestId');
                
                // Update the UI to reflect the guest logout
                updateUIForGuest();
            }, 1500); // Delay for 1500 milliseconds
        });
    }

 });

