// PASTE YOUR GOOGLE SHEET CSV LINK BELOW INSIDE THE QUOTES
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

const container = document.getElementById('data-container');

// Check if URL is still the placeholder
if (sheetURL.includes('https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv')) {
    container.innerHTML = '<p style="color:red">Error: You need to edit script.js and add your Google Sheet CSV link!</p>';
} else {
    Papa.parse(sheetURL, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            container.innerHTML = ''; 
            data.forEach(row => {
                // Adjust 'row.Name' to match your actual Google Sheet headers
                if(row.Name) { 
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <h2>${row.Name}</h2>
                        <p>${row.Description || ''}</p>
                        <strong>${row.Price || ''}</strong>
                    `;
                    container.appendChild(card);
                }
            });
        },
        error: function(err) {
            container.innerHTML = '<p>Error loading data. Check console.</p>';
        }
    });
}
