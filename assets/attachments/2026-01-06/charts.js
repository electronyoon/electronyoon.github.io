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
                    label: '동기 로딩(개선 전)',
                    data: stats.asis.percentiles,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true, tension: 0.3, pointRadius: 0
                },
                {
                    label: '비동기 로딩(개선 후)',
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
                title: { display: true, text: '백분위수별 응답 시간 비교', font: { size: 16 } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}ms`
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: '응답 시간 (ms, log scale)' },
                    min: 100
                },
                x: {
                    title: { display: true, text: '백분위수' },
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
                    label: '동기 로딩(개선 전)',
                    data: asisValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: '비동기 로딩(개선 후)',
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
                title: { display: true, text: '핵심 백분위수 비교', font: { size: 16 } },
                tooltip: {
                    callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}ms` }
                }
            },
            scales: {
                y: { type: 'logarithmic', title: { display: true, text: '응답 시간 (ms, log scale)' } },
                x: { title: { display: true, text: '백분위수' } }
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
                    label: '동기 로딩(개선 전)',
                    data: stats.asis.histogram,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1
                },
                {
                    label: '비동기 로딩(개선 후)',
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
                    text: '응답시간별 분포 (Histogram)',
                    font: { size: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}건`
                    }
                }
            },
            scales: {
                y: {
                    type: 'logarithmic',
                    title: { display: true, text: '빈도 (Log Scale)' },
                    min: 1
                },
                x: {
                    title: { display: true, text: '응답 시간 (ms)' },
                    ticks: {
                        maxTicksLimit: 10,
                        autoSkip: true
                    }
                }
            }
        }
    });
};
