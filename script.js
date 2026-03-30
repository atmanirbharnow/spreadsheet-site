// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

// ✅ Load and display data
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    const data = results.data.filter(row => row["Intervention Type"]?.trim());
    
    if (data.length === 0) {
      document.querySelector('.chart-container').innerHTML = 
        '<p style="text-align:center;color:#7f8c8d">No data found. Add interventions to your Google Sheet.</p>';
      return;
    }

    // 📊 Calculate & display stats
    const totalActions = data.reduce((sum, row) => sum + (parseInt(row["# of Actions"]) || 0), 0);
    const totalCO2 = data.reduce((sum, row) => sum + (parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0), 0);
    const totalSaved = data.reduce((sum, row) => sum + (parseFloat(row["amount saved till date"]) || 0), 0);
    const uniqueTypes = new Set(data.map(row => row["Intervention Type"])).size;

    document.getElementById('total-actions').textContent = totalActions.toLocaleString();
    document.getElementById('total-co2').textContent = totalCO2.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' t';
    document.getElementById('total-saved').textContent = '₹' + (totalSaved/100000).toFixed(2) + ' L';
    document.getElementById('total-interventions').textContent = uniqueTypes;

    // 📈 Render bar chart
    renderChart(data);
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    document.querySelector('.chart-container').innerHTML = 
      '<p style="text-align:center;color:#e74c3c">⚠️ Could not load data. Please try again later.</p>';
  }
});

// 📈 Render bar chart using Chart.js
function renderChart(data) {
  // Aggregate CO2 by intervention type
  const co2ByType = {};
  data.forEach(row => {
    const type = row["Intervention Type"];
    const co2 = parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0;
    co2ByType[type] = (co2ByType[type] || 0) + co2;
  });

  const labels = Object.keys(co2ByType);
  const values = Object.values(co2ByType);

  const ctx = document.getElementById('co2-chart').getContext('2d');
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Annual tCO₂e Saved',
        data: values,
        backgroundColor: 'rgba(39, 174, 96, 0.7)',
        borderColor: 'rgba(30, 132, 73, 1)',
        borderWidth: 2,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.parsed.y.toLocaleString(undefined, {maximumFractionDigits:1})} tCO₂e`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'tCO₂e Saved / Year' },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          title: { display: true, text: 'Intervention Type' },
          grid: { display: false },
          ticks: { maxRotation: 45, minRotation: 45, font: {size: 11} }
        }
      },
      animation: { duration: 600 }
    }
  });
}
