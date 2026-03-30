// ✅ Your Google Sheet CSV link (KEEP YOUR EXISTING LINK)
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

// ✅ Load and display data
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    // Filter: Keep only rows with Intervention Type, exclude "Total" row
    const data = results.data.filter(row => {
      const type = row["Intervention Type"]?.trim();
      return type && type !== "**Total**" && type.toLowerCase() !== "total";
    });
    
    if (data.length === 0) {
      document.querySelector('.chart-container').innerHTML = 
        '<p style="text-align:center;color:#7f8c8d;padding:40px">No data found. Add data to your Google Sheet.</p>';
      return;
    }

    // 📊 Calculate stats (handle empty values with || 0)
    const totalActions = data.reduce((sum, row) => sum + (parseInt(row["# of Actions"]) || 0), 0);
    const totalCO2 = data.reduce((sum, row) => sum + (parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0), 0);
    const totalSaved = data.reduce((sum, row) => sum + (parseFloat(row["amount saved till date"]) || 0), 0);
    const uniqueTypes = new Set(data.map(row => row["Intervention Type"])).size;

    // 📊 Display stats with nice formatting
    document.getElementById('total-actions').textContent = totalActions.toLocaleString('en-IN');
    document.getElementById('total-co2').textContent = totalCO2.toLocaleString('en-IN', {maximumFractionDigits: 0}) + ' t';
    
    // Format ₹: Show in Lakhs/Crores for large numbers
    const formattedSaved = formatINR(totalSaved);
    document.getElementById('total-saved').textContent = formattedSaved;
    
    document.getElementById('total-interventions').textContent = uniqueTypes;

    // 📈 Render chart
    renderChart(data);
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    document.querySelector('.chart-container').innerHTML = 
      '<p style="text-align:center;color:#e74c3c;padding:40px">⚠️ Could not load data. Check your Google Sheet link.</p>';
  }
});

// 💰 Helper: Format Indian Rupees (₹) nicely
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
  // Aggregate CO2 by intervention type (handle empty values)
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
              // Shorten long labels on mobile
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
