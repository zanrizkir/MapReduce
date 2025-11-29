// ==================== AVERAGE CALCULATOR FUNCTIONS ====================
let numbers = [];
let averageChart = null;

function initAverageMethods() {
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function addNumber() {
    const input = document.getElementById('numberInput');
    if (!input) return;

    const value = parseFloat(input.value);
    
    if (!isNaN(value)) {
        numbers.push(value);
        updateNumbersList();
        input.value = '';
        input.focus();
    }
}

function updateNumbersList() {
    const list = document.getElementById('numbersList');
    if (!list) return;
    
    list.innerHTML = '';
    
    numbers.forEach((num, index) => {
        const numberItem = document.createElement('div');
        numberItem.className = 'number-item';
        numberItem.innerHTML = `
            ${num}
            <button class="remove-number" onclick="removeNumber(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        list.appendChild(numberItem);
    });
}

function removeNumber(index) {
    numbers.splice(index, 1);
    updateNumbersList();
}

function processTextData() {
    const textData = document.getElementById('textData');
    if (!textData) return;

    const text = textData.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Masukkan data terlebih dahulu!');
        return;
    }

    const numbers = lines.map(line => parseFloat(line.trim())).filter(num => !isNaN(num));
    processNumbers(numbers);
}

function processManualData() {
    if (numbers.length === 0) {
        alert('Tambahkan angka terlebih dahulu!');
        return;
    }

    processNumbers(numbers);
}

function processNumbers(data) {
    const processBtn = document.querySelector('.btn-process');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        // MapReduce functions for average calculation
        function averageMapper(number, index) {
            return [['sum', number], ['count', 1]];
        }

        function averageReducer(key, values) {
            if (key === 'sum') {
                return values.reduce((a, b) => a + b, 0);
            } else if (key === 'count') {
                return values.reduce((a, b) => a + b, 0);
            }
            return 0;
        }

        // Execute MapReduce
        const result = MapReduceEngine.mapReduce(data, averageMapper, averageReducer);
        
        // Calculate results
        const sum = result.results.find(([key]) => key === 'sum')[1];
        const count = result.results.find(([key]) => key === 'count')[1];
        const average = sum / count;
        
        // Find min and max
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        
        // Display results
        displayAverageResults(sum, count, average, min, max, range, data);
        displayProcessSteps(result, 'mapResults', 'shuffleResults', 'reduceResults');
        createAverageChart(data);
        
        // Show sections
        showSection('resultsSection');
        showSection('processSteps');
        hideSection('initialState');
        hideLoading(processBtn, originalText);
        
        // Auto-expand map phase
        setTimeout(() => togglePhase('mapPhase'), 100);
        
    }, 800);
}

function displayAverageResults(sum, count, average, min, max, range, data) {
    const resultsGrid = document.getElementById('resultsGrid');
    const statsList = document.getElementById('statsList');
    
    if (resultsGrid) {
        resultsGrid.innerHTML = `
            <div class="result-item">
                <div class="result-value">${average.toFixed(2)}</div>
                <div class="result-label">Rata-rata</div>
            </div>
            <div class="result-item">
                <div class="result-value">${sum.toFixed(2)}</div>
                <div class="result-label">Total</div>
            </div>
            <div class="result-item">
                <div class="result-value">${count}</div>
                <div class="result-label">Jumlah Data</div>
            </div>
            <div class="result-item">
                <div class="result-value">${min}</div>
                <div class="result-label">Nilai Minimum</div>
            </div>
            <div class="result-item">
                <div class="result-value">${max}</div>
                <div class="result-label">Nilai Maksimum</div>
            </div>
            <div class="result-item">
                <div class="result-value">${range.toFixed(2)}</div>
                <div class="result-label">Range</div>
            </div>
        `;
    }
    
    if (statsList) {
        // Calculate additional statistics
        const sortedData = [...data].sort((a, b) => a - b);
        const median = sortedData.length % 2 === 0 
            ? (sortedData[sortedData.length/2 - 1] + sortedData[sortedData.length/2]) / 2
            : sortedData[Math.floor(sortedData.length/2)];
        
        const variance = data.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        
        statsList.innerHTML = `
            <div class="stat-detail">
                <span class="stat-name">Median</span>
                <span class="stat-value">${median.toFixed(2)}</span>
            </div>
            <div class="stat-detail">
                <span class="stat-name">Variansi</span>
                <span class="stat-value">${variance.toFixed(2)}</span>
            </div>
            <div class="stat-detail">
                <span class="stat-name">Standar Deviasi</span>
                <span class="stat-value">${stdDev.toFixed(2)}</span>
            </div>
            <div class="stat-detail">
                <span class="stat-name">Data Points</span>
                <span class="stat-value">${data.length}</span>
            </div>
        `;
    }
}

function createAverageChart(data) {
    const ctx = document.getElementById('dataChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (averageChart) {
        averageChart.destroy();
    }
    
    // Create histogram data
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const binCount = Math.min(10, data.length);
    const binSize = range / binCount;
    
    const histogram = Array(binCount).fill(0);
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
        histogram[binIndex]++;
    });
    
    const labels = Array.from({length: binCount}, (_, i) => {
        const start = min + i * binSize;
        const end = min + (i + 1) * binSize;
        return `${start.toFixed(1)} - ${end.toFixed(1)}`;
    });
    
    averageChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frekuensi',
                data: histogram,
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribusi Data',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Frekuensi'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Rentang Nilai'
                    }
                }
            }
        }
    });
}

// Initialize Average page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('average.html')) {
        console.log('🧮 Initializing Average Calculator page');
        
        initAverageMethods();
        applyMobileFixes();
    }
});