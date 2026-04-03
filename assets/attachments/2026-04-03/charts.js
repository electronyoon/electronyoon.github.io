// Chart 1: 요약 — 실험 예측 vs 운영 실측 비교
const summaryCtx = document.getElementById('summaryChart');
if (summaryCtx) {
  new Chart(summaryCtx, {
    type: 'bar',
    data: {
      labels: [
        '실험 — P95',
        '운영 — QWGJK P95',
        '운영 — cascade (2000ms+)',
      ],
      datasets: [
        {
          label: '배포 전',
          data: [3983, 1801, 2.91],
          backgroundColor: 'rgba(160, 160, 160, 0.75)',
          yAxisID: 'yMs',
        },
        {
          label: '배포 후',
          data: [231, 1656, 0.09],
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          yAxisID: 'yMs',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '실험 예측 vs 운영 실측 — 배포 전후 비교',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label;
              const val = ctx.parsed.y;
              const isRatio = ctx.dataIndex === 2;
              return `${label}: ${val}${isRatio ? '%' : 'ms'}`;
            },
          },
        },
      },
      scales: {
        yMs: {
          type: 'linear',
          beginAtZero: true,
          title: { display: true, text: 'ms / %' },
        },
      },
    },
  });
}

// Chart 2: 가설#1 — QWGJK slow_ratio 계단 패턴
const cascadeCtx = document.getElementById('cascadeChart');
if (cascadeCtx) {
  new Chart(cascadeCtx, {
    type: 'bar',
    data: {
      labels: ['500ms 초과', '1,000ms 초과', '2,000ms 초과'],
      datasets: [
        {
          label: '배포 전 (3/30)',
          data: [12.7, 11.7, 2.91],
          backgroundColor: 'rgba(160, 160, 160, 0.75)',
        },
        {
          label: '배포 후 (4/1)',
          data: [9.7, 9.0, 0.09],
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'QWGJK slow_ratio 배포 전후 비교 (%)',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '비율 (%)' },
        },
      },
    },
  });
}
