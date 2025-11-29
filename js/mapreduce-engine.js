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

    // Enhanced version with error handling and progress tracking
    static async mapReduceAsync(data, mapper, reducer, progressCallback = null) {
        return new Promise((resolve, reject) => {
            try {
                let mapped = [];
                const totalItems = data.length;

                // Map Phase with progress
                data.forEach((line, index) => {
                    try {
                        const results = mapper(line, index + 1);
                        if (Array.isArray(results[0])) {
                            results.forEach(item => mapped.push(item));
                        } else {
                            mapped.push(results);
                        }

                        // Report progress
                        if (progressCallback) {
                            const progress = Math.round(((index + 1) / totalItems) * 50); // Map phase is 50% of total
                            progressCallback('map', progress, index + 1, totalItems);
                        }
                    } catch (error) {
                        console.warn(`Error in mapper at index ${index}:`, error);
                        // Continue processing other items
                    }
                });

                // Shuffle Phase
                let shuffled = {};
                mapped.forEach(([key, value], index) => {
                    if (!shuffled[key]) shuffled[key] = [];
                    shuffled[key].push(value);

                    // Report progress
                    if (progressCallback && index % Math.ceil(mapped.length / 25) === 0) {
                        const progress = 50 + Math.round((index / mapped.length) * 25); // Shuffle phase is 25% of total
                        progressCallback('shuffle', progress, index, mapped.length);
                    }
                });

                // Reduce Phase
                let results = [];
                const keys = Object.keys(shuffled);
                keys.forEach((key, index) => {
                    try {
                        const result = reducer(key, shuffled[key]);
                        results.push([key, result]);

                        // Report progress
                        if (progressCallback) {
                            const progress = 75 + Math.round(((index + 1) / keys.length) * 25); // Reduce phase is 25% of total
                            progressCallback('reduce', progress, index + 1, keys.length);
                        }
                    } catch (error) {
                        console.warn(`Error in reducer for key "${key}":`, error);
                        // Continue processing other keys
                    }
                });

                resolve({
                    mapped: mapped,
                    shuffled: shuffled,
                    results: results,
                    stats: {
                        totalInput: totalItems,
                        mappedItems: mapped.length,
                        uniqueKeys: keys.length,
                        resultCount: results.length
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    // Batch processing for large datasets
    static mapReduceBatch(data, mapper, reducer, batchSize = 1000) {
        const batches = [];
        
        // Split data into batches
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }

        console.log(`Processing ${data.length} items in ${batches.length} batches`);

        // Process each batch
        const batchResults = batches.map((batch, batchIndex) => {
            console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
            return this.mapReduce(batch, mapper, reducer);
        });

        // Combine results from all batches
        return this.combineBatchResults(batchResults);
    }

    // Combine results from multiple batches
    static combineBatchResults(batchResults) {
        const combinedMapped = [];
        const combinedShuffled = {};
        const combinedResults = [];

        // Combine mapped results
        batchResults.forEach(batch => {
            combinedMapped.push(...batch.mapped);
        });

        // Combine shuffled results
        batchResults.forEach(batch => {
            Object.entries(batch.shuffled).forEach(([key, values]) => {
                if (!combinedShuffled[key]) combinedShuffled[key] = [];
                combinedShuffled[key].push(...values);
            });
        });

        // Reduce combined shuffled data
        Object.entries(combinedShuffled).forEach(([key, values]) => {
            // For demonstration, using simple sum reducer
            // In real implementation, this should use the provided reducer
            const result = values.reduce((sum, val) => {
                if (typeof val === 'number') return sum + val;
                return sum;
            }, 0);
            combinedResults.push([key, result]);
        });

        return {
            mapped: combinedMapped,
            shuffled: combinedShuffled,
            results: combinedResults,
            batchCount: batchResults.length
        };
    }

    // Utility method for word count
    static wordCount(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);

        return this.mapReduce(words, 
            (word) => [word, 1],
            (key, values) => values.reduce((sum, val) => sum + val, 0)
        );
    }

    // Utility method for average calculation
    static average(numbers) {
        const result = this.mapReduce(numbers,
            (number) => ['average', { value: parseFloat(number), count: 1 }],
            (key, values) => {
                const combined = values.reduce((acc, curr) => ({
                    value: acc.value + curr.value,
                    count: acc.count + curr.count
                }), { value: 0, count: 0 });
                
                return combined.count > 0 ? combined.value / combined.count : 0;
            }
        );
        
        return result.results[0][1];
    }

    // Utility method for sales analysis
    static salesAnalysis(salesData) {
        // Parse CSV-like data
        const parsedData = salesData.map(line => {
            if (typeof line === 'string') {
                const [product, quantity, price, region, date] = line.split(',');
                return {
                    product: product?.trim(),
                    quantity: parseInt(quantity) || 0,
                    price: parseFloat(price) || 0,
                    region: region?.trim(),
                    date: date?.trim(),
                    total: (parseInt(quantity) || 0) * (parseFloat(price) || 0)
                };
            }
            return line;
        }).filter(sale => sale.product && sale.region);

        // Sales by product
        const productSales = this.mapReduce(parsedData,
            (sale) => [sale.product, sale.total],
            (key, values) => values.reduce((sum, val) => sum + val, 0)
        );

        // Sales by region
        const regionSales = this.mapReduce(parsedData,
            (sale) => [sale.region, sale.total],
            (key, values) => values.reduce((sum, val) => sum + val, 0)
        );

        // Quantity by product
        const productQuantity = this.mapReduce(parsedData,
            (sale) => [sale.product, sale.quantity],
            (key, values) => values.reduce((sum, val) => sum + val, 0)
        );

        return {
            productSales: productSales.results,
            regionSales: regionSales.results,
            productQuantity: productQuantity.results,
            totalSales: parsedData.reduce((sum, sale) => sum + sale.total, 0),
            totalTransactions: parsedData.length
        };
    }
}

// Common Utility Functions
const MapReduceUtils = {
    // Data formatting
    formatCurrency: function(amount) {
        return 'Rp ' + (amount || 0).toLocaleString('id-ID');
    },

    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    formatNumber: function(num) {
        return (num || 0).toLocaleString('id-ID');
    },

    // Loading states
    showLoading: function(button) {
        if (!button) return '';
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        button.disabled = true;
        return originalText;
    },

    hideLoading: function(button, originalText) {
        if (!button) return;
        button.innerHTML = originalText;
        button.disabled = false;
    },

    // UI Controls
    showSection: function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'block';
        }
    },

    hideSection: function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'none';
        }
    },

    toggleSection: function(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    },

    // Process steps display
    displayProcessSteps: function(steps, mapId, shuffleId, reduceId) {
        // Map Phase
        const mapResults = document.getElementById(mapId);
        if (mapResults) {
            mapResults.innerHTML = steps.mapped.slice(0, 50).map(item =>
                `<div class="mb-1"><code>("${this.escapeHtml(item[0])}", ${item[1]})</code></div>`
            ).join('');

            if (steps.mapped.length > 50) {
                mapResults.innerHTML += `<div class="text-muted">... dan ${steps.mapped.length - 50} data lainnya</div>`;
            }
        }

        // Shuffle Phase
        const shuffleResults = document.getElementById(shuffleId);
        if (shuffleResults) {
            shuffleResults.innerHTML = Object.entries(steps.shuffled).slice(0, 20).map(([key, values]) =>
                `<div class="mb-1"><strong>"${this.escapeHtml(key)}":</strong> [${values.join(', ')}]</div>`
            ).join('');

            if (Object.keys(steps.shuffled).length > 20) {
                shuffleResults.innerHTML += `<div class="text-muted">... dan ${Object.keys(steps.shuffled).length - 20} key lainnya</div>`;
            }
        }

        // Reduce Phase
        const reduceResults = document.getElementById(reduceId);
        if (reduceResults) {
            reduceResults.innerHTML = steps.results.slice(0, 50).map(item =>
                `<div class="mb-1"><code>"${this.escapeHtml(item[0])}" → ${item[1]}</code></div>`
            ).join('');

            if (steps.results.length > 50) {
                reduceResults.innerHTML += `<div class="text-muted">... dan ${steps.results.length - 50} hasil lainnya</div>`;
            }
        }
    },

    // Enhanced toggle phase function
    togglePhase: function(phaseId) {
        const phaseContent = document.getElementById(phaseId);
        const phaseHeader = phaseContent?.previousElementSibling;

        if (phaseContent && phaseHeader) {
            const isShowing = phaseContent.classList.contains('show');

            if (isShowing) {
                phaseContent.classList.remove('show');
                phaseHeader.classList.remove('active');
            } else {
                phaseContent.classList.add('show');
                phaseHeader.classList.add('active');
            }

            // Update indicator
            const indicator = phaseHeader.querySelector('.phase-indicator i');
            if (indicator) {
                if (phaseContent.classList.contains('show')) {
                    indicator.classList.remove('fa-chevron-down');
                    indicator.classList.add('fa-chevron-up');
                } else {
                    indicator.classList.remove('fa-chevron-up');
                    indicator.classList.add('fa-chevron-down');
                }
            }
        }
    },

    // Expand all phases
    expandAllPhases: function() {
        document.querySelectorAll('.phase-content').forEach(content => {
            content.classList.add('show');
            const header = content.previousElementSibling;
            if (header) header.classList.add('active');
            
            const indicator = header.querySelector('.phase-indicator i');
            if (indicator) {
                indicator.classList.remove('fa-chevron-down');
                indicator.classList.add('fa-chevron-up');
            }
        });
    },

    // Collapse all phases
    collapseAllPhases: function() {
        document.querySelectorAll('.phase-content').forEach(content => {
            content.classList.remove('show');
            const header = content.previousElementSibling;
            if (header) header.classList.remove('active');
            
            const indicator = header.querySelector('.phase-indicator i');
            if (indicator) {
                indicator.classList.remove('fa-chevron-up');
                indicator.classList.add('fa-chevron-down');
            }
        });
    },

    // Data validation
    isValidCSVFile: function(file) {
        return file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'));
    },

    isValidTextFile: function(file) {
        return file && (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt'));
    },

    isValidJSONFile: function(file) {
        return file && (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json'));
    },

    isValidDate: function(dateString) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },

    // File handling
    readFileAsText: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    },

    parseCSV: function(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length === 0) return { headers: [], data: [] };
        
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(value => value.trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        return { headers, data };
    },

    // Mobile detection and fixes
    isMobileDevice: function() {
        return (typeof window.orientation !== "undefined") || 
               (navigator.userAgent.indexOf('IEMobile') !== -1) ||
               /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    applyMobileFixes: function() {
        if (this.isMobileDevice()) {
            console.log('📱 Applying mobile-specific fixes...');
            
            // Improve button sizes for touch
            document.querySelectorAll('.btn-process, .file-upload-btn, .add-btn, .btn').forEach(btn => {
                btn.style.minHeight = '44px';
                btn.style.padding = '12px 20px';
            });
            
            // Improve input sizes
            document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(input => {
                input.style.fontSize = '16px'; // Prevent zoom on iOS
                input.style.minHeight = '44px';
            });

            // Adjust table responsiveness
            document.querySelectorAll('.table-responsive').forEach(table => {
                table.style.fontSize = '0.8rem';
            });
        }
    },

    // Progress tracking
    createProgressBar: function(containerId, phases = ['Map', 'Shuffle', 'Reduce']) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const progressBar = document.createElement('div');
        progressBar.className = 'progress mb-3';
        progressBar.style.height = '20px';
        progressBar.innerHTML = `
            <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                <span class="progress-text">0%</span>
            </div>
        `;

        const phaseTracker = document.createElement('div');
        phaseTracker.className = 'phase-tracker';
        phaseTracker.innerHTML = phases.map(phase => 
            `<span class="phase-label">${phase}</span>`
        ).join('');

        container.appendChild(progressBar);
        container.appendChild(phaseTracker);

        return {
            update: function(phase, progress, current, total) {
                const progressBarElement = progressBar.querySelector('.progress-bar');
                const progressText = progressBar.querySelector('.progress-text');
                
                progressBarElement.style.width = progress + '%';
                progressBarElement.setAttribute('aria-valuenow', progress);
                progressText.textContent = `${progress}%`;
                
                // Update phase labels
                const phaseLabels = phaseTracker.querySelectorAll('.phase-label');
                const phaseIndex = phases.findIndex(p => p.toLowerCase() === phase.toLowerCase());
                
                phaseLabels.forEach((label, index) => {
                    if (index === phaseIndex) {
                        label.classList.add('active');
                        label.innerHTML = `${phases[index]} (${current}/${total})`;
                    } else if (index < phaseIndex) {
                        label.classList.add('completed');
                    } else {
                        label.classList.remove('active', 'completed');
                    }
                });
            },
            complete: function() {
                const progressBarElement = progressBar.querySelector('.progress-bar');
                const progressText = progressBar.querySelector('.progress-text');
                
                progressBarElement.style.width = '100%';
                progressBarElement.setAttribute('aria-valuenow', 100);
                progressText.textContent = '100% - Selesai!';
                progressBarElement.classList.add('bg-success');
            }
        };
    },

    // Error handling
    showError: function(message, containerId = null) {
        console.error('MapReduce Error:', message);
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Error:</strong> ${message}
                    </div>
                `;
            }
        } else {
            alert('Error: ' + message);
        }
    },

    showSuccess: function(message, containerId = null) {
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        ${message}
                    </div>
                `;
            }
        }
    },

    // Data export
    exportToCSV: function(data, filename = 'mapreduce-results.csv') {
        if (!data || data.length === 0) return;
        
        let csvContent = '';
        
        if (Array.isArray(data[0])) {
            // Array of arrays
            data.forEach(row => {
                csvContent += row.map(field => `"${field}"`).join(',') + '\n';
            });
        } else if (typeof data[0] === 'object') {
            // Array of objects
            const headers = Object.keys(data[0]);
            csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
            
            data.forEach(row => {
                const values = headers.map(header => `"${row[header]}"`);
                csvContent += values.join(',') + '\n';
            });
        }
        
        this.downloadFile(csvContent, filename, 'text/csv');
    },

    exportToJSON: function(data, filename = 'mapreduce-results.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    },

    downloadFile: function(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    // Utility functions
    escapeHtml: function(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Global functions for backward compatibility
function formatCurrency(amount) {
    return MapReduceUtils.formatCurrency(amount);
}

function formatFileSize(bytes) {
    return MapReduceUtils.formatFileSize(bytes);
}

function showLoading(button) {
    return MapReduceUtils.showLoading(button);
}

function hideLoading(button, originalText) {
    MapReduceUtils.hideLoading(button, originalText);
}

function showSection(sectionId) {
    MapReduceUtils.showSection(sectionId);
}

function hideSection(sectionId) {
    MapReduceUtils.hideSection(sectionId);
}

function displayProcessSteps(steps, mapId, shuffleId, reduceId) {
    MapReduceUtils.displayProcessSteps(steps, mapId, shuffleId, reduceId);
}

function togglePhase(phaseId) {
    MapReduceUtils.togglePhase(phaseId);
}

function isMobileDevice() {
    return MapReduceUtils.isMobileDevice();
}

function applyMobileFixes() {
    MapReduceUtils.applyMobileFixes();
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    MapReduceUtils.applyMobileFixes();
    
    // Add global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        MapReduceUtils.showError('Terjadi kesalahan dalam aplikasi: ' + e.error.message);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MapReduceEngine, MapReduceUtils };
}