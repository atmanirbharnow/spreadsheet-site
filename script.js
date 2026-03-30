// ✅ Your Google Sheet CSV link
const sheetURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXBAMBr27ht-lRC-2W2cJQdTd57m8j3kyend2EHdpB6zkMo4kFFKZGxzStDLITaJ3ojdipBLJvMfcT/pub?gid=150916621&single=true&output=csv';

const container = document.getElementById('data-container');
const statsBar = document.getElementById('stats-bar');
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-search');
const noResults = document.getElementById('no-results');
let allData = []; // Store original data
let chartInstance = null; // Store chart instance

// ✅ Load and display data
Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    allData = results.data.filter(row => row["Intervention Type"]?.trim());
    
    if (allData.length === 0) {
      container.innerHTML = '<div class="empty-state">No interventions found. Add data to your Google Sheet!</div>';
      return;
    }

    // 📊 Calculate & display stats
    updateStats(allData);
    
    // 📈 Render chart
    renderChart(allData);
    
    // 🃏 Render cards
    renderCards(allData);
    
    // 🔍 Setup search functionality
    setupSearch();
  },
  error: function(err) {
    console.error('PapaParse error:', err);
    container.innerHTML = '<div class="empty-state" style="color:#e74c3c">⚠️ Could not load data. Please try again later.</div>';
  }
});

// 📊 Update stats bar
function updateStats(data) {
  const totalActions = data.reduce((sum, row) => sum + (parseInt(row["# of Actions"]) || 0), 0);
  const totalCO2 = data.reduce((sum, row) => sum + (parseFloat(row["Annual tCO₂e Saved (conservative)"]) || 0), 0);
  const totalSaved = data.reduce((sum, row) => sum + (parseFloat(row["amount saved till date"]) || 0), 0);
  const uniqueTypes = new Set(data.map(row => row["Intervention Type"])).size;

  document.getElementById('total-actions').textContent = totalActions.toLocaleString();
  document.getElementById('total-co2').textContent = totalCO2.toLocaleString(undefined, {maximumFractionDigits: 1}) + ' t';
  document.getElementById('total-saved').textContent = '₹' + (totalSaved/100000).toFixed(2) + ' L';
  document.getElementById('total-interventions').textContent = uniqueTypes;
}

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
  
  // Destroy existing chart if any (for re-renders)
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Annual tCO₂e Saved',
        data: values,
        backgroundColor: 'rgba(39, 174, 96, 0.7)',
        borderColor: 'rgba(30, 132, 73, 1)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(39, 174, 96, 0.9)'
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
          ticks: { maxRotation: 45, minRotation: 45 }
        }
      },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
}

// 🃏 Render intervention cards
function renderCards(data) {
  container.innerHTML = '';
  
  if (data.length === 0) {
    noResults.style.display = 'block';
    return;
  }
  noResults.style.display = 'none';

  data.forEach(row => {
    const card = document.createElement('div');
    card.className = 'card';
    
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
}

// 🔍 Setup search/filter functionality
function setupSearch() {
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
      // Show all data when search is empty
      renderCards(allData);
      updateStats(allData);
      renderChart(allData);
      return;
    }
    
    // Filter data by matching query in Intervention Type or other fields
    const filtered = allData.filter(row => {
      const type = row["Intervention Type"]?.toLowerCase() || '';
      const activity = row["Total Activity (e.g., kW, m³, units)"]?.toLowerCase() || '';
      const source = row["Emission Factor Source"]?.toLowerCase() || '';
      return type.includes(query) || activity.includes(query) || source.includes(query);
    });
    
    // Update UI with filtered data
    renderCards(filtered);
    updateStats(filtered);
    renderChart(filtered);
    
    // Highlight matching cards
    document.querySelectorAll('.card').forEach(card => {
      const text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.classList.add('highlight-match');
      }
    });
  });
  
  // Clear search button
  clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    renderCards(allData);
    updateStats(allData);
    renderChart(allData);
    searchInput.focus();
  });
}
