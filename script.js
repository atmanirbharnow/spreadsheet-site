// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

const container = document.getElementById('data-container');
const statsBar = document.getElementById('stats-bar');

// ✅ Load and display data
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data.filter(row => row["Intervention Type"]?.trim());
    
    // Clear loading state
    container.innerHTML = '';
    
    if (data.length === 0) {
      container.innerHTML = '<div class="empty-state">No interventions found. Add data to your Google Sheet!</div>';
      return;
    }

    // 📊 Calculate & display stats
    const totalActions = data.reduce((sum, row) => sum + (parseInt(row["# of Actions"]) || 0), 0);
    const totalCO2 = data.reduce((sum, row) => sum + (parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0), 0);
    const totalSaved = data.reduce((sum, row) => sum + (parseFloat(row["amount saved till date"]) || 0), 0);
    const uniqueTypes = new Set(data.map(row => row["Intervention Type"])).size;

    // Format numbers nicely
    document.getElementById('total-actions').textContent = totalActions.toLocaleString();
    document.getElementById('total-co2').textContent = totalCO2.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' t';
    document.getElementById('total-saved').textContent = '₹' + (totalSaved/100000).toFixed(2) + ' L';
    document.getElementById('total-interventions').textContent = uniqueTypes;

    // 🃏 Create cards for each intervention
    data.forEach(row => {
      const card = document.createElement('div');
      card.className = 'card';
      
      // Format amount saved with commas
      const amount = row["amount saved till date"];
      const formattedAmount = amount ? '₹' + parseFloat(amount).toLocaleString('en-IN') : '₹0';
      
      card.innerHTML = `
        <h2>${row["Intervention Type"]}</h2>
        <p><span>🔢 Actions:</span> <strong>${row["# of Actions"] || '–'}</strong></p>
        <p><span>⚡ Activity:</span> <strong>${row["Total Activity (e.g., kW, m³, units)"] || '–'}</strong></p>
        <p><span>🌱 Annual tCO₂e:</span> <span class="highlight">${row["Annual tCO₂e Saved (conservative)"] || '0'} t</span></p>
        <p><span>💰 Saved to Date:</span> <strong>${formattedAmount}</strong></p>
        <small>📊 Source: ${row["Emission Factor Source"] || 'Earth Carbon Registry'}</small>
      `;
      
      container.appendChild(card);
    });
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    container.innerHTML = '<div class="empty-state" style="color:#e74c3c">⚠️ Could not load data. Please try again later.</div>';
  }
});
