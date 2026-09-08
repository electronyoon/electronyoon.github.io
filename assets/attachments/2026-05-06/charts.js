const chartMessages = {
  ko: {
    beforeMarch: '3월 (배포 전)',
    afterApril: '4월 (배포 후)',
    improvement: '개선율 (%)',
    titleAll: '백분위수 응답시간 및 개선율',
    titleQwgjk: '백분위수 응답시간 및 개선율 — 세부사업별 세출현황 API',
    titleExcluded: '백분위수 응답시간 및 개선율 — 나머지 API',
    percentile: '백분위수',
    responseMs: '응답 시간 (ms)',
    improvementPct: '개선율 (%)'
  },
  en: {
    beforeMarch: 'March (before deployment)',
    afterApril: 'April (after deployment)',
    improvement: 'Improvement (%)',
    titleAll: 'Response time and improvement by percentile',
    titleQwgjk: 'Response time and improvement by percentile — Per-detailed-program expenditure API',
    titleExcluded: 'Response time and improvement by percentile — Every other API',
    percentile: 'Percentile',
    responseMs: 'Response time (ms)',
    improvementPct: 'Improvement (%)'
  }
};

const chartMessageKeys = Object.keys(chartMessages.ko);
for (const locale of Object.keys(chartMessages)) {
  const missing = chartMessageKeys.filter((key) => !(key in chartMessages[locale]));
  const extra = Object.keys(chartMessages[locale]).filter((key) => !chartMessageKeys.includes(key));
  if (missing.length || extra.length) {
    throw new Error(`Invalid chart translations for ${locale}: missing [${missing.join(', ')}], extra [${extra.join(', ')}]`);
  }
}

const chartLocale = (document.documentElement.lang || 'ko').toLowerCase().split('-')[0];
const t = (key) => chartMessages[chartLocale === 'en' ? 'en' : 'ko'][key];

// Percentile source data is intentionally kept in one place so every locale uses identical values.
const DATA = {
  all: {
    march: [7,7,8,8,8,9,9,9,9,10,10,10,10,11,11,12,12,13,14,16,18,20,23,24,25,26,27,28,28,29,30,31,32,33,34,35,36,37,38,39,40,42,44,45,47,49,51,53,54,56,58,60,61,63,65,67,69,72,74,76,78,80,82,84,86,88,90,92,95,97,99,102,105,108,111,115,118,122,126,131,137,144,151,157,163,169,176,184,192,202,213,229,267,588,1079,1436,1684,2013,2322],
    april: [8,9,10,10,11,12,12,13,14,15,16,17,17,18,18,19,19,19,20,20,20,21,21,21,22,22,22,23,23,23,23,24,24,25,25,25,26,26,27,27,28,28,29,30,30,31,32,33,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,51,52,53,55,57,58,60,62,64,66,68,71,74,77,81,85,90,96,103,112,120,127,131,134,137,140,144,149,158,177,256,562,741,1288,1761,1936]
  },
  qwgjk: {
    march: [14,22,27,33,41,48,51,54,56,58,60,63,65,68,70,73,76,79,82,85,88,91,94,98,101,105,108,111,114,116,118,120,123,126,129,134,140,146,150,153,155,157,159,161,163,165,167,169,171,173,175,177,180,182,185,187,190,192,195,197,200,203,206,209,212,215,218,222,227,232,239,249,266,298,396,643,1021,1157,1276,1378,1458,1524.1199999999953,1576,1618,1667,1722,1787,1859,1934,2007,2071,2135,2201,2264,2317,2381,2464,2558,2672],
    april: [8,9,10,16,26,29,31,32,33,34,35,36,37,38,39,40,41,41,42,43,44,45,45,46,47,48,48,49,50,51,51,52,53,54,55,56,56,57,58,59,60,61,62,63,64,65,66,67,69,70,71,73,74,76,78,79,81,83,86,88,91,94,98,101,106,111,117,121,125,128,130,132,134,135,136,138,139,141,142,144,147,150,154,160,169,187,225,441,530,601,689,787,891,1396,1647,1785,1867,1947,2082]
  },
  excluded: {
    march: [7,7,7,8,8,8,9,9,9,9,9,10,10,10,10,11,11,11,11,12,12,13,14,16,17,19,21,23,24,25,26,26,27,28,28,29,30,31,32,33,33,34,35,35,36,37,38,39,40,41,42,44,45,47,48,50,52,53,55,57,58,60,62,64,66,68,70,72,74,76,78,80,82,83,85,87,89,91,93,95,97,100,102,105,108,111,115,119,124,129,135,141,149,158,170,186,214,366,997],
    april: [8,9,9,10,10,11,11,12,12,12,13,13,14,14,15,15,16,16,17,17,17,18,18,18,18,19,19,19,19,19,20,20,20,20,20,20,21,21,21,21,21,21,22,22,22,22,22,22,23,23,23,23,23,23,24,24,24,24,24,24,25,25,25,25,26,26,26,26,26,27,27,27,28,28,28,29,29,30,30,31,31,32,32,33,34,34,35,36,37,38,40,41,44,48,53,59,76,107,134]
  }
};

const pctLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);

function createPercentileCombo(canvasId, dataKey, titleKey, yMax, improvementMin, improvementMax) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const { march, april } = DATA[dataKey];
  const improve = march.map((value, index) => Number((((value - april[index]) / value) * 100).toFixed(1)));

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: pctLabels,
      datasets: [
        {
          label: t('beforeMarch'), data: march,
          borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.1)',
          fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2, yAxisID: 'y'
        },
        {
          label: t('afterApril'), data: april,
          borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2, yAxisID: 'y'
        },
        {
          label: t('improvement'), data: improve,
          borderColor: 'rgb(40, 167, 69)', backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: 'origin', tension: 0.3, pointRadius: 0, borderWidth: 2,
          borderDash: [6, 4], yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: t(titleKey) },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === 'y1'
              ? `${ctx.dataset.label}: ${ctx.parsed.y}%`
              : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(0)}ms`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: t('percentile') },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              const showLabels = [0, 49, 89, 94, 98];
              return showLabels.includes(index) ? this.getLabelForValue(value) : '';
            }
          }
        },
        y: {
          type: 'linear', position: 'right', title: { display: true, text: t('responseMs') },
          min: 0, max: yMax, ticks: { stepSize: yMax === 1000 ? 200 : 500 }
        },
        y1: {
          type: 'linear', position: 'left', title: { display: true, text: t('improvementPct'), color: 'rgb(40, 167, 69)' },
          min: improvementMin, max: improvementMax,
          ticks: { stepSize: 20, color: 'rgb(40, 167, 69)', callback: (value) => `${value}%` },
          border: { color: 'rgb(40, 167, 69)', width: 2 }, grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

createPercentileCombo('chart-pct-all-combo', 'all', 'titleAll', 2500, -80, 60);
createPercentileCombo('chart-pct-qwgjk-combo', 'qwgjk', 'titleQwgjk', 3000, 0, 100);
createPercentileCombo('chart-pct-excl-combo', 'excluded', 'titleExcluded', 1000, -60, 100);
