// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

// Store data globally for table
let allData = [];

// ✅ Load and display data
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    // Filter: Keep only rows with Intervention Type, exclude "Total" row
    allData = results.data.filter(row => {
      const type = row["Intervention Type"]?.trim();
      return type && type !== "**Total**" && type.toLowerCase() !== "total";
    });
    
    if (allData.length === 0) {
      document.querySelector('.chart-container').innerHTML = 
        '<p style="text-align:center;color:#7f8c8d;padding:40px">No data found.</p>';
      document.getElementById('table-body').innerHTML = 
        '<tr><td colspan="6" style="text-align:center;padding:40px;color:#7f8c8d">No data found.</td></tr>';
      return;
    }

    // 📊 Calculate stats
    const totalActions = allData.reduce((sum, row) => sum + (parseInt(row["# of Actions"]) || 0), 0);
    const totalCO2 = allData.reduce((sum, row) => sum + (parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0), 0);
    const totalSaved = allData.reduce((sum, row) => sum + (parseFloat(row["amount saved till date"]) || 0), 0);
    const uniqueTypes = new Set(allData.map(row => row["Intervention Type"])).size;

    // 📊 Display stats
    document.getElementById('total-actions').textContent = totalActions.toLocaleString('en-IN');
    document.getElementById('total-co2').textContent = totalCO2.toLocaleString('en-IN', {maximumFractionDigits: 0}) + ' t';
    document.getElementById('total-saved').textContent = formatINR(totalSaved);
    document.getElementById('total-interventions').textContent = uniqueTypes;

    // 📈 Render chart
    renderChart(allData);
    
    // 📋 Render table
    renderTable(allData, totalActions, totalCO2, totalSaved);
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    document.querySelector('.chart-container').innerHTML = 
      '<p style="text-align:center;color:#e74c3c;padding:40px">⚠️ Could not load data.</p>';
    document.getElementById('table-body').innerHTML = 
      '<tr><td colspan="6" style="text-align:center;padding:40px;color:#e74c3c">⚠️ Could not load data.</td></tr>';
  }
});

// 💰 Format Indian Rupees
function formatINR(amount) {
  if (!amount || amount === 0) return '₹0';
  const num = parseFloat(amount);
  if (num >= 10000000) {
    return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  } else if (num >= 100000) {
    return '₹' + (num / 100000).toFixed(2) + ' L';
  } else {
    return '₹' + num.toLocaleString('en-IN');
  }
}

// 📈 Render line chart
function renderChart(data) {
  const co2ByType = {};
  data.forEach(row => {
    const type = row["Intervention Type"]?.trim();
    if (!type) return;
    const co2 = parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0;
    co2ByType[type] = (co2ByType[type] || 0) + co2;
  });

  const labels = Object.keys(co2ByType);
  const values = Object.values(co2ByType);

  const ctx = document.getElementById('co2-chart').getContext('2d');
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Annual tCO₂e Saved',
        data: values,
        borderColor: 'rgba(39, 174, 96, 1)',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(39, 174, 96, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(44, 62, 80, 0.95)',
          padding: 10,
          callbacks: {
            label: function(context) {
              return `${context.parsed.y.toLocaleString('en-IN', {maximumFractionDigits:0})} tCO₂e`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'tCO₂e Saved / Year' },
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            callback: function(value) {
              return value.toLocaleString('en-IN') + ' t';
            }
          }
        },
        x: {
          title: { display: true, text: 'Intervention Type' },
          grid: { display: false },
          ticks: { 
            maxRotation: 45, 
            minRotation: 45, 
            font: {size: 9},
            callback: function(value, index) {
              const label = labels[index] || '';
              if (window.innerWidth < 480 && label.length > 15) {
                return label.substring(0, 12) + '...';
              }
              return label;
            }
          }
        }
      },
      animation: { duration: 600 }
    }
  });
}

// 📋 Render data table
function renderTable(data, totalActions, totalCO2, totalSaved) {
  const tbody = document.getElementById('table-body');
  const tfoot = document.getElementById('table-footer');
  
  // Clear loading state
  tbody.innerHTML = '';
  
  // Add rows for each intervention
  data.forEach(row => {
    const tr = document.createElement('tr');
    
    const interventionType = row["Intervention Type"] || '';
    const actions = row["# of Actions"] || '0';
    const activity = row["Total Activity (e.g., kW, m³, units)"] || '-';
    const co2Saved = row["Annual tCO₂e Saved (conservative)"] || '0';
    const amountSaved = row["amount saved till date"] || '';
    const source = row["Emission Factor Source"] || '';
    
    tr.innerHTML = `
      <td><strong>${interventionType}</strong></td>
      <td>${parseInt(actions).toLocaleString('en-IN')}</td>
      <td>${activity}</td>
      <td>${parseFloat(co2Saved).toLocaleString('en-IN', {maximumFractionDigits:0})} t</td>
      <td>${amountSaved ? '₹' + parseFloat(amountSaved).toLocaleString('en-IN') : '-'}</td>
      <td style="font-size:0.85rem;color:var(--gray)">${source || '-'}</td>
    `;
    
    tbody.appendChild(tr);
  });
  
  // Add total row
  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
    <td><strong>TOTAL</strong></td>
    <td><strong>${totalActions.toLocaleString('en-IN')}</strong></td>
    <td>-</td>
    <td><strong>${totalCO2.toLocaleString('en-IN', {maximumFractionDigits:0})} t</strong></td>
    <td><strong>${formatINR(totalSaved)}</strong></td>
    <td>-</td>
  `;
  
  tfoot.appendChild(totalRow);
}
