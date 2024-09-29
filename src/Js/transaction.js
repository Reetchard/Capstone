const transactions = {
    memberships: [],
    gymProfiles: [],
    trainers: [],
    products: []
};

// Fetch transactions on page load
window.onload = function() {
    fetchTransactions();
};

// Fetch all transactions from the backend
function fetchTransactions() {
    fetch('/api/getTransactions')
        .then(response => response.json())
        .then(data => {
            transactions.memberships = data.memberships;
            transactions.gymProfiles = data.gymProfiles;
            transactions.trainers = data.trainers;
            transactions.products = data.products;
            showTransactions('memberships'); // Show memberships by default
        })
        .catch(error => console.error('Error fetching transactions:', error));
}

// Show transactions of the selected type
function showTransactions(type) {
    const displayArea = document.getElementById('transactionsDisplay');
    displayArea.innerHTML = ''; // Clear previous transactions

    const transactionList = transactions[type];
    if (transactionList.length === 0) {
        displayArea.innerHTML = `<p>No transactions found for ${type.charAt(0).toUpperCase() + type.slice(1)}.</p>`;
        return;
    }

    const list = document.createElement('ul');
    transactionList.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.textContent = JSON.stringify(transaction); // Format as needed
        list.appendChild(listItem);
    });

    displayArea.appendChild(list);
}
