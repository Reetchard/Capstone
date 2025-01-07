document.addEventListener('DOMContentLoaded', () => {
    const billingOverview = document.getElementById('billingOverview');
    const addBillingMethod = document.getElementById('addBillingMethod');
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    const currentUserId = getCurrentUserId();
    let billingRecords = JSON.parse(localStorage.getItem(`billingRecords_${currentUserId}`)) || [];
    let currentEditIndex = null;

    // Function to render billing records
    function renderBillingRecords() {
        billingOverview.innerHTML = ''; // Clear existing content
        billingRecords.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'billing-item';
            item.innerHTML = `
                <h5>${record.fullName}</h5>
                <p>Email: ${record.email}</p>
                <p>Phone: ${record.phone}</p>
                <p>Address: ${record.address}, ${record.city}, ${record.state}, ${record.zipcode}</p>
                <p>Payment Method: ${record.paymentMethod}</p>
                <button class="btn btn-warning btn-sm edit-button" data-index="${index}">Edit</button>
            `;
            billingOverview.appendChild(item);
        });

        // Add event listeners to edit buttons
        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                currentEditIndex = index;
                const record = billingRecords[index];
                document.getElementById('edit-fullName').value = record.fullName;
                document.getElementById('edit-email').value = record.email;
                document.getElementById('edit-phone').value = record.phone;
                document.getElementById('edit-address').value = record.address;
                document.getElementById('edit-city').value = record.city;
                document.getElementById('edit-state').value = record.state;
                document.getElementById('edit-zipcode').value = record.zipcode;
                document.getElementById('edit-paymentMethod').value = record.paymentMethod;
                editModal.show();
            });
        });
    }

    // Handle adding new billing method
    if (addBillingMethod) {
        addBillingMethod.addEventListener('click', () => {
            // Show modal for new entry
            currentEditIndex = null;
            document.getElementById('editBillingForm').reset();
            editModal.show();
        });
    }

    // Handle modal form submission
    document.getElementById('editBillingForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const record = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zipcode: formData.get('zipcode'),
            paymentMethod: formData.get('paymentMethod'),
        };

        if (currentEditIndex === null) {
            // Add new record
            billingRecords.push(record);
        } else {
            // Update existing record
            billingRecords[currentEditIndex] = record;
        }

        // Save updated records to localStorage for the current user
        localStorage.setItem(`billingRecords_${currentUserId}`, JSON.stringify(billingRecords));
        renderBillingRecords();
        editModal.hide();
    });

    // Initial render of billing records
    renderBillingRecords();
});
