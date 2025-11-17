// MapReduce Engine - Pure JavaScript
class MapReduceEngine {
    static mapReduce(data, mapper, reducer) {
        let mapped = [];
        
        // Map Phase
        data.forEach((line, index) => {
            const results = mapper(line, index + 1);
            if (Array.isArray(results[0])) {
                // Multiple returns
                results.forEach(item => mapped.push(item));
            } else {
                // Single return
                mapped.push(results);
            }
        });
        
        // Shuffle Phase
        let shuffled = {};
        mapped.forEach(([key, value]) => {
            if (!shuffled[key]) shuffled[key] = [];
            shuffled[key].push(value);
        });
        
        // Reduce Phase
        let results = [];
        Object.entries(shuffled).forEach(([key, values]) => {
            const result = reducer(key, values);
            results.push([key, result]);
        });
        
        return {
            mapped: mapped,
            shuffled: shuffled,
            results: results
        };
    }
}

// Common Functions
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    button.disabled = true;
    return originalText;
}

function hideLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

function showSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.style.display = 'block';
    }
}

function hideSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.style.display = 'none';
    }
}

function displayProcessSteps(steps, mapId, shuffleId, reduceId) {
    // Map Phase
    const mapResults = document.getElementById(mapId);
    if (mapResults) {
        mapResults.innerHTML = steps.mapped.slice(0, 50).map(item => 
            `<div class="mb-1"><code>("${item[0]}", ${item[1]})</code></div>`
        ).join('');
        
        if (steps.mapped.length > 50) {
            mapResults.innerHTML += `<div class="text-muted">... dan ${steps.mapped.length - 50} data lainnya</div>`;
        }
    }
    
    // Shuffle Phase
    const shuffleResults = document.getElementById(shuffleId);
    if (shuffleResults) {
        shuffleResults.innerHTML = Object.entries(steps.shuffled).map(([key, values]) => 
            `<div class="mb-1"><strong>"${key}":</strong> [${values.join(', ')}]</div>`
        ).join('');
    }
    
    // Reduce Phase
    const reduceResults = document.getElementById(reduceId);
    if (reduceResults) {
        reduceResults.innerHTML = steps.results.map(item => 
            `<div class="mb-1"><code>"${item[0]}" → ${item[1]}</code></div>`
        ).join('');
    }
}

// Toggle process phase visibility
function togglePhase(phaseId) {
    const phaseContent = document.getElementById(phaseId);
    const phaseHeader = phaseContent.previousElementSibling;
    
    if (phaseContent && phaseHeader) {
        // Toggle current phase
        phaseContent.classList.toggle('show');
        phaseHeader.classList.toggle('active');
        
        // Update indicator
        const indicator = phaseHeader.querySelector('.phase-indicator i');
        if (phaseContent.classList.contains('show')) {
            indicator.classList.remove('fa-chevron-down');
            indicator.classList.add('fa-chevron-up');
        } else {
            indicator.classList.remove('fa-chevron-up');
            indicator.classList.add('fa-chevron-down');
        }
    }
}

// ==================== WORD COUNT FUNCTIONS ====================
function loadWordCountExample() {
    const exampleText = `Halo dunia! Ini adalah contoh analisis word count
MapReduce adalah algoritma yang powerful untuk pemrosesan data besar
Aplikasi ini berjalan sepenuhnya di browser Anda
Tidak memerlukan server backend sama sekali
Setiap kata akan dihitung frekuensinya
Proses dilakukan dalam tiga fase: Map, Shuffle, dan Reduce
Hasilnya ditampilkan dalam tabel dan visualisasi grafik
Teknologi modern memungkinkan komputasi di client-side`;

    const textInput = document.getElementById('textInput');
    if (textInput) {
        textInput.value = exampleText;

        // Add some animation
        textInput.style.transform = 'scale(1.02)';
        setTimeout(() => {
            textInput.style.transform = 'scale(1)';
        }, 200);
    }
}

function processWordCount() {
    const textInput = document.getElementById('textInput');
    if (!textInput) return;

    const text = textInput.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Masukkan teks terlebih dahulu!');
        return;
    }

    const processBtn = document.getElementById('processBtn');
    const originalText = showLoading(processBtn);

    // Simulate processing delay
    setTimeout(() => {
        // MapReduce functions for word count
        function wordMapper(line, lineNum) {
            const words = line.toLowerCase().match(/\b\w+\b/g) || [];
            return words.map(word => [word, 1]);
        }

        function wordReducer(key, values) {
            return values.reduce((sum, val) => sum + val, 0);
        }

        // Execute MapReduce
        const result = MapReduceEngine.mapReduce(lines, wordMapper, wordReducer);
        
        // Display results
        displayWordCountResults(result);
        displayProcessSteps(result, 'mapResults', 'shuffleResults', 'reduceResults');
        createWordCountChart(result.results);
        
        // Show sections
        showSection('resultsSection');
        showSection('processSteps');
        hideSection('initialState');
        hideLoading(processBtn, originalText);
        
        // Auto-expand map phase
        togglePhase('mapPhase');
        
    }, 1000);
}

function displayWordCountResults(result) {
    const totalWords = result.results.reduce((sum, [_, count]) => sum + count, 0);
    const uniqueWords = result.results.length;
    
    const summary = document.getElementById('summary');
    if (summary) {
        summary.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${totalWords}</div>
                <div class="stat-label">Total Kata</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${uniqueWords}</div>
                <div class="stat-label">Kata Unik</div>
            </div>
        `;
    }
    
    const tbody = document.querySelector('#resultsTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        // Sort by frequency descending and take top 20
        result.results
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .forEach(([word, count]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <span class="word-text">${word}</span>
                    </td>
                    <td>
                        <span class="count-badge">${count}</span>
                    </td>
                `;
                tbody.appendChild(row);
            });
    }
}

function createWordCountChart(results) {
    const ctx = document.getElementById('wordChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.wordChartInstance) {
        window.wordChartInstance.destroy();
    }
    
    // Get top 8 words
    const topWords = results
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    window.wordChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: topWords.map(item => item[0]),
            datasets: [{
                label: 'Frekuensi',
                data: topWords.map(item => item[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ],
                borderColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ],
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Kata Paling Sering Muncul',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2c3e50'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6c757d'
                    }
                }
            }
        }
    });
}

// ==================== AVERAGE CALCULATOR FUNCTIONS ====================
let numbers = [];
let averageChart = null;

// Switch between input methods
function initAverageMethods() {
    document.querySelectorAll('.method-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Add number to manual input
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

// Update numbers list display
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

// Remove number from list
function removeNumber(index) {
    numbers.splice(index, 1);
    updateNumbersList();
}

// Process text data
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

// Process manual data
function processManualData() {
    if (numbers.length === 0) {
        alert('Tambahkan angka terlebih dahulu!');
        return;
    }

    processNumbers(numbers);
}

// Main processing function for average
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
        togglePhase('mapPhase');
        
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
                borderWidth: 1
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

// ==================== SALES ANALYSIS FUNCTIONS ====================
function processSalesData() {
    const salesData = document.getElementById('salesData');
    if (!salesData) return;

    const text = salesData.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Masukkan data penjualan terlebih dahulu!');
        return;
    }

    const processBtn = document.getElementById('processSalesBtn');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        try {
            // Parse sales data (format: product,quantity,price,region,date)
            const sales = lines.map(line => {
                const [product, quantity, price, region, date] = line.split(',');
                return {
                    product: product?.trim(),
                    quantity: parseInt(quantity) || 0,
                    price: parseFloat(price) || 0,
                    region: region?.trim(),
                    date: date?.trim(),
                    total: (parseInt(quantity) || 0) * (parseFloat(price) || 0)
                };
            }).filter(sale => sale.product && sale.quantity > 0);

            if (sales.length === 0) {
                throw new Error('Format data tidak valid');
            }

            // Process using MapReduce for different analyses
            processSalesByProduct(sales);
            processSalesByRegion(sales);
            processSalesSummary(sales);
            
            hideLoading(processBtn, originalText);
            showSection('salesResults');
            hideSection('salesEmptyState');
            
        } catch (error) {
            alert('Error memproses data: ' + error.message);
            hideLoading(processBtn, originalText);
        }
    }, 1000);
}

function processSalesByProduct(sales) {
    // MapReduce for product sales
    function productMapper(sale, index) {
        return [sale.product, sale.total];
    }

    function productReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const productSales = MapReduceEngine.mapReduce(sales, productMapper, productReducer);
    displayProductSales(productSales.results);
    createProductChart(productSales.results);
}

function processSalesByRegion(sales) {
    // MapReduce for regional sales
    function regionMapper(sale, index) {
        return [sale.region, sale.total];
    }

    function regionReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const regionSales = MapReduceEngine.mapReduce(sales, regionMapper, regionReducer);
    displayRegionSales(regionSales.results);
    createRegionChart(regionSales.results);
}

function processSalesSummary(sales) {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const uniqueProducts = [...new Set(sales.map(sale => sale.product))].length;
    const uniqueRegions = [...new Set(sales.map(sale => sale.region))].length;
    
    displaySalesSummary(totalSales, totalQuantity, uniqueProducts, uniqueRegions);
}

function displaySalesSummary(totalSales, totalQuantity, uniqueProducts, uniqueRegions) {
    const summaryElement = document.getElementById('salesSummary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <div class="summary-card sales">
                <div class="summary-value">${formatCurrency(totalSales)}</div>
                <div class="summary-label">Total Penjualan</div>
            </div>
            <div class="summary-card products">
                <div class="summary-value">${totalQuantity}</div>
                <div class="summary-label">Total Quantity</div>
            </div>
            <div class="summary-card customers">
                <div class="summary-value">${uniqueProducts}</div>
                <div class="summary-label">Produk Unik</div>
            </div>
            <div class="summary-card regions">
                <div class="summary-value">${uniqueRegions}</div>
                <div class="summary-label">Region</div>
            </div>
        `;
    }
}

function displayProductSales(productSales) {
    const tableBody = document.querySelector('#productsTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        const sortedProducts = productSales.sort((a, b) => b[1] - a[1]).slice(0, 10);
        const maxSales = sortedProducts[0]?.[1] || 1;
        
        sortedProducts.forEach(([product, total], index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="product-rank">${index + 1}</span>
                    <span class="product-name">${product}</span>
                </td>
                <td class="product-sales">${formatCurrency(total)}</td>
                <td>
                    <div class="sales-bar">
                        <div class="sales-progress" style="width: ${(total / maxSales) * 100}%"></div>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function displayRegionSales(regionSales) {
    const regionsGrid = document.getElementById('regionsGrid');
    if (regionsGrid) {
        regionsGrid.innerHTML = '';
        
        const totalSales = regionSales.reduce((sum, [_, total]) => sum + total, 0);
        
        regionSales
            .sort((a, b) => b[1] - a[1])
            .forEach(([region, total]) => {
                const regionCard = document.createElement('div');
                regionCard.className = 'region-card';
                regionCard.innerHTML = `
                    <div class="region-header">
                        <h5 class="region-name">${region}</h5>
                        <div class="region-sales">${formatCurrency(total)}</div>
                    </div>
                    <div class="region-stats">
                        <div class="stat-item">
                            <span class="stat-label">Penjualan</span>
                            <span class="stat-value">${formatCurrency(total)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Market Share</span>
                            <span class="stat-value">${((total / totalSales) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                `;
                regionsGrid.appendChild(regionCard);
            });
    }
}

// Create Product Sales Chart
function createProductChart(productSales) {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.productChartInstance) {
        window.productChartInstance.destroy();
    }
    
    const sortedProducts = productSales.sort((a, b) => b[1] - a[1]).slice(0, 8);
    
    window.productChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedProducts.map(item => item[0]),
            datasets: [{
                label: 'Total Penjualan',
                data: sortedProducts.map(item => item[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ],
                borderColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ],
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Penjualan per Produk',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Rp ${context.parsed.y.toLocaleString('id-ID')}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toLocaleString('id-ID');
                        }
                    }
                }
            }
        }
    });
}

// Create Region Sales Chart
function createRegionChart(regionSales) {
    const ctx = document.getElementById('regionChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.regionChartInstance) {
        window.regionChartInstance.destroy();
    }
    
    window.regionChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: regionSales.map(item => item[0]),
            datasets: [{
                data: regionSales.map(item => item[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#a8e6cf', '#dcedc1', '#ffd3b6', '#ffaaa5'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Distribusi Penjualan per Region',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `Rp ${value.toLocaleString('id-ID')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ==================== CHAT ANALYSIS FUNCTIONS ====================
function processChatData() {
    const chatData = document.getElementById('chatData');
    if (!chatData) return;

    const text = chatData.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Masukkan data chat terlebih dahulu!');
        return;
    }

    const processBtn = document.getElementById('processChatBtn');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        try {
            // Parse chat data (format: timestamp,user,message)
            const messages = lines.map(line => {
                const parts = line.split(',');
                if (parts.length < 3) return null;
                
                const timestamp = parts[0]?.trim();
                const user = parts[1]?.trim();
                const message = parts.slice(2).join(',').trim();
                
                return {
                    timestamp: timestamp,
                    user: user,
                    message: message,
                    words: message.split(/\s+/).length,
                    hour: timestamp ? new Date(timestamp).getHours() : 0
                };
            }).filter(msg => msg && msg.user && msg.message);

            if (messages.length === 0) {
                throw new Error('Format data tidak valid');
            }

            // Process chat analysis
            processChatStatistics(messages);
            processParticipantAnalysis(messages);
            processWordFrequency(messages);
            processActivityTimeline(messages);
            
            hideLoading(processBtn, originalText);
            showSection('chatResults');
            hideSection('chatEmptyState');
            
        } catch (error) {
            alert('Error memproses data: ' + error.message);
            hideLoading(processBtn, originalText);
        }
    }, 1000);
}

function processChatStatistics(messages) {
    const totalMessages = messages.length;
    const uniqueUsers = [...new Set(messages.map(msg => msg.user))].length;
    const totalWords = messages.reduce((sum, msg) => sum + msg.words, 0);
    const avgWordsPerMessage = totalWords / totalMessages;
    
    displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage);
}

function displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage) {
    const statsElement = document.getElementById('chatStatistics');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-card messages">
                <div class="stat-value">${totalMessages}</div>
                <div class="stat-label">Total Pesan</div>
            </div>
            <div class="stat-card participants">
                <div class="stat-value">${uniqueUsers}</div>
                <div class="stat-label">Partisipan</div>
            </div>
            <div class="stat-card words">
                <div class="stat-value">${totalWords}</div>
                <div class="stat-label">Total Kata</div>
            </div>
            <div class="stat-card media">
                <div class="stat-value">${avgWordsPerMessage.toFixed(1)}</div>
                <div class="stat-label">Kata/Pesan</div>
            </div>
        `;
    }
}

function processParticipantAnalysis(messages) {
    // MapReduce for participant message count
    function participantMapper(message, index) {
        return [message.user, 1];
    }

    function participantReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const participantStats = MapReduceEngine.mapReduce(messages, participantMapper, participantReducer);
    displayParticipantAnalysis(participantStats.results, messages);
    createParticipantChart(participantStats.results);
}

function displayParticipantAnalysis(participantStats, messages) {
    const participantList = document.getElementById('participantList');
    if (participantList) {
        participantList.innerHTML = '';
        
        participantStats
            .sort((a, b) => b[1] - a[1])
            .forEach(([user, messageCount]) => {
                const userMessages = messages.filter(msg => msg.user === user);
                const wordCount = userMessages.reduce((sum, msg) => sum + msg.words, 0);
                const avgWords = wordCount / messageCount;
                
                const participantItem = document.createElement('div');
                participantItem.className = 'participant-item';
                participantItem.innerHTML = `
                    <div class="participant-avatar">
                        ${user.charAt(0).toUpperCase()}
                    </div>
                    <div class="participant-info">
                        <h5 class="participant-name">${user}</h5>
                        <p class="participant-details">${avgWords.toFixed(1)} kata/pesan</p>
                    </div>
                    <div class="participant-metrics">
                        <div class="messages-count">${messageCount}</div>
                        <div class="words-count">${wordCount} kata</div>
                    </div>
                `;
                participantList.appendChild(participantItem);
            });
    }
}

function processWordFrequency(messages) {
    // Extract all words from messages
    const allWords = messages.flatMap(msg => 
        msg.message.toLowerCase().match(/\b\w+\b/g) || []
    );
    
    // MapReduce for word frequency
    function wordMapper(word, index) {
        return [word, 1];
    }

    function wordReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const wordStats = MapReduceEngine.mapReduce(allWords, wordMapper, wordReducer);
    displayWordFrequency(wordStats.results);
}

function displayWordFrequency(wordStats) {
    const frequencyChart = document.getElementById('frequencyChart');
    if (!frequencyChart) return;
    
    // Destroy previous chart if exists
    if (window.frequencyChartInstance) {
        window.frequencyChartInstance.destroy();
    }
    
    // Get top 10 words (exclude common words)
    const commonWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 'tidak', 'ada'];
    const topWords = wordStats
        .filter(([word]) => !commonWords.includes(word.toLowerCase()))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    window.frequencyChartInstance = new Chart(frequencyChart.getContext('2d'), {
        type: 'bar',
        data: {
            labels: topWords.map(item => item[0]),
            datasets: [{
                label: 'Frekuensi',
                data: topWords.map(item => item[1]),
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
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Kata Paling Sering Digunakan',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function processActivityTimeline(messages) {
    // Group messages by hour
    const hourlyActivity = Array(24).fill(0);
    messages.forEach(msg => {
        if (msg.hour >= 0 && msg.hour < 24) {
            hourlyActivity[msg.hour]++;
        }
    });
    
    createTimelineChart(hourlyActivity);
}

function createTimelineChart(hourlyActivity) {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.timelineChartInstance) {
        window.timelineChartInstance.destroy();
    }
    
    const labels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    window.timelineChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Jumlah Pesan',
                data: hourlyActivity,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Aktivitas Chat per Jam',
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
                        text: 'Jumlah Pesan'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Jam'
                    }
                }
            }
        }
    });
}

function createParticipantChart(participantStats) {
    const ctx = document.getElementById('participantChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.participantChartInstance) {
        window.participantChartInstance.destroy();
    }
    
    const topParticipants = participantStats.sort((a, b) => b[1] - a[1]).slice(0, 8);
    
    window.participantChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: topParticipants.map(item => item[0]),
            datasets: [{
                data: topParticipants.map(item => item[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Distribusi Pesan per Partisipan',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

// Create Sentiment Chart (placeholder - you can integrate with sentiment analysis API)
function createSentimentChart() {
    const ctx = document.getElementById('sentimentChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (window.sentimentChartInstance) {
        window.sentimentChartInstance.destroy();
    }
    
    // This is a placeholder - in real implementation, you'd analyze sentiment
    window.sentimentChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Positif', 'Netral', 'Negatif'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: [
                    '#48bb78', // green for positive
                    '#ed8936', // orange for neutral
                    '#f56565'  // red for negative
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribusi Sentimen',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

// Initialize sentiment chart when chat analysis is processed
function initializeSentimentChart() {
    createSentimentChart();
}

// ==================== CHAT ANALYSIS FUNCTIONS ====================
function processChatData() {
    const chatData = document.getElementById('chatData');
    if (!chatData) return;

    const text = chatData.value;
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Masukkan data chat terlebih dahulu!');
        return;
    }

    const processBtn = document.getElementById('processChatBtn');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        try {
            // Parse chat data (format: timestamp,user,message)
            const messages = lines.map(line => {
                const [timestamp, user, ...messageParts] = line.split(',');
                return {
                    timestamp: timestamp?.trim(),
                    user: user?.trim(),
                    message: messageParts.join(',').trim(),
                    words: messageParts.join(',').trim().split(/\s+/).length
                };
            }).filter(msg => msg.user && msg.message);

            if (messages.length === 0) {
                throw new Error('Format data tidak valid');
            }

            // Process chat analysis
            processChatStatistics(messages);
            processParticipantAnalysis(messages);
            processWordFrequency(messages);
            
            hideLoading(processBtn, originalText);
            showSection('chatResults');
            hideSection('chatEmptyState');
            
        } catch (error) {
            alert('Error memproses data: ' + error.message);
            hideLoading(processBtn, originalText);
        }
    }, 1000);
}

function processChatStatistics(messages) {
    const totalMessages = messages.length;
    const uniqueUsers = [...new Set(messages.map(msg => msg.user))].length;
    const totalWords = messages.reduce((sum, msg) => sum + msg.words, 0);
    const avgWordsPerMessage = totalWords / totalMessages;
    
    displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage);
}

function displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage) {
    const statsElement = document.getElementById('chatStatistics');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-card messages">
                <div class="stat-value">${totalMessages}</div>
                <div class="stat-label">Total Pesan</div>
                <div class="stat-trend trend-up">+12%</div>
            </div>
            <div class="stat-card participants">
                <div class="stat-value">${uniqueUsers}</div>
                <div class="stat-label">Partisipan</div>
                <div class="stat-trend trend-up">+5%</div>
            </div>
            <div class="stat-card words">
                <div class="stat-value">${totalWords}</div>
                <div class="stat-label">Total Kata</div>
                <div class="stat-trend trend-up">+8%</div>
            </div>
            <div class="stat-card media">
                <div class="stat-value">${avgWordsPerMessage.toFixed(1)}</div>
                <div class="stat-label">Kata/Pesan</div>
                <div class="stat-trend trend-down">-2%</div>
            </div>
        `;
    }
}

function processParticipantAnalysis(messages) {
    // MapReduce for participant message count
    function participantMapper(message, index) {
        return [message.user, 1];
    }

    function participantReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const participantStats = MapReduceEngine.mapReduce(messages, participantMapper, participantReducer);
    displayParticipantAnalysis(participantStats.results, messages);
}

function displayParticipantAnalysis(participantStats, messages) {
    const participantList = document.getElementById('participantList');
    if (participantList) {
        participantList.innerHTML = '';
        
        participantStats
            .sort((a, b) => b[1] - a[1])
            .forEach(([user, messageCount]) => {
                const userMessages = messages.filter(msg => msg.user === user);
                const wordCount = userMessages.reduce((sum, msg) => sum + msg.words, 0);
                const avgWords = wordCount / messageCount;
                
                const participantItem = document.createElement('div');
                participantItem.className = 'participant-item';
                participantItem.innerHTML = `
                    <div class="participant-avatar">
                        ${user.charAt(0).toUpperCase()}
                    </div>
                    <div class="participant-info">
                        <h5 class="participant-name">${user}</h5>
                        <p class="participant-details">${avgWords.toFixed(1)} kata/pesan</p>
                    </div>
                    <div class="participant-metrics">
                        <div class="messages-count">${messageCount}</div>
                        <div class="words-count">${wordCount} kata</div>
                    </div>
                `;
                participantList.appendChild(participantItem);
            });
    }
}

function processWordFrequency(messages) {
    // Extract all words from messages
    const allWords = messages.flatMap(msg => 
        msg.message.toLowerCase().match(/\b\w+\b/g) || []
    );
    
    // MapReduce for word frequency
    function wordMapper(word, index) {
        return [word, 1];
    }

    function wordReducer(key, values) {
        return values.reduce((sum, val) => sum + val, 0);
    }

    const wordStats = MapReduceEngine.mapReduce(allWords, wordMapper, wordReducer);
    displayWordFrequency(wordStats.results);
}

function displayWordFrequency(wordStats) {
    const frequencyChart = document.getElementById('frequencyChart');
    if (!frequencyChart) return;
    
    // Destroy previous chart if exists
    if (window.frequencyChartInstance) {
        window.frequencyChartInstance.destroy();
    }
    
    // Get top 10 words
    const topWords = wordStats
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    window.frequencyChartInstance = new Chart(frequencyChart.getContext('2d'), {
        type: 'bar',
        data: {
            labels: topWords.map(item => item[0]),
            datasets: [{
                label: 'Frekuensi',
                data: topWords.map(item => item[1]),
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Kata Paling Sering Digunakan',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'word-count.html':
            loadWordCountExample();
            break;
        case 'average.html':
            initAverageMethods();
            // Load example data
            const textData = document.getElementById('textData');
            if (textData) {
                textData.value = `85
92
78
65
88
76
90
82
79
85
91
87
83
89
84`;
            }
            break;
        case 'sales.html':
            // Load example sales data
            const salesData = document.getElementById('salesData');
            if (salesData) {
                salesData.value = `Laptop,5,12000000,Jakarta,2024-01-15
Smartphone,8,3500000,Jakarta,2024-01-16
Tablet,3,6500000,Bandung,2024-01-16
Laptop,2,12000000,Surabaya,2024-01-17
Smartphone,12,3500000,Bandung,2024-01-18
Headphone,15,800000,Jakarta,2024-01-18
Tablet,4,6500000,Surabaya,2024-01-19
Laptop,3,12000000,Jakarta,2024-01-20
Smartphone,6,3500000,Surabaya,2024-01-20`;
            }
            break;
        case 'chat.html':
            // Load example chat data
            const chatData = document.getElementById('chatData');
            if (chatData) {
                chatData.value = `2024-01-15 10:30:00,Alice,Halo semuanya, apa kabar?
2024-01-15 10:31:00,Bob,Hai Alice, kabar baik! Bagaimana denganmu?
2024-01-15 10:32:00,Charlie,Saya juga baik, terima kasih
2024-01-15 10:33:00,Alice,Ada yang sudah coba fitur baru?
2024-01-15 10:34:00,Bob,Saya sudah coba, sangat menarik
2024-01-15 10:35:00,Alice,Bagus sekali, saya juga suka
2024-01-15 10:36:00,Charlie,Saya belum coba, nanti saya coba
2024-01-15 10:37:00,Bob,Recomended banget fiturnya
2024-01-15 10:38:00,Alice,Sama, saya setuju dengan Bob`;
            }
            break;
    }
    
    // Add event listener for Enter key in textareas
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'TEXTAREA') {
                if (activeElement.id === 'textInput') {
                    processWordCount();
                } else if (activeElement.id === 'textData') {
                    processTextData();
                } else if (activeElement.id === 'salesData') {
                    processSalesData();
                } else if (activeElement.id === 'chatData') {
                    processChatData();
                }
            }
        }
    });
});