// Initialize percentile chart
document.addEventListener('DOMContentLoaded', function() {
  // Load Chart.js if not already loaded
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
      initPercentileChart();
    };
    document.head.appendChild(script);
  } else {
    // Chart.js already loaded
    initPercentileChart();
  }
});

// Percentile comparison chart
export const initPercentileChart = () => {
  const percentileLabels = ['Min', 'P10', 'P25', 'P50', 'P75', 'P90', 'P95', 'P99', 'Max'];
  const beforeData = [0, 4, 4, 10, 16, 98, 682.5, 1087, 0];
  const afterData = [0, 4, 4, 8, 14, 77, 155, 539, 0];
  
  new Chart(document.getElementById('percentileChart'), {
    type: 'bar',
    data: {
      labels: percentileLabels,
      datasets: [
        {
          label: 'AS-IS (배포 전)',
          data: beforeData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1
        },
        {
          label: 'TO-BE (배포 후)',
          data: afterData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          title: {
            display: true,
            text: '응답시간 (ms)'
          },
          beginAtZero: true
        },
        x: {
          title: {
            display: true,
            text: '백분위수'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: '배포 전후 API 응답시간 백분위수 비교',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + 'ms';
            }
          }
        }
      }
    }
  });
};
