if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

// 선분이력 개념도 — 예시 사업 두 건의 유효기간 구간을 가로 막대로 표현
const lineageCtx = document.getElementById('chart-lineage-lofin');
if (lineageCtx) {
  const monthLabels = ['1/1', '3/1', '5/15', '6/30', '8/26', '12/31'];
  const monthOffsets = [1, 60, 135, 180, 238, 365];

  const rows = [
    { label: '1인가구 지원체계 구축, 총 지출액 1_000', range: [1, 180], project: 'A', status: 'closed' },
    { label: '다산콜센터 출연금, 총 지출액 2_000', range: [1, 135], project: 'B', status: 'closed' },
    { label: '120다산콜재단 출연금, 총 지출액 2_000', range: [136, 365], project: 'B', status: 'open' },
    { label: '119항공대 운영, 총 지출액 3_000', range: [1, 180], project: 'C', status: 'closed' },
    { label: '119항공대 운영, 총 지출액 5_000', range: [181, 365], project: 'C', status: 'open' },
  ];

  const projectColor = {
    A: { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.7)' },
    B: { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.7)' },
    C: { border: 'rgb(40, 167, 69)', bg: 'rgba(40, 167, 69, 0.7)' },
  };

  const formatDate = (day) => {
    const d = new Date(2026, 0, day);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const verticalLinesPlugin = {
    id: 'verticalLines',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      ctx.save();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1.5;
      [60, 238].forEach((day) => {
        const x = xScale.getPixelForValue(day);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
      });
      ctx.restore();
    },
  };

  new Chart(lineageCtx, {
    type: 'bar',
    plugins: [verticalLinesPlugin],
    data: {
      labels: rows.map((r) => r.label),
      datasets: [
        {
          label: '유효기간',
          data: rows.map((r) => r.range),
          backgroundColor: rows.map((r) => projectColor[r.project].bg),
          borderColor: rows.map((r) => projectColor[r.project].border),
          borderWidth: 2,
          borderSkipped: false,
          borderDash: rows.map((r) => (r.status === 'open' ? [6, 4] : [])),
          barPercentage: 0.9,
          categoryPercentage: 0.95,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: '선분이력 예시 — 세부사업별 세출현황 API',
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const r = rows[ctx.dataIndex];
              return `유효기간: ${formatDate(r.range[0])} ~ ${formatDate(r.range[1])}`;
            },
          },
        },
        datalabels: {
          anchor: 'center',
          align: 'center',
          clamp: true,
          color: '#fff',
          font: { size: 11, weight: 'bold' },
          formatter: (value, ctx) => rows[ctx.dataIndex].label,
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 1,
          max: 365,
          afterBuildTicks: (axis) => {
            axis.ticks = monthOffsets.map((value) => ({ value }));
          },
          ticks: {
            callback: (value) => {
              const idx = monthOffsets.indexOf(value);
              return idx >= 0 ? monthLabels[idx] : '';
            },
          },
        },
        y: {
          grid: { display: false },
          ticks: { display: false },
        },
      },
    },
  });
}

// 배포 전 8월 한 달과 배포 다음 날(9/2)의 응답시간(ms) + 개선율(%) 오버레이
const pctLofinComboCtx = document.getElementById('chart-pct-lofin-combo');
if (pctLofinComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const before = [13,29,34,37,41,46,52,61,75,88,103,120,135,141,144,147,149,152,154,156,159,161,164,168,172,177,183,194,220,823,1043,1136,1175,1204,1229,1249,1268,1284,1299,1313,1326,1340,1353,1366,1379,1393,1407,1421,1435,1450,1466,1485,1506,1527,1544,1558,1569,1578,1586,1594,1600,1607,1613,1620,1626,1632,1638,1644,1650,1657,1664,1671,1679,1687,1696,1706,1716,1728,1740,1755,1775,1804,1847,1916,2011,2107,2199,2293,2378,2467,2544,2626,2774,3273,4826,5135,5544,6432,7637]; // 배포 전(8월) 실측 response_time percentile (P1~P99), 789,260건
  const after = [22,26,30,33,38,43,47,51,55,60,67,72,78.43,85,91,100,108,117,122,124,126,127,128,129,129,130,131,131,132,132,133,134,134,134,135,135,136,136,137,137,138,138,139,139,139,140,140,141,141,142,142,142,143,143,144,144,144,145,145,146,146,147,147,148,148,149,149,150,150,151,152,152,153,154,154,155,156,157,158,159,160,161,162,164,165,167,170,173,175,179,184,193,209.23,308.34,515.45,744.56,1025.67,1300,1417.89]; // 배포 후(9/2 하루) 실측 response_time percentile (P1~P99), 27,212건
  const improve = before.map((b, i) => Number((((b - after[i]) / b) * 100).toFixed(1)));

  new Chart(pctLofinComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '배포 전(8월)',
          data: before,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '배포 후(9/2 하루)',
          data: after,
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
        datalabels: { display: false },
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
          ticks: { stepSize: 500 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: false },
          min: -100,
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

// 배포 전 조건부 예측 — A/B/C 분류 요청의 7월 AS-IS vs 배포 후 한 달 예측
const pctLofinPredictionComboCtx = document.getElementById('chart-pct-lofin-prediction-combo');
if (pctLofinPredictionComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const before = [28,34,37,38,40,41,43,44,46,48,50,55,60,67,74,82,92,104,114,128,134,137,140,142,143,145,146,147,148,150,151,152,153,155,156,158,160,162,164,167,169,172,176,180,185,194,213,256,835,956,1145,1379,1452,1492,1509,1519,1527,1533,1539,1543,1548,1552,1557,1561,1564,1568,1572,1575,1579,1583,1586,1590,1594,1598,1602,1606,1610,1615,1620,1625,1631,1638,1645,1653,1664,1676,1690,1710,1743,1843,1959,2055,2138,2219,2301,2371,2427,2480,2577];
  const after = [19,27.581,32,35,37,39,40,41,42,43.258,45,46.258,48,51,55,59.558,66,72,80,90,102,113.464,122,125.245,127.14,128.477,129.587,130.477,131.258,132,132.697,133.258,134,134.477,135.038,135.697,136.148,136.819,137.258,137.942,138.367,139,139.393,140,140.49,141,141.6,142,142.675,143,143.791,144.051,144.832,145.064,145.942,146.161,147,147.271,148,148.477,149,149.697,150,150.954,151.174,152,152.697,153,154,154.6,155.038,156,156.977,157.625,158.349,159.077,160,161,162,163,164.199,165.528,167,168,169.528,171,172.349,174,176,178,180,182.477,185.814,189.605,194.535,201,209.761,221.271,237.051];
  const improve = before.map((b, i) => Number((((b - after[i]) / b) * 100).toFixed(1)));

  new Chart(pctLofinPredictionComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '대조군(7월)',
          data: before,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '실험군(7월 예측)',
          data: after,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '예측 개선율 (%)',
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
          text: '백분위수 응답시간 및 개선율 — 배포 전 조건부 예측',
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.dataset.yAxisID === 'y1'
                ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
        datalabels: { display: false },
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
          ticks: { stepSize: 500 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: false },
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

// 전체 모집단 하한 예측 — 유형 미상·소량 요청은 개선 없이 현행 유지
const pctLofinPredictionAllComboCtx = document.getElementById('chart-pct-lofin-prediction-all-combo');
if (pctLofinPredictionAllComboCtx) {
  const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);
  const before = [11,30,35,37,39,40,42,43,45,47,50,54,60,67,74,82,92,104,114,128,134,138,140,142,144,145,146,148,149,150,152,153,154,156,158,160,162,164,167,170,173,176,180,186,195,213,249,742,906,1040,1220,1425,1478.83,1504,1517,1525,1532,1538,1543,1548,1553,1557,1561,1565,1569,1573,1577,1581,1585,1589,1593,1597,1602,1606,1611,1616,1621,1627,1634,1641,1650,1659,1672,1686,1706,1737,1830,1940,2037,2113,2184,2257,2324,2382,2429,2473,2530,2637,2800];
  const after = [10,24,28.954,34,36,38,39,41,42,43,45,46,48.709,51,55,60.819,67,74,83,93,105,116,123.026,126.026,127.819,129.038,130.047,131,131.916,132.587,133.245,134,134.49,135.148,135.819,136.367,137,137.6,138.135,138.819,139.258,140,140.419,141,141.605,142.038,142.819,143.233,144,144.419,145,145.612,146,146.832,147.148,148,148.477,149,149.832,150.148,151,151.698,152.051,153,153.791,154.256,155,156,156.874,157.625,158.477,159.296,160.283,161.349,162.512,163.832,165,166,167.651,169,170.528,172,174,175.745,177.773,180,182.554,186,190,195,201.709,210.716,222.735,239.929,353.45,1600,2224,2487,2738];
  const improve = before.map((b, i) => Number((((b - after[i]) / b) * 100).toFixed(1)));

  new Chart(pctLofinPredictionAllComboCtx, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: '대조군(7월, 전체)',
          data: before,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '실험군(7월 예측, 전체)',
          data: after,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: '예측 개선율 (%)',
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
          text: '백분위수 응답시간 및 개선율 — 제외한 8.2%를 그대로 뒀을 때',
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.dataset.yAxisID === 'y1'
                ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
                : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`,
          },
        },
        datalabels: { display: false },
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
          ticks: { stepSize: 500 },
        },
        y1: {
          type: 'linear',
          position: 'left',
          title: { display: false },
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
