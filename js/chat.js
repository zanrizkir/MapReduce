// ==================== CHAT ANALYSIS FUNCTIONS ====================
let currentFormat = 'csv'; // Default format

function loadChatExample() {
    const chatData = document.getElementById('chatData');
    if (chatData) {
        if (currentFormat === 'csv') {
            chatData.value = `timestamp,user,message
2024-01-15 10:30:00,Alice,Halo semuanya, apa kabar?
2024-01-15 10:31:00,Bob,Hai Alice, kabar baik! Bagaimana denganmu?
2024-01-15 10:32:00,Charlie,Saya juga baik, terima kasih
2024-01-15 10:33:00,Alice,Ada yang sudah coba fitur baru?
2024-01-15 10:34:00,Bob,Saya sudah coba, sangat menarik
2024-01-15 10:35:00,Alice,Bagus sekali, saya juga suka
2024-01-15 10:36:00,Charlie,Saya belum coba, nanti saya coba
2024-01-15 10:37:00,Bob,Recomended banget fiturnya
2024-01-15 10:38:00,Alice,Sama, saya setuju dengan Bob`;
        } else if (currentFormat === 'whatsapp') {
            chatData.value = `[15/01/24 10:30:00] Alice: Halo semuanya, apa kabar?
[15/01/24 10:31:00] Bob: Hai Alice, kabar baik! Bagaimana denganmu?
[15/01/24 10:32:00] Charlie: Saya juga baik, terima kasih
[15/01/24 10:33:00] Alice: Ada yang sudah coba fitur baru?
[15/01/24 10:34:00] Bob: Saya sudah coba, sangat menarik
[15/01/24 10:35:00] Alice: Bagus sekali, saya juga suka
[15/01/24 10:36:00] Charlie: Saya belum coba, nanti saya coba
[15/01/24 10:37:00] Bob: Recomended banget fiturnya
[15/01/24 10:38:00] Alice: Sama, saya setuju dengan Bob`;
        }
        updateFormatGuide();
    }
}

function updateFormatGuide() {
    const guideTitle = document.querySelector('.guide-title');
    const formatExamples = document.querySelector('.format-examples');
    const textarea = document.getElementById('chatData');
    
    if (!guideTitle || !formatExamples) return;
    
    if (currentFormat === 'csv') {
        guideTitle.innerHTML = '<i class="fas fa-info-circle me-2"></i>Panduan Format CSV';
        formatExamples.innerHTML = `
            <div class="format-example">timestamp,user,message</div>
            <div class="format-example">2024-01-15 10:30:00,Alice,Halo semuanya, apa kabar?</div>
            <div class="format-example">2024-01-15 10:31:00,Bob,Hai Alice, kabar baik!</div>
        `;
        textarea.placeholder = "timestamp,user,message\n2024-01-15 10:30:00,Alice,Pesan dari Alice\n2024-01-15 10:31:00,Bob,Pesan dari Bob";
    } else if (currentFormat === 'whatsapp') {
        guideTitle.innerHTML = '<i class="fas fa-info-circle me-2"></i>Panduan Format WhatsApp';
        formatExamples.innerHTML = `
            <div class="format-example">[DD/MM/YY HH:MM:SS] Pengguna: Pesan</div>
            <div class="format-example">[15/01/24 10:30:00] Alice: Halo semuanya!</div>
            <div class="format-example">[15/01/24 10:31:00] Bob: Hai Alice!</div>
        `;
        textarea.placeholder = "[DD/MM/YY HH:MM:SS] Pengguna: Pesan\n[15/01/24 10:30:00] Alice: Halo semuanya!\n[15/01/24 10:31:00] Bob: Hai Alice!";
    }
}

function changeFormat(format) {
    currentFormat = format;
    
    // Update active tab
    document.querySelectorAll('.format-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.format-tab[data-format="${format}"]`).classList.add('active');
    
    // Update format guide and examples
    updateFormatGuide();
    loadChatExample();
}

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
            let messages = [];
            
            if (currentFormat === 'csv') {
                messages = parseCSVFormat(lines);
            } else if (currentFormat === 'whatsapp') {
                messages = parseWhatsAppFormat(lines);
            }

            if (messages.length === 0) {
                throw new Error('Format data tidak valid');
            }

            // Process chat analysis
            processChatStatistics(messages);
            processParticipantAnalysis(messages);
            processWordFrequency(messages);
            processActivityTimeline(messages);
            createSentimentChart();

            hideLoading(processBtn, originalText);
            showSection('chatResults');
            hideSection('chatEmptyState');

        } catch (error) {
            alert('Error memproses data: ' + error.message);
            hideLoading(processBtn, originalText);
        }
    }, 1000);
}

function parseCSVFormat(lines) {
    return lines.map((line, index) => {
        // Skip header row
        if (index === 0 && line.toLowerCase().includes('timestamp,user,message')) {
            return null;
        }
        
        const parts = line.split(',');
        if (parts.length < 3) return null;
        
        const timestamp = parts[0]?.trim();
        const user = parts[1]?.trim();
        const message = parts.slice(2).join(',').trim();
        
        if (!timestamp || !user || !message) return null;
        
        return {
            timestamp: timestamp,
            user: user,
            message: message,
            words: message.split(/\s+/).length,
            hour: getHourFromTimestamp(timestamp)
        };
    }).filter(msg => msg !== null);
}

function parseWhatsAppFormat(lines) {
    const whatsappRegex = /\[(\d{1,2}\/\d{1,2}\/\d{2,4} \d{1,2}:\d{2}:\d{2})\] (.+?): (.+)/;
    
    return lines.map(line => {
        const match = line.match(whatsappRegex);
        if (!match) return null;
        
        const [, timestamp, user, message] = match;
        
        // Convert WhatsApp timestamp to standard format
        const standardTimestamp = convertWhatsAppTimestamp(timestamp);
        
        return {
            timestamp: standardTimestamp,
            user: user.trim(),
            message: message.trim(),
            words: message.trim().split(/\s+/).length,
            hour: getHourFromTimestamp(standardTimestamp)
        };
    }).filter(msg => msg !== null);
}

function convertWhatsAppTimestamp(whatsappTimestamp) {
    // Convert [DD/MM/YY HH:MM:SS] to YYYY-MM-DD HH:MM:SS
    const parts = whatsappTimestamp.split(' ');
    const dateParts = parts[0].split('/');
    const timePart = parts[1];
    
    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    let year = dateParts[2];
    
    // Handle 2-digit year
    if (year.length === 2) {
        year = '20' + year;
    }
    
    return `${year}-${month}-${day} ${timePart}`;
}

function getHourFromTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        return isNaN(date.getHours()) ? 0 : date.getHours();
    } catch (error) {
        return 0;
    }
}

// File Upload Functions
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileContent = document.getElementById('fileContent');

    if (!fileInput || !uploadArea) return;

    // Click event
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    // File input change event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    function handleFileUpload(file) {
        if (!isValidFileType(file)) {
            alert('Format file tidak didukung. Gunakan file TXT atau CSV.');
            return;
        }

        // Show file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'block';

        // Read file content
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            fileContent.textContent = content.substring(0, 500) + (content.length > 500 ? '...' : '');
            
            // Auto-fill textarea with file content
            document.getElementById('chatData').value = content;
        };
        reader.readAsText(file);
    }
}

function isValidFileType(file) {
    const allowedTypes = ['text/plain', 'text/csv', 'application/csv'];
    const allowedExtensions = ['.txt', '.csv'];
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function clearUploadedFile() {
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const chatData = document.getElementById('chatData');
    
    if (fileInput) fileInput.value = '';
    if (fileInfo) fileInfo.style.display = 'none';
    if (chatData) chatData.value = '';
}

// Existing functions remain the same...
function processChatStatistics(messages) {
    const totalMessages = messages.length;
    const uniqueUsers = [...new Set(messages.map(msg => msg.user))].length;
    const totalWords = messages.reduce((sum, msg) => sum + msg.words, 0);
    const avgWordsPerMessage = totalMessages > 0 ? totalWords / totalMessages : 0;

    displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage);
}

function displayChatStatistics(totalMessages, uniqueUsers, totalWords, avgWordsPerMessage) {
    const statsElement = document.getElementById('chatStatistics');
    if (statsElement) {
        statsElement.innerHTML = `
            <div class="stat-card messages">
                <div class="chat-stat-value">${totalMessages}</div>
                <div class="chat-stat-label">Total Pesan</div>
            </div>
            <div class="stat-card participants">
                <div class="chat-stat-value">${uniqueUsers}</div>
                <div class="chat-stat-label">Partisipan</div>
            </div>
            <div class="stat-card words">
                <div class="chat-stat-value">${totalWords}</div>
                <div class="chat-stat-label">Total Kata</div>
            </div>
            <div class="stat-card media">
                <div class="chat-stat-value">${avgWordsPerMessage.toFixed(1)}</div>
                <div class="chat-stat-label">Kata/Pesan</div>
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
                const avgWords = messageCount > 0 ? wordCount / messageCount : 0;

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

    const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

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

// Utility functions
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
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
}

function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

function applyMobileFixes() {
    // Mobile optimizations if needed
    if (window.innerWidth < 768) {
        console.log('📱 Applying mobile optimizations for chat page');
    }
}

// Initialize Chat page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('chat.html')) {
        console.log('💬 Initializing Chat Analysis page');
        
        // Initialize file upload
        initializeFileUpload();
        
        // Add event listeners for format tabs
        document.querySelectorAll('.format-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const format = this.getAttribute('data-format');
                changeFormat(format);
            });
        });
        
        loadChatExample();
        applyMobileFixes();
    }
});