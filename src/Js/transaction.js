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

// Show transactions of the selected type in a table
function showTransactions(type) {
    const displayArea = document.getElementById('transactionsDisplay');
    displayArea.innerHTML = ''; // Clear previous transactions

    const transactionList = transactions[type];

    if (transactionList.length === 0) {
        displayArea.innerHTML = `<p>No transactions found for ${type.charAt(0).toUpperCase() + type.slice(1)}.</p>`;
        return;
    }

    let tableHTML = `
        <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Transactions</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Transaction ID</th>
                    <th>Details</th>
                    <th>Date</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Loop through the transaction list and add rows dynamically
    transactionList.forEach(transaction => {
        tableHTML += `
            <tr>
                <td>${transaction.id || 'N/A'}</td>
                <td>${JSON.stringify(transaction.details || 'N/A')}</td>
                <td>${transaction.date || 'N/A'}</td>
                <td>${transaction.amount || 'N/A'}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;

    // Append the generated table to the display area
    displayArea.innerHTML = tableHTML;
}
