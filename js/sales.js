// ==================== SALES ANALYSIS FUNCTIONS ====================

// Load example sales data
function loadSalesExample() {
    const salesData = document.getElementById('salesData');
    if (salesData) {
        salesData.value = `product,quantity,price,region,date
Laptop,5,12000000,Jakarta,2024-01-15
Smartphone,8,3500000,Jakarta,2024-01-16
Tablet,3,6500000,Bandung,2024-01-16
Laptop,2,12000000,Surabaya,2024-01-17
Smartphone,12,3500000,Bandung,2024-01-18
Headphone,15,800000,Jakarta,2024-01-18
Tablet,4,6500000,Surabaya,2024-01-19
Laptop,3,12000000,Jakarta,2024-01-20
Smartphone,6,3500000,Surabaya,2024-01-20`;
    }
}

// Switch between input methods
function switchInputMethod(method) {
    const textTab = document.querySelector('.method-tab:nth-child(1)');
    const fileTab = document.querySelector('.method-tab:nth-child(2)');
    const textSection = document.getElementById('textInputSection');
    const fileSection = document.getElementById('fileInputSection');
    
    if (method === 'text') {
        textTab.classList.add('active');
        fileTab.classList.remove('active');
        textSection.style.display = 'block';
        fileSection.style.display = 'none';
    } else {
        textTab.classList.remove('active');
        fileTab.classList.add('active');
        textSection.style.display = 'none';
        fileSection.style.display = 'block';
    }
}

// Initialize file upload for sales
function initSalesFileUpload() {
    console.log('📊 Initializing Sales file upload...');
    
    const fileInput = document.getElementById('salesFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const filePreview = document.getElementById('filePreview');
    
    if (!fileInput || !fileUploadArea) {
        console.error('❌ Sales upload elements not found');
        return;
    }

    // Click to select file
    fileUploadArea.addEventListener('click', function(e) {
        // Prevent triggering when clicking on the button
        if (!e.target.closest('.file-upload-btn')) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', handleSalesFileSelection);
    
    // Drag and drop events
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', function() {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleSalesFileSelection();
        }
    });

    function handleSalesFileSelection() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validate file type
            if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                // Show file info
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);
                fileInfo.style.display = 'block';
                
                // Read and preview file content
                const reader = new FileReader();
                reader.onload = function(e) {
                    const content = e.target.result;
                    // Show first few lines as preview
                    const lines = content.split('\n').slice(0, 5);
                    filePreview.innerHTML = lines.map(line => 
                        `<div>${line}</div>`
                    ).join('');
                    
                    if (content.split('\n').length > 5) {
                        filePreview.innerHTML += `<div class="text-muted">... dan ${content.split('\n').length - 5} baris lainnya</div>`;
                    }
                };
                
                reader.onerror = function() {
                    filePreview.innerHTML = '<div class="text-danger">Error membaca file</div>';
                };
                
                reader.readAsText(file);
                
            } else {
                alert('Silakan pilih file CSV yang valid. Format yang didukung: .csv');
                fileInput.value = '';
                fileInfo.style.display = 'none';
            }
        } else {
            fileInfo.style.display = 'none';
        }
    }
}

function processSalesData() {
    const textTab = document.querySelector('.method-tab:nth-child(1)');
    const fileInput = document.getElementById('salesFile');
    const textArea = document.getElementById('salesData');
    
    let salesData = '';
    
    if (textTab.classList.contains('active')) {
        // Using text input
        salesData = textArea.value.trim();
        if (!salesData) {
            alert('Silakan masukkan data penjualan dalam format CSV.');
            return;
        }
        processSalesDataWithMapReduce(salesData);
    } else {
        // Using file upload
        if (!fileInput.files.length) {
            alert('Silakan pilih file CSV untuk dianalisis.');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            salesData = e.target.result;
            processSalesDataWithMapReduce(salesData);
        };
        
        reader.onerror = function() {
            alert('Error membaca file. Silakan coba lagi.');
        };
        
        reader.readAsText(file);
    }
}

function processSalesDataWithMapReduce(salesData) {
    const processBtn = document.getElementById('processSalesBtn');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        try {
            // Parse sales data
            const lines = salesData.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                throw new Error('Data tidak valid atau kosong');
            }
            
            const headers = lines[0].split(',').map(header => header.trim());
            
            // Validate headers
            const expectedHeaders = ['product', 'quantity', 'price', 'region', 'date'];
            const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
            
            if (missingHeaders.length > 0) {
                throw new Error(`Header yang diperlukan tidak ditemukan: ${missingHeaders.join(', ')}`);
            }
            
            // Parse data rows
            const sales = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(value => value.trim());
                
                if (values.length !== headers.length) {
                    console.warn(`Baris ${i + 1} diabaikan: jumlah kolom tidak sesuai`);
                    continue;
                }
                
                const sale = {};
                headers.forEach((header, index) => {
                    sale[header] = values[index];
                });
                
                // Validate and convert data types
                const quantity = parseInt(sale.quantity);
                const price = parseInt(sale.price);
                
                if (isNaN(quantity) || isNaN(price)) {
                    console.warn(`Baris ${i + 1} diabaikan: quantity atau price tidak valid`);
                    continue;
                }
                
                sale.quantity = quantity;
                sale.price = price;
                sale.total = quantity * price;
                
                // Validate date
                if (!isValidDate(sale.date)) {
                    console.warn(`Baris ${i + 1} diabaikan: format tanggal tidak valid`);
                    continue;
                }
                
                sales.push(sale);
            }

            if (sales.length === 0) {
                throw new Error('Tidak ada data yang valid untuk diproses');
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

function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
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
    const totalTransactions = sales.length;
    const averageTransaction = totalSales / totalTransactions;
    
    displaySalesSummary(totalSales, totalQuantity, uniqueProducts, uniqueRegions, totalTransactions, averageTransaction);
}

function displaySalesSummary(totalSales, totalQuantity, uniqueProducts, uniqueRegions, totalTransactions, averageTransaction) {
    const summaryElement = document.getElementById('salesSummary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <div class="summary-card sales">
                <div class="summary-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-value">${formatCurrency(totalSales)}</div>
                    <div class="summary-label">Total Penjualan</div>
                </div>
            </div>
            <div class="summary-card products">
                <div class="summary-icon">
                    <i class="fas fa-box"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-value">${totalQuantity}</div>
                    <div class="summary-label">Total Quantity</div>
                </div>
            </div>
            <div class="summary-card customers">
                <div class="summary-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-value">${totalTransactions}</div>
                    <div class="summary-label">Total Transaksi</div>
                </div>
            </div>
            <div class="summary-card regions">
                <div class="summary-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="summary-content">
                    <div class="summary-value">${uniqueRegions}</div>
                    <div class="summary-label">Region</div>
                </div>
            </div>
        `;
    }
}

function displayProductSales(productSales) {
    const tableBody = document.querySelector('#productsTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        const sortedProducts = productSales.sort((a, b) => b[1] - a[1]).slice(0, 10);
        const totalSales = productSales.reduce((sum, [_, total]) => sum + total, 0);
        
        sortedProducts.forEach(([product, total], index) => {
            const percentage = ((total / totalSales) * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="product-rank">${index + 1}</span>
                    <span class="product-name">${product}</span>
                </td>
                <td class="product-sales">${formatCurrency(total)}</td>
                <td>
                    <span class="percentage">${percentage}%</span>
                    <div class="sales-bar">
                        <div class="sales-progress" style="width: ${percentage}%"></div>
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
                const percentage = ((total / totalSales) * 100).toFixed(1);
                const regionCard = document.createElement('div');
                regionCard.className = 'region-card';
                regionCard.innerHTML = `
                    <div class="region-header">
                        <h5 class="region-name">${region}</h5>
                        <div class="region-percentage">${percentage}%</div>
                    </div>
                    <div class="region-stats">
                        <div class="region-stat">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>${formatCurrency(total)}</span>
                        </div>
                        <div class="region-stat">
                            <i class="fas fa-chart-pie"></i>
                            <span>${percentage}% market share</span>
                        </div>
                    </div>
                    <div class="region-progress">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                `;
                regionsGrid.appendChild(regionCard);
            });
    }
}

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

// Tambahkan fungsi ini untuk membersihkan file upload
function clearFileUpload() {
    const fileInput = document.getElementById('salesFile');
    const fileInfo = document.getElementById('fileInfo');
    
    if (fileInput) {
        fileInput.value = '';
    }
    if (fileInfo) {
        fileInfo.style.display = 'none';
    }
}

// Initialize Sales page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('sales.html')) {
        console.log('📊 Initializing Sales Analysis page');
        
        // Initialize file upload
        initSalesFileUpload();
        
        // Load example data
        loadSalesExample();
        
        // Apply mobile fixes
        applyMobileFixes();
        
        // Setup method tab click events
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const method = this.textContent.includes('CSV') ? 'text' : 'file';
                switchInputMethod(method);
            });
        });
        
        // Add clear button functionality jika diperlukan
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-outline btn-sm mt-2';
        clearBtn.innerHTML = '<i class="fas fa-times me-1"></i>Hapus File';
        clearBtn.onclick = clearFileUpload;
        
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            const fileInfoHeader = fileInfo.querySelector('.file-info-header');
            if (fileInfoHeader) {
                fileInfoHeader.appendChild(clearBtn);
            }
        }
    }
});