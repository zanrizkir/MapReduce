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
    document.getElementById(sectionId).style.display = 'block';
}

function hideSection(sectionId) {
    document.getElementById(sectionId).style.display = 'none';
}

function displayProcessSteps(steps, mapId, shuffleId, reduceId) {
    // Map Phase
    const mapResults = document.getElementById(mapId);
    mapResults.innerHTML = steps.mapped.slice(0, 50).map(item => 
        `<div class="mb-1"><code>("${item[0]}", ${item[1]})</code></div>`
    ).join('');
    
    if (steps.mapped.length > 50) {
        mapResults.innerHTML += `<div class="text-muted">... dan ${steps.mapped.length - 50} data lainnya</div>`;
    }
    
    // Shuffle Phase
    const shuffleResults = document.getElementById(shuffleId);
    shuffleResults.innerHTML = Object.entries(steps.shuffled).map(([key, values]) => 
        `<div class="mb-1"><strong>"${key}":</strong> [${values.join(', ')}]</div>`
    ).join('');
    
    // Reduce Phase
    const reduceResults = document.getElementById(reduceId);
    reduceResults.innerHTML = steps.results.map(item => 
        `<div class="mb-1"><code>"${item[0]}" → ${item[1]}</code></div>`
    ).join('');
}