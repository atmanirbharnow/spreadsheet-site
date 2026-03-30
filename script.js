// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

const container = document.getElementById('data-container');

// ✅ Load and display data
Papa.parse(sheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        const data = results.data;
        container.innerHTML = ''; // Clear loading message
        
        // Loop through each row and create a card
        data.forEach(row => {
            // Skip empty rows; adjust 'row.Name' to match your sheet headers
            if (row.Name && row.Name.trim() !== '') {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h2>${row.Name}</h2>
                    <p>${row.Description || ''}</p>
                    ${row.Price ? `<strong>₹${row.Price}</strong>` : ''}
                `;
                container.appendChild(card);
            }
        });
        
        // Show message if no data found
        if (data.length === 0 || !data[0]?.Name) {
            container.innerHTML = '<p>No data found. Check your Google Sheet headers.</p>';
        }
    },
    error: function(err) {
        console.error('PapaParse error:', err);
        container.innerHTML = '<p style="color:#e74c3c">Error loading data. Check console (F12).</p>';
    }
});
