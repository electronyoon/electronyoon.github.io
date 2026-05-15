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
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          yAxisID: 'yMs',
        },
        {
          label: '배포 후',
          data: [231, 1656, 0.09],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
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

// Chart 2: 요약 — QWGJK 응답시간 구간별 분포 (before/after 히스토그램)
// 구간: 0~500ms / 500~1000ms / 1000~2000ms / 2000ms+
// slow_ratio 역산 (2일 합산): before [34.4, 33.8, 20.6] / after [29.5, 28.9, 1.5]
const distributionCtx = document.getElementById('distributionChart');
if (distributionCtx) {
  new Chart(distributionCtx, {
    type: 'bar',
    data: {
      labels: ['0 ~ 500ms', '500 ~ 1,000ms', '1,000 ~ 2,000ms', '2,000ms 초과'],
      datasets: [
        {
          label: '배포 전 (3/29~30)',
          // 0~500: 100-34.4, 500~1000: 34.4-33.8, 1000~2000: 33.8-20.6, 2000+: 20.6
          data: [65.6, 0.6, 13.2, 20.6],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: '배포 후 (4/1~2)',
          // 0~500: 100-29.5, 500~1000: 29.5-28.9, 1000~2000: 28.9-1.5, 2000+: 1.5
          data: [70.5, 0.6, 27.4, 1.5],
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
          text: 'QWGJK 응답시간 구간별 분포 — 배포 전후 비교',
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
          max: 100,
          title: { display: true, text: '비율 (%)' },
        },
      },
    },
  });
}

// Chart 3: 요약 — 전체 API 응답시간 분포 히스토그램 (배포 전후 2일 합산)
// 전체 건수: 배포 전 100,214건 / 배포 후 100,274건 → 비율(%)로 정규화
const histCtx = document.getElementById('operationalHistogramChart');
if (histCtx) {
  const labels = [
    '0~25','25~50','50~75','75~100','100~125','125~150','150~175','175~200',
    '200~250','250~300','300~350','350~400','400~450','450~500',
    '500~600','600~700','700~800','800~900','900~1000',
    '1000~1100','1100~1200','1200~1300','1300~1400','1400~1500',
    '1500~1600','1600~1700','1700~1800','1800~1900','1900~2000',
    '2000~2250','2250~2500','2500~2750',
  ];
  new Chart(histCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '배포 전 (3/29~30)',
          data: [
            15.62, 15.81, 14.98, 14.58, 10.35, 5.31, 5.08, 3.66,
            4.18, 0.88, 0.25, 0.06, 0.02, 0.00,
            0.00, 0.02, 0.13, 0.01, 0.00,
            0.00, 0.06, 0.14, 0.12, 0.14,
            0.20, 0.32, 0.70, 1.14, 0.78,
            2.62, 1.81, 1.06,
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderWidth: 0,
        },
        {
          label: '배포 후 (4/1~2)',
          data: [
            35.72, 27.43, 4.64, 2.85, 6.29, 10.00, 3.79, 1.25,
            1.12, 0.10, 0.03, 0.03, 0.01, 0.01,
            0.01, 0.00, 0.11, 0.02, 0.00,
            0.00, 0.05, 0.19, 0.18, 0.19,
            0.26, 0.40, 0.90, 3.02, 1.05,
            0.35, 0.01, 0.00,
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '응답시간별 분포 (전체 API)',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}%`,
          },
        },
      },
      scales: {
        x: {
          ticks: { maxRotation: 60, font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: '비율 (%)' },
        },
      },
    },
  });
}

// Chart 4: 요약 — QWGJK only 응답시간 분포 히스토그램 (배포 전후 2일 합산)
// 배포 전(3/29~30): 27,164건 / 배포 후(4/1~2): 23,885건 → 비율(%)로 정규화
// ※ 이미지에서 읽은 값 — 오차 있을 수 있음
const qwgjkHistCtx = document.getElementById('qwgjkHistogramChart');
if (qwgjkHistCtx) {
  const labels = [
    '0~25','25~50','50~75','75~100','100~125','125~150','150~175','175~200',
    '200~250','250~300','300~350','350~400','400~450','450~500',
    '500~600','600~700','700~800','800~900','900~1000',
    '1000~1100','1100~1200','1200~1300','1300~1400','1400~1500',
    '1500~1600','1600~1700','1700~1800','1800~1900','1900~2000',
    '2000~2250','2250~2500','2500~2750',
  ];
  // 배포 전 원본 건수 / 27164
  const before = [
    290, 801, 2213, 2095, 2195, 1233, 2452, 2394,
    3312, 705, 180, 34, 4, 1,
    1, 21, 128, 8, 1,
    1, 58, 141, 124, 136,
    201, 322, 697, 1138, 782,
    2622, 1812, 1062,
  ];
  // 배포 후 원본 건수 / 23885
  const after = [
    257, 4314, 1041, 1669, 1516, 5631, 1604, 474,
    506, 38, 28, 31, 17, 7,
    8, 4, 107, 20, 3,
    3, 50, 193, 181, 191,
    260, 398, 901, 3023, 1055,
    348, 6, 1,
  ];
  const toPercent = (arr, total) => arr.map(v => parseFloat((v / total * 100).toFixed(2)));
  new Chart(qwgjkHistCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '배포 전 (3/29~30)',
          data: toPercent(before, 27164),
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderWidth: 0,
        },
        {
          label: '배포 후 (4/1~2)',
          data: toPercent(after, 23885),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '응답시간별 분포 (세부사업별 세출현황 API)',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const raw = ctx.datasetIndex === 0 ? before[idx] : after[idx];
              return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}% (${raw.toLocaleString()}건)`;
            },
          },
        },
      },
      scales: {
        x: { ticks: { maxRotation: 60, font: { size: 10 } } },
        y: {
          beginAtZero: true,
          title: { display: true, text: '비율 (%)' },
        },
      },
    },
  });
}

// Charts 5-7: P1~P99 백분위수 비교 (3월 vs 4월)
const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);

const pctData = {
  전체_3월: [9,9,10,10,11,12,13,14,16,18,20,21,22,23,24,25,26,27,28,29,30,31,33,34,36,38,41,43,45,47,49,51,52,54,56,58,59,61,62,63,65,66,68,70,72,74,76,78,80,82,84,85,87,88,90,92,93,95,96,98,100,101,103,105,107,110,112,115,118,120,124,127,132,136,141,146,152,157,162,167,171,176,182,189,197,206,214,224,239,274,1290.9,1737.6,1844,1947,2072,2149,2248,2354,2530],
  전체_4월: [9,11,12,14,15,16,17,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,21,22,22,22,22,23,23,23,23,24,24,24,24,25,25,25,25,26,26,27,27,27,28,28,29,29,30,30,31,31,32,33,34,35,36,37,38,40,42,45,49,53,58,63,69,76,84,93,103,111,114,117,120,122,125,127,129,131,132,134,136,138,141,145,150,155,161,167,179,200,238,1490,1753.25,1818,1850,1879,1921],
  제외_3월: [9,9,10,10,10,11,11,12,12,13,14,16,17,19,20,21,22,23,23,24,24,25,26,26,27,28,29,30,31,32,33,34,36,37,39,41,43,44,46,47,49,50,51,53,54,56,57,59,60,61,62,63,65,66,67,69,70,72,74,76,78,80,82,83,85,86,87,89,90,91,93,94,95,96,98,99,101,102,104,105,107,109,111,114,117,120,123,127,131,135,139,144,149,155,162,169,178,192,215],
  제외_4월: [9,10,11,12,13,15,16,17,17,17,18,18,18,19,19,19,19,19,20,20,20,20,20,20,21,21,21,21,21,21,22,22,22,22,22,23,23,23,23,23,23,24,24,24,24,25,25,25,25,25,26,26,26,27,27,27,28,28,28,29,29,30,30,31,31,32,33,34,35,36,37,39,41,43,46,50,55,60,65,71,78,85,95,106,112,115,118,121,123,126,129,132,136,141,147.65,155,162,173,195],
  qwgjk_3월: [24,31,38,50,55,58,62,64,67,69,72,74,78,81,83,86,89,92,96,100,104,108,111,114,117,120,122,125,129,134,140,147,153,157,160,163,165,168,170,172,174,176,178,181,184,186,189,192,195,199,202,206,208,211,214,217,220,224,228,233,239,247,258,276,306,723,1307.86,1513,1628,1710,1752,1788,1817,1839,1861,1884,1914,1949,1984,2018,2051,2083,2112,2128,2143,2166,2195.73,2222,2249,2275,2301,2332,2369,2415.26,2466,2514.84,2569,2622,2698],
  qwgjk_4월: [24,27,29,29,30,31,31,32,32,33,34,34,35,36,37,38,41,43,46,50,54,58,63,70,78,88,96,105,112,115,118,121,123,124,126,127,128,128,129,130,131,131,132,132,133,134,134,135,136,137,138,139,140,141,142.85,144,146,148,150,152.2,155,158,161,165,169,177,189,204,220,252,801.28,1282,1407.91,1523.58,1603,1667.92,1714,1751.26,1775,1791,1804,1814,1824,1832,1839,1846,1852,1858,1864,1870,1877,1884,1892,1901,1912,1928,1952,1984,2017],
};

function makePercentileChart(id, before, after, title, yMax = 3000) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '배포 전 (3월)',
          data: before,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: '배포 후 (4월)',
          data: after,
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
        title: { display: true, text: title, font: { size: 16 } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}ms`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: '백분위수' },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            },
          },
        },
        y: {
          type: 'linear',
          title: { display: true, text: '응답 시간 (ms)' },
          min: 0,
          max: yMax,
          ticks: { stepSize: yMax <= 500 ? 50 : 500 },
        },
      },
    },
  });
}

makePercentileChart('percentileAllChart',    pctData.전체_3월, pctData.전체_4월, '백분위수 응답시간 (전체 API)');
makePercentileChart('percentileExcludedChart', pctData.제외_3월, pctData.제외_4월, '백분위수 응답시간 (세부사업별 세출현황 제외)', 300);
makePercentileChart('percentileQwgjkChart',  pctData.qwgjk_3월, pctData.qwgjk_4월, '백분위수 응답시간 (세부사업별 세출현황)');

// Chart 8: 가설#1 — 전체 API slow_ratio 계단 패턴 (2일 합산)
// 전체 API: 배포 전 100,214건 / 배포 후 100,274건 기준
const cascadeCtx = document.getElementById('cascadeChart');
if (cascadeCtx) {
  new Chart(cascadeCtx, {
    type: 'bar',
    data: {
      labels: ['500ms 초과', '1,000ms 초과', '2,000ms 초과'],
      datasets: [
        {
          label: '배포 전 (3/29~30)',
          data: [9.341, 9.183, 5.589],
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
          label: '배포 후 (4/1~2)',
          data: [6.732, 6.594, 0.351],
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
          text: '응답 지연 비율 (전체 API)',
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
