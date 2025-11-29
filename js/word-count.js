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
    }
}

function processWordCount() {
    const textInput = document.getElementById('textInput');
    if (!textInput) return;

    const text = textInput.value.trim();
    
    if (text.length === 0) {
        alert('Masukkan teks terlebih dahulu atau upload file!');
        return;
    }

    processWordCountWithMapReduce(text);
}

function processWordCountWithMapReduce(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Tidak ada teks yang dapat diproses!');
        return;
    }

    const processBtn = document.getElementById('processBtn');
    const originalText = showLoading(processBtn);

    setTimeout(() => {
        try {
            function wordMapper(line, lineNum) {
                const words = line.toLowerCase()
                    .replace(/[^\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.length > 0);
                return words.map(word => [word, 1]);
            }

            function wordReducer(key, values) {
                return values.reduce((sum, val) => sum + val, 0);
            }

            const result = MapReduceEngine.mapReduce(lines, wordMapper, wordReducer);
            
            // Calculate statistics
            const totalWords = result.results.reduce((sum, [_, count]) => sum + count, 0);
            const uniqueWords = result.results.length;
            const avgWordLength = totalWords > 0 ? 
                result.results.reduce((sum, [word, count]) => sum + (word.length * count), 0) / totalWords : 0;
            
            console.log('📊 Word Count statistics:', {
                totalWords,
                uniqueWords,
                avgWordLength: avgWordLength.toFixed(2)
            });
            
            displayWordCountResults(result, totalWords, uniqueWords, avgWordLength);
            displayProcessSteps(result, 'mapResults', 'shuffleResults', 'reduceResults');
            createWordCountChart(result.results);
            
            showSection('resultsSection');
            showSection('processSteps');
            hideSection('initialState');
            hideLoading(processBtn, originalText);
            
        } catch (error) {
            console.error('❌ Word Count processing error:', error);
            alert('Error memproses teks: ' + error.message);
            hideLoading(processBtn, originalText);
        }
    }, 1000);
}

function displayWordCountResults(result, totalWords, uniqueWords, avgWordLength) {
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
            <div class="stat-item">
                <div class="stat-value">${avgWordLength.toFixed(1)}</div>
                <div class="stat-label">Rata-rata Huruf</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${result.mapped.length}</div>
                <div class="stat-label">Map Operations</div>
            </div>
        `;
    }
    
    const tbody = document.querySelector('#resultsTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        
        // Sort by frequency descending and take top 20
        const topWords = result.results
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
        
        topWords.forEach(([word, count], index) => {
            const percentage = ((count / totalWords) * 100).toFixed(1);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="word-text">${word}</span>
                </td>
                <td>
                    <span class="count-badge">${count}</span>
                    <small style="color: #6c757d; margin-left: 8px;">${percentage}%</small>
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
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// ==================== WORD COUNT FILE UPLOAD FUNCTIONS ====================
function initWordCountFileUpload() {
    console.log('📝 Initializing Word Count file upload...');
    
    const fileInput = document.getElementById('fileInputWordCount');
    const uploadArea = document.getElementById('uploadAreaWordCount');
    const fileInfo = document.getElementById('fileInfoWordCount');
    const fileName = document.getElementById('fileNameWordCount');
    const fileSize = document.getElementById('fileSizeWordCount');
    const fileContent = document.getElementById('fileContentWordCount');
    const textInput = document.getElementById('textInput');

    if (!fileInput || !uploadArea) {
        console.error('❌ Word Count upload elements not found');
        return;
    }

    // Click on upload area
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // File input change event
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleWordCountFileSelection(e.target.files[0]);
        }
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleWordCountFileSelection(e.dataTransfer.files[0]);
        }
    });

    function handleWordCountFileSelection(file) {
        // Basic file validation
        if (!file.type.includes('text/') && !file.name.toLowerCase().endsWith('.txt')) {
            alert('Silakan pilih file teks (.txt)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File terlalu besar! Maksimal 5MB.');
            return;
        }

        // Show file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'block';

        // Read and process file
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            
            // Show preview
            const preview = content.length > 300 ? content.substring(0, 300) + '...' : content;
            fileContent.textContent = preview;
            
            // Fill textarea with content
            if (textInput) {
                textInput.value = content;
            }
        };
        
        reader.onerror = function() {
            alert('Gagal membaca file');
        };
        
        reader.readAsText(file);
    }
}

function clearUploadedFileWordCount() {
    const fileInput = document.getElementById('fileInputWordCount');
    const fileInfo = document.getElementById('fileInfoWordCount');
    const textInput = document.getElementById('textInput');
    
    fileInput.value = '';
    if (fileInfo) {
        fileInfo.style.display = 'none';
    }
    if (textInput) {
        textInput.value = '';
    }
}

// Initialize Word Count page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('word-count.html')) {
        console.log('📝 Initializing Word Count page');
        
        // Initialize file upload
        initWordCountFileUpload();
        
        // Load example
        loadWordCountExample();
        
        // Apply mobile fixes
        applyMobileFixes();
    }
});