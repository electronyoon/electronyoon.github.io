// Chart 1: 요약 — Cross-API 오염 증거 (QWGJK 제외 API의 slow ratio)
const crossCtx = document.getElementById('chart-bar-excl-slow');
if (crossCtx) {
  new Chart(crossCtx, {
    type: 'bar',
    data: {
      labels: ['500ms 초과', '1,000ms 초과', '2,000ms 초과'],
      datasets: [
        {
          label: '3월 (배포 전)',
          data: [1.83, 0.99, 0.15],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: '4월 (배포 후)',
          data: [0.006, 0.002, 0.002],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'QWGJK 제외 API — 응답 지연 비율',
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

// Chart 2: 시간대별 P95 — QWGJK 제외 (3월 vs 4월)
const hourlyCtx = document.getElementById('chart-hourly-excl');
if (hourlyCtx) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);
  new Chart(hourlyCtx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: [48, 1574, 1250, 43, 46, 70, 81, 59, 50, 46, 69, 181.8, 81.5, 66, 103, 95, 154, 127, 124, 146, 168, 232, 41, 39],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: [137, 141, 37, 41, 44, 35, 59, 31, 55, 81, 75, 32, 35, 140, 132, 161, 138, 34, 35, 39, 37, 41, 77, 46],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '시간대별 P95 — QWGJK 제외 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
        annotation: {
          annotations: {
            maxLine: {
              type: 'line',
              yMin: 472,
              yMax: 472,
              borderColor: 'rgba(255, 159, 64, 0.8)',
              borderWidth: 2,
              borderDash: [6, 4],
              label: {
                display: true,
                content: '자체 max (472ms)',
                position: 'end',
              },
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}

// Chart 2.5: 시간대별 P95 — QWGJK만 (3월 vs 4월)
const qwgOnlyCtx = document.getElementById('chart-hourly-qwgjk');
if (qwgOnlyCtx) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);
  new Chart(qwgOnlyCtx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: [2025.0, 2514.0, 2766.7, 850.0, 1715.3, 192.0, 1954.0, 2629.0, 2402.0, 2184.1, 2412.6, 2696.0, 2722.9, 2653.0, 2684.1, 2579.3, 2329.7, 2704.1, 2728.6, 211.0, 2753.8, 285.0, 2631.0, 2341.0],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: [1870.0, 1911.0, 235.6, 355.4, 233.0, 172.0, 189.0, 1938.1, 811.0, 910.0, 616.0, 658.0, 601.0, 747.0, 713.0, 737.0, 1889.9, 2154.0, 2199.0, 1286.0, 1917.9, 189.0, 617.0, 581.9],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '시간대별 P95 — QWGJK만',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}

// Chart 2.6: 시간대별 P95 — 전체 엔드포인트 (3월 vs 4월)
const allHourlyCtx = document.getElementById('chart-hourly-all');
if (allHourlyCtx) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);
  new Chart(allHourlyCtx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: [1622.0, 1858.0, 1541.0, 44.0, 46.0, 172.0, 201.0, 2437.5, 647.0, 1688.0, 2057.0, 2451.0, 2471.0, 2425.0, 2168.4, 2194.0, 2214.0, 2102.0, 132.0, 187.0, 169.0, 256.0, 96.0, 204.0],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: [1782.0, 1837.0, 106.0, 171.0, 147.0, 149.0, 163.0, 1929.0, 768.0, 881.0, 561.6, 572.0, 553.9, 584.0, 580.0, 606.4, 1811.0, 2111.0, 602.0, 163.0, 55.0, 156.0, 498.0, 233.0],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '시간대별 P95 — 전체 엔드포인트',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}

// Chart 3: 백분위수 — QWGJK only 30일 (배포 전후)
const pctQwgjkOnlyCtx = document.getElementById('chart-pct-qwgjk-b');
if (pctQwgjkOnlyCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const qwgjkMarch = [24,31,38,50,55,58,62,64,67,69,72,74,78,81,83,86,89,92,96,100,104,108,111,114,117,120,122,125,129,134,140,147,153,157,160,163,165,168,170,172,174,176,178,181,184,186,189,192,195,199,202,206,208,211,214,217,220,224,228,233,239,247,258,276,306,723,1307.86,1513,1628,1710,1752,1788,1817,1839,1861,1884,1914,1949,1984,2018,2051,2083,2112,2128,2143,2166,2195.73,2222,2249,2275,2301,2332,2369,2415.26,2466,2514.84,2569,2622,2698];
  const qwgjkApril = [24,27,29,29,30,31,31,32,32,33,34,34,35,36,37,38,41,43,46,50,54,58,63,70,78,88,96,105,112,115,118,121,123,124,126,127,128,128,129,130,131,131,132,132,133,134,134,135,136,137,138,139,140,141,142.85,144,146,148,150,152.2,155,158,161,165,169,177,189,204,220,252,801.28,1282,1407.91,1523.58,1603,1667.92,1714,1751.26,1775,1791,1804,1814,1824,1832,1839,1846,1852,1858,1864,1870,1877,1884,1892,1901,1912,1928,1952,1984,2017];

  new Chart(pctQwgjkOnlyCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: qwgjkMarch,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: qwgjkApril,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 — QWGJK only',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 24, 49, 74, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 3000,
          ticks: { stepSize: 500 },
        },
      },
    },
  });
}

// Chart 3: 백분위수 — QWGJK 제외 30일 (배포 전후)
const pctExcluded30Ctx = document.getElementById('chart-pct-excl-bar');
if (pctExcluded30Ctx) {
  // QWGJK 제외: 주요 백분위수만 표시 (요약 데이터 기반)
  const labels = ['평균', '중앙값', 'P95', 'P99'];
  new Chart(pctExcluded30Ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: [76.6, 41, 170, 997],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: '4월 (배포 후)',
          data: [27.5, 23, 53, 134],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '응답시간 비교 — QWGJK 제외 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}



// Chart 5: QWGJK slow ratio 변화 (30일, 트래픽 2.75배 증가에도 개선)
const slowQwgjkCtx = document.getElementById('chart-bar-qwgjk-slow');
if (slowQwgjkCtx) {
  new Chart(slowQwgjkCtx, {
    type: 'bar',
    data: {
      labels: ['500ms 초과', '1,000ms 초과', '2,000ms 초과'],
      datasets: [
        {
          label: '3월 — 33만 건',
          data: [24.61, 23.11, 10.10],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: '4월 — 91만 건 (+175%)',
          data: [11.37, 6.78, 1.43],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: 'QWGJK 응답 지연 비율',
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

// 요약 — 백분위수 라인 (chart-pct-all)
const pctAllCtx = document.getElementById('chart-pct-all');
if (pctAllCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [7,7,8,8,8,9,9,9,9,10,10,10,10,11,11,12,12,13,14,16,18,20,23,24,25,26,27,28,28,29,30,31,32,33,34,35,36,37,38,39,40,42,44,45,47,49,51,53,54,56,58,60,61,63,65,67,69,72,74,76,78,80,82,84,86,88,90,92,95,97,99,102,105,108,111,115,118,122,126,131,137,144,151,157,163,169,176,184,192,202,213,229,267,588,1079,1436,1684,2013,2322];
  const april = [8,9,10,10,11,12,12,13,14,15,16,17,17,18,18,19,19,19,20,20,20,21,21,21,22,22,22,23,23,23,23,24,24,25,25,25,26,26,27,27,28,28,29,30,30,31,32,33,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,51,52,53,55,57,58,60,62,64,66,68,71,74,77,81,85,90,96,103,112,120,127,131,134,137,140,144,149,158,177,256,562,741,1288,1761,1936];

  new Chart(pctAllCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 — 전체 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 2500,
          ticks: { stepSize: 500 },
        },
      },
    },
  });
}

// 요약 — 백분위수 라인 (chart-pct-qwgjk-a)
const pctQwgjkACtx = document.getElementById('chart-pct-qwgjk-a');
if (pctQwgjkACtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [14,22,27,33,41,48,51,54,56,58,60,63,65,68,70,73,76,79,82,85,88,91,94,98,101,105,108,111,114,116,118,120,123,126,129,134,140,146,150,153,155,157,159,161,163,165,167,169,171,173,175,177,180,182,185,187,190,192,195,197,200,203,206,209,212,215,218,222,227,232,239,249,266,298,396,643,1021,1157,1276,1378,1458,1524.1199999999953,1576,1618,1667,1722,1787,1859,1934,2007,2071,2135,2201,2264,2317,2381,2464,2558,2672];
  const april = [8,9,10,16,26,29,31,32,33,34,35,36,37,38,39,40,41,41,42,43,44,45,45,46,47,48,48,49,50,51,51,52,53,54,55,56,56,57,58,59,60,61,62,63,64,65,66,67,69,70,71,73,74,76,78,79,81,83,86,88,91,94,98,101,106,111,117,121,125,128,130,132,134,135,136,138,139,141,142,144,147,150,154,160,169,187,225,441,530,601,689,787,891,1396,1647,1785,1867,1947,2082];

  new Chart(pctQwgjkACtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 — QWGJK only',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 3000,
          ticks: { stepSize: 500 },
        },
      },
    },
  });
}

// 요약 — 백분위수 라인 (chart-pct-excl-line)
const pctExclLineCtx = document.getElementById('chart-pct-excl-line');
if (pctExclLineCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [7,7,7,8,8,8,9,9,9,9,9,10,10,10,10,11,11,11,11,12,12,13,14,16,17,19,21,23,24,25,26,26,27,28,28,29,30,31,32,33,33,34,35,35,36,37,38,39,40,41,42,44,45,47,48,50,52,53,55,57,58,60,62,64,66,68,70,72,74,76,78,80,82,83,85,87,89,91,93,95,97,100,102,105,108,111,115,119,124,129,135,141,149,158,170,186,214,366,997];
  const april = [8,9,9,10,10,11,11,12,12,12,13,13,14,14,15,15,16,16,17,17,17,18,18,18,18,19,19,19,19,19,20,20,20,20,20,20,21,21,21,21,21,21,22,22,22,22,22,22,23,23,23,23,23,23,24,24,24,24,24,24,25,25,25,25,26,26,26,26,26,27,27,27,28,28,28,29,29,30,30,31,31,32,32,33,34,34,35,36,37,38,40,41,44,48,53,59,76,107,134];

  new Chart(pctExclLineCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 — QWGJK 제외',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 1100,
          ticks: { stepSize: 200 },
        },
      },
    },
  });
}

// 차트 ① 백분위수별 개선율 (%) — 전체 API
const pctImproveCtx = document.getElementById('chart-pct-improve');
if (pctImproveCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [7,7,8,8,8,9,9,9,9,10,10,10,10,11,11,12,12,13,14,16,18,20,23,24,25,26,27,28,28,29,30,31,32,33,34,35,36,37,38,39,40,42,44,45,47,49,51,53,54,56,58,60,61,63,65,67,69,72,74,76,78,80,82,84,86,88,90,92,95,97,99,102,105,108,111,115,118,122,126,131,137,144,151,157,163,169,176,184,192,202,213,229,267,588,1079,1436,1684,2013,2322];
  const april = [8,9,10,10,11,12,12,13,14,15,16,17,17,18,18,19,19,19,20,20,20,21,21,21,22,22,22,23,23,23,23,24,24,25,25,25,26,26,27,27,28,28,29,30,30,31,32,33,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,51,52,53,55,57,58,60,62,64,66,68,71,74,77,81,85,90,96,103,112,120,127,131,134,137,140,144,149,158,177,256,562,741,1288,1761,1936];
  const improve = march.map((m, i) => Number((((m - april[i]) / m) * 100).toFixed(1)));

  new Chart(pctImproveCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '개선율 (%)',
          data: improve,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 개선율 — 전체 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '개선율 (%)' },
          ticks: { callback: (v) => `${v}%` },
        },
      },
    },
  });
}

// 차트 ② 전체 vs QWGJK only 백분위수 오버레이 (4월)
const pctOverlayCtx = document.getElementById('chart-pct-overlay');
if (pctOverlayCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const allApril = [8,9,10,10,11,12,12,13,14,15,16,17,17,18,18,19,19,19,20,20,20,21,21,21,22,22,22,23,23,23,23,24,24,25,25,25,26,26,27,27,28,28,29,30,30,31,32,33,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,51,52,53,55,57,58,60,62,64,66,68,71,74,77,81,85,90,96,103,112,120,127,131,134,137,140,144,149,158,177,256,562,741,1288,1761,1936];
  const qwgjkApril = [8,9,10,16,26,29,31,32,33,34,35,36,37,38,39,40,41,41,42,43,44,45,45,46,47,48,48,49,50,51,51,52,53,54,55,56,56,57,58,59,60,61,62,63,64,65,66,67,69,70,71,73,74,76,78,79,81,83,86,88,91,94,98,101,106,111,117,121,125,128,130,132,134,135,136,138,139,141,142,144,147,150,154,160,169,187,225,441,530,601,689,787,891,1396,1647,1785,1867,1947,2082];

  new Chart(pctOverlayCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '전체 API (4월)',
          data: allApril,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: 'QWGJK only (4월)',
          data: qwgjkApril,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 오버레이 — 전체 vs QWGJK only (4월)',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 2200,
          ticks: { stepSize: 500 },
        },
      },
    },
  });
}

// 차트 ③ P50/P95/P99 절대값 막대 — 전체 vs QWGJK only (4월)
const pctBarCtx = document.getElementById('chart-pct-bar');
if (pctBarCtx) {
  new Chart(pctBarCtx, {
    type: 'bar',
    data: {
      labels: ['P50', 'P95', 'P99'],
      datasets: [
        {
          label: '전체 API (4월)',
          data: [34, 562, 1936],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
        {
          label: 'QWGJK only (4월)',
          data: [70, 1647, 2082],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 절대값 — 전체 vs QWGJK only (4월)',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}

// 통합본 — 응답시간(ms) + 개선율(%) 오버레이, dual Y축 — 전체 API
const pctAllComboCtx = document.getElementById('chart-pct-all-combo');
if (pctAllComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [7,7,8,8,8,9,9,9,9,10,10,10,10,11,11,12,12,13,14,16,18,20,23,24,25,26,27,28,28,29,30,31,32,33,34,35,36,37,38,39,40,42,44,45,47,49,51,53,54,56,58,60,61,63,65,67,69,72,74,76,78,80,82,84,86,88,90,92,95,97,99,102,105,108,111,115,118,122,126,131,137,144,151,157,163,169,176,184,192,202,213,229,267,588,1079,1436,1684,2013,2322];
  const april = [8,9,10,10,11,12,12,13,14,15,16,17,17,18,18,19,19,19,20,20,20,21,21,21,22,22,22,23,23,23,23,24,24,25,25,25,26,26,27,27,28,28,29,30,30,31,32,33,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,51,52,53,55,57,58,60,62,64,66,68,71,74,77,81,85,90,96,103,112,120,127,131,134,137,140,144,149,158,177,256,562,741,1288,1761,1936];
  const improve = march.map((m, i) => Number((((m - april[i]) / m) * 100).toFixed(1)));

  new Chart(pctAllComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '개선율 (%)',
          data: improve,
          borderColor: 'rgb(40, 167, 69)',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: 'origin',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 및 개선율',
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.dataset.yAxisID === 'y1'
                ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 2500,
          ticks: { stepSize: 500 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '개선율 (%)', color: 'rgb(40, 167, 69)' },
          min: -80,
          max: 60,
          ticks: {
            stepSize: 20,
            color: 'rgb(40, 167, 69)',
            callback: (v) => `${v}%`,
          },
          border: { color: 'rgb(40, 167, 69)', width: 2 },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

// 통합본 — 응답시간(ms) + 개선율(%) 오버레이, dual Y축 — QWGJK only
const pctQwgjkComboCtx = document.getElementById('chart-pct-qwgjk-combo');
if (pctQwgjkComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [14,22,27,33,41,48,51,54,56,58,60,63,65,68,70,73,76,79,82,85,88,91,94,98,101,105,108,111,114,116,118,120,123,126,129,134,140,146,150,153,155,157,159,161,163,165,167,169,171,173,175,177,180,182,185,187,190,192,195,197,200,203,206,209,212,215,218,222,227,232,239,249,266,298,396,643,1021,1157,1276,1378,1458,1524.1199999999953,1576,1618,1667,1722,1787,1859,1934,2007,2071,2135,2201,2264,2317,2381,2464,2558,2672];
  const april = [8,9,10,16,26,29,31,32,33,34,35,36,37,38,39,40,41,41,42,43,44,45,45,46,47,48,48,49,50,51,51,52,53,54,55,56,56,57,58,59,60,61,62,63,64,65,66,67,69,70,71,73,74,76,78,79,81,83,86,88,91,94,98,101,106,111,117,121,125,128,130,132,134,135,136,138,139,141,142,144,147,150,154,160,169,187,225,441,530,601,689,787,891,1396,1647,1785,1867,1947,2082];
  const improve = march.map((m, i) => Number((((m - april[i]) / m) * 100).toFixed(1)));

  new Chart(pctQwgjkComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '개선율 (%)',
          data: improve,
          borderColor: 'rgb(40, 167, 69)',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: 'origin',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 및 개선율 — 세부사업별 세출현황 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.dataset.yAxisID === 'y1'
                ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 3000,
          ticks: { stepSize: 500 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '개선율 (%)', color: 'rgb(40, 167, 69)' },
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: 'rgb(40, 167, 69)',
            callback: (v) => `${v}%`,
          },
          border: { color: 'rgb(40, 167, 69)', width: 2 },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

// 통합본 — 응답시간(ms) + 개선율(%) 오버레이, dual Y축 — QWGJK 제외
const pctExclComboCtx = document.getElementById('chart-pct-excl-combo');
if (pctExclComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const march = [7,7,7,8,8,8,9,9,9,9,9,10,10,10,10,11,11,11,11,12,12,13,14,16,17,19,21,23,24,25,26,26,27,28,28,29,30,31,32,33,33,34,35,35,36,37,38,39,40,41,42,44,45,47,48,50,52,53,55,57,58,60,62,64,66,68,70,72,74,76,78,80,82,83,85,87,89,91,93,95,97,100,102,105,108,111,115,119,124,129,135,141,149,158,170,186,214,366,997];
  const april = [8,9,9,10,10,11,11,12,12,12,13,13,14,14,15,15,16,16,17,17,17,18,18,18,18,19,19,19,19,19,20,20,20,20,20,20,21,21,21,21,21,21,22,22,22,22,22,22,23,23,23,23,23,23,24,24,24,24,24,24,25,25,25,25,26,26,26,26,26,27,27,27,28,28,28,29,29,30,30,31,31,32,32,33,34,34,35,36,37,38,40,41,44,48,53,59,76,107,134];
  const improve = march.map((m, i) => Number((((m - april[i]) / m) * 100).toFixed(1)));

  new Chart(pctExclComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '3월 (배포 전)',
          data: march,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '4월 (배포 후)',
          data: april,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '개선율 (%)',
          data: improve,
          borderColor: 'rgb(40, 167, 69)',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: 'origin',
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '백분위수 응답시간 및 개선율 — 나머지 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.dataset.yAxisID === 'y1'
                ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: 1000,
          ticks: { stepSize: 200 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '개선율 (%)', color: 'rgb(40, 167, 69)' },
          min: -60,
          max: 100,
          ticks: {
            stepSize: 20,
            color: 'rgb(40, 167, 69)',
            callback: (v) => `${v}%`,
          },
          border: { color: 'rgb(40, 167, 69)', width: 2 },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

// 시간대별 P95 — 4월(배포 후) 그룹별 (전체 / QWGJK only / QWGJK 제외)
const hourlyAprilCtx = document.getElementById('chart-hourly-april');
if (hourlyAprilCtx) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}시`);
  new Chart(hourlyAprilCtx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: '전체 API',
          data: [1782.0, 1837.0, 106.0, 171.0, 147.0, 149.0, 163.0, 1929.0, 768.0, 881.0, 561.6, 572.0, 553.9, 584.0, 580.0, 606.4, 1811.0, 2111.0, 602.0, 163.0, 55.0, 156.0, 498.0, 233.0],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '세부사업별 세출현황 API',
          data: [1870.0, 1911.0, 235.6, 355.4, 233.0, 172.0, 189.0, 1938.1, 811.0, 910.0, 616.0, 658.0, 601.0, 747.0, 713.0, 737.0, 1889.9, 2154.0, 2199.0, 1286.0, 1917.9, 189.0, 617.0, 581.9],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '나머지 API',
          data: [137.0, 141.0, 37.0, 41.0, 44.0, 35.0, 59.0, 31.0, 55.0, 81.0, 75.0, 32.0, 35.0, 140.0, 132.0, 161.0, 138.0, 34.0, 35.0, 39.0, 37.0, 41.0, 77.0, 46.0],
          borderColor: 'rgb(40, 167, 69)',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '시간대별 P95',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: '응답 시간 (ms)' },
        },
      },
    },
  });
}
