// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

const container = document.getElementById('data-container');

// ✅ Load and display data with YOUR headers
Papa.parse(sheetURL, {
    download: true,
    header: true,
    complete: function(results) {
        const data = results.data;
        container.innerHTML = ''; // Clear loading message
        
        // Loop through each row and create a card
        data.forEach(row => {
            // Skip empty rows; use YOUR header name with brackets for spaces
            const intervention = row["Intervention Type"];
            
            if (intervention && intervention.trim() !== '') {
                const card = document.createElement('div');
                card.className = 'card';
                
                // Build card content using YOUR column names
                card.innerHTML = `
                    <h2>${row["Intervention Type"]}</h2>
                    <p><strong>Actions:</strong> ${row["# of Actions"] || 'N/A'}</p>
                    <p><strong>Activity:</strong> ${row["Total Activity (e.g., kW, m³, units)"] || ''}</p>
                    <p><strong>Annual tCO₂e Saved:</strong> ${row["Annual tCO₂e Saved (conservative)"] || ''}</p>
                    <p><strong>Amount Saved:</strong> ₹${row["amount saved till date"] || '0'}</p>
                    <small><em>Source: ${row["Emission Factor Source"] || ''}</em></small>
                `;
                
                container.appendChild(card);
            }
        });
        
        // Show message if no data found
        if (data.length === 0 || !data[0]?.["Intervention Type"]) {
            container.innerHTML = '<p>No data found. Check your Google Sheet has data in Row 2+.</p>';
        }
    },
    error: function(err) {
        console.error('PapaParse error:', err);
        container.innerHTML = '<p style="color:#e74c3c">Error loading data. Check console (F12).</p>';
    }
});
