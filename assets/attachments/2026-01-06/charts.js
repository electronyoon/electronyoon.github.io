// Initialize all charts
document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = initAllCharts;
        document.head.appendChild(script);
    } else {
        initAllCharts();
    }
});

const chartMessages = {
    ko: {
        before: '동기 로딩(개선 전)',
        after: '비동기 로딩(개선 후)',
        percentileResponseTitle: '백분위수별 응답 시간 비교',
        keyPercentileTitle: '핵심 백분위수 비교',
        responseMsLog: '응답 시간 (ms, log scale)',
        percentile: '백분위수',
        histogramTitle: '응답시간별 분포 (Histogram)',
        frequencyLog: '빈도 (Log Scale)',
        responseMs: '응답 시간 (ms)',
        count: '건'
    },
    en: {
        before: 'Synchronous loading (before)',
        after: 'Asynchronous loading (after)',
        percentileResponseTitle: 'Response time by percentile',
        keyPercentileTitle: 'Key percentile comparison',
        responseMsLog: 'Response time (ms, log scale)',
        percentile: 'Percentile',
        histogramTitle: 'Response-time distribution (histogram)',
        frequencyLog: 'Frequency (log scale)',
        responseMs: 'Response time (ms)',
        count: ' requests'
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

function initAllCharts() {
    if (document.getElementById('percentileChart')) initPercentileChart();
    if (document.getElementById('boxPlotChart')) initBoxPlotChart();
    if (document.getElementById('histogramChart')) initHistogramChart();
}

// ============================================================
// 통계 데이터
// ============================================================
const stats = {
    asis: {
        n: 3000,
        mean: 427.63,
        std: 1106.29,
        skewness: 4.12,
        kurtosis: 16.29,
        histogram: [17, 0, 1075, 1517, 172, 28, 5, 3, 0, 2, 2,
            0, 1, 4, 0, 0, 1, 1, 0, 0, 0, 0,
            2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0,
            0, 0, 0, 1, 0, 0, 0],
        percentiles: [120, 126.98, 129, 131, 132, 134, 135, 135, 136, 137,
            137, 138, 139, 139, 140, 141, 141, 142, 142, 142,
            143, 143.78, 144, 144.76, 145, 145, 146, 146, 147, 147,
            147, 148, 148, 148.66, 149, 149, 150, 150, 151, 151,
            151, 152, 152, 153, 154, 154, 155, 155, 156, 156,
            157, 157, 158, 158, 159, 160, 160, 161, 162, 163,
            163, 164, 164, 165, 166, 167, 168, 168.32, 169, 170,
            171, 172, 173, 174, 175, 176, 177, 179, 180, 182,
            184, 187, 189, 191, 193, 196, 200, 204, 208, 216,
            224.09, 235, 263.14, 504.8, 3983.2, 4849.24, 5139.18, 5172.02, 5190.01]
    },
    tobe: {
        n: 3000,
        mean: 166.10,
        std: 45.24,
        skewness: 6.40,
        kurtosis: 108.03,
        histogram: [16, 0, 1097, 1499, 287, 59, 24, 10, 4, 2, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0],
        percentiles: [117, 120, 123, 125, 127, 128, 130, 131, 132, 133,
            134, 135, 135, 136, 137, 137, 138, 139, 139, 140,
            141, 141, 142, 142, 143, 143, 144, 145, 145, 146,
            146, 147, 147, 148, 148, 149, 149, 150, 150.61, 151,
            151, 152, 153, 154, 154, 155, 156, 156, 157, 157,
            158, 159, 160, 160, 161, 162, 163, 163, 164, 165,
            165, 166, 167, 168, 169, 170, 171, 172, 173, 173,
            174, 175, 177, 178, 179, 180, 181, 183, 185, 186,
            188, 190, 192, 193.16, 195, 197, 199, 202, 204, 207,
            210.09, 214, 218, 223, 231, 239, 253, 282, 321.01]
    }
};

const bins = Array.from({ length: 40 }, (_, i) => i * 50);
const binLabels = bins.map((b, i) => i < bins.length - 1 ? `${b}-${b + 50}` : `${b}+`);

// ============================================================
// 2. 백분위수 비교 차트
// ============================================================
export const initPercentileChart = () => {
    const percentileLabels = Array.from({ length: 99 }, (_, i) => `P${i + 1}`);

    new Chart(document.getElementById('percentileChart'), {
        type: 'line',
        data: {
            labels: percentileLabels,
            datasets: [
                {
                    label: t('before'),
                    data: stats.asis.percentiles,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true, tension: 0.3, pointRadius: 0
                },
                {
                    label: t('after'),
                    data: stats.tobe.percentiles,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true, tension: 0.3, pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                title: { display: true, text: t('percentileResponseTitle'), font: { size: 16 } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}ms`
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: t('responseMsLog') },
                    min: 100
                },
                x: {
                    title: { display: true, text: t('percentile') },
                    ticks: {
                        autoSkip: false,
                        callback: function (value, index) {
                            const showLabels = [49, 89, 94, 98];
                            return showLabels.includes(index) ? this.getLabelForValue(value) : '';
                        }
                    }
                }
            }
        }
    });
};

// ============================================================
// 3. 핵심 백분위수 비교 차트
// ============================================================
export const initBoxPlotChart = () => {
    const keyPercentiles = ['P50', 'P75', 'P90', 'P95', 'P99'];

    // P50, P75, P90, P95, P99에 해당하는 인덱스 (0-based)
    const indices = [49, 74, 89, 94, 98];
    const asisValues = indices.map(i => stats.asis.percentiles[i]);
    const tobeValues = indices.map(i => stats.tobe.percentiles[i]);

    new Chart(document.getElementById('boxPlotChart'), {
        type: 'bar',
        data: {
            labels: keyPercentiles,
            datasets: [
                {
                    label: t('before'),
                    data: asisValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: t('after'),
                    data: tobeValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: t('keyPercentileTitle'), font: { size: 16 } },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}ms` }
                }
            },
            scales: {
                y: { type: 'logarithmic', title: { display: true, text: t('responseMsLog') } },
                x: { title: { display: true, text: t('percentile') } }
            }
        }
    });
};

// ============================================================
// 4. 응답시간 분포 히스토그램
// ============================================================
export const initHistogramChart = () => {
    new Chart(document.getElementById('histogramChart'), {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [
                {
                    label: t('before'),
                    data: stats.asis.histogram,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: t('after'),
                    data: stats.tobe.histogram,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: t('histogramTitle'),
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}${t('count')}`
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: t('frequencyLog') },
                    min: 1
                },
                x: {
                    title: { display: true, text: t('responseMs') },
                    ticks: {
                        maxTicksLimit: 10,
                        autoSkip: true
                    }
                }
            }
        }
    });
};
