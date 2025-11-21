// Configuración
const CONFIG = {
    baseURL: 'https://jsonplaceholder.typicode.com',
    endpoints: {
        posts: '/posts',
        users: '/users',
        comments: '/comments'
    }
};

// Estado de la aplicación
const appState = {
    requests: []
};

// Elementos del DOM
const elements = {
    btnGet: document.getElementById('btnGet'),
    btnPost: document.getElementById('btnPost'),
    btnPut: document.getElementById('btnPut'),
    btnDelete: document.getElementById('btnDelete'),
    btnExport: document.getElementById('btnExport'),
    resultado: document.getElementById('resultado'),
    requestInfo: document.getElementById('requestInfo'),
    tableBody: document.getElementById('tableBody'),
    loading: document.getElementById('loading')
};

// Utilidades
const utils = {
    showLoading() {
        elements.loading.classList.remove('hidden');
        elements.resultado.innerHTML = '';
    },

    hideLoading() {
        elements.loading.classList.add('hidden');
    },

    formatJSON(data) {
        return JSON.stringify(data, null, 2);
    },

    getCurrentTimestamp() {
        return new Date().toLocaleString('es-ES');
    },

    getCORSStatus(headers) {
        const corsHeader = headers.get('access-control-allow-origin');
        return corsHeader ? `Permitido (${corsHeader})` : 'No especificado';
    }
};

// Funciones de peticiones HTTP
async function makeRequest(method, endpoint, body = null) {
    const url = `${CONFIG.baseURL}${endpoint}`;
    const startTime = performance.now();

    console.group(`🌐 Petición ${method}`);
    console.log('URL:', url);
    console.log('Método:', method);
    console.log('Timestamp:', utils.getCurrentTimestamp());

    utils.showLoading();

    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
            console.log('Body:', body);
        }

        const response = await fetch(url, options);
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        console.log('Código de estado:', response.status);
        console.log('Tiempo de respuesta:', `${responseTime}ms`);
        console.log('Headers de respuesta:', [...response.headers.entries()]);

        const data = await response.json();
        console.log('Datos recibidos:', data);
        console.groupEnd();

        const requestData = {
            method,
            url,
            statusCode: response.status,
            responseTime,
            cors: utils.getCORSStatus(response.headers),
            timestamp: utils.getCurrentTimestamp(),
            data,
            headers: {
                request: options.headers,
                response: Object.fromEntries([...response.headers.entries()])
            }
        };

        displayResults(requestData);
        addToTable(requestData);
        saveRequest(requestData);

        return { success: true, data };

    } catch (error) {
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);

        console.error('❌ Error:', error);
        console.groupEnd();

        const errorData = {
            method,
            url,
            statusCode: 'ERROR',
            responseTime,
            cors: 'N/A',
            timestamp: utils.getCurrentTimestamp(),
            error: error.message
        };

        displayError(errorData);
        addToTable(errorData);

        return { success: false, error };
    } finally {
        utils.hideLoading();
    }
}

// Funciones de visualización
function displayResults(requestData) {
    const { method, url, statusCode, responseTime, data } = requestData;

    elements.resultado.innerHTML = `
        <div class="result-header">
            <h3>✅ Petición ${method} exitosa</h3>
            <p><strong>Status:</strong> <span class="status-${statusCode}">${statusCode}</span></p>
        </div>
        <pre>${utils.formatJSON(data)}</pre>
    `;

    displayRequestInfo(requestData);
}

function displayError(errorData) {
    const { method, error } = errorData;

    elements.resultado.innerHTML = `
        <div class="result-header">
            <h3>❌ Error en petición ${method}</h3>
            <p><strong>Error:</strong> ${error}</p>
        </div>
    `;

    displayRequestInfo(errorData);
}

function displayRequestInfo(requestData) {
    const { method, url, statusCode, responseTime, cors, timestamp, headers } = requestData;

    let observaciones = '';
    if (statusCode === 200) observaciones = 'Petición exitosa';
    else if (statusCode === 201) observaciones = 'Recurso creado exitosamente';
    else if (statusCode === 404) observaciones = 'Recurso no encontrado';
    else if (statusCode === 'ERROR') observaciones = 'Error de conexión';

    elements.requestInfo.innerHTML = `
        <div class="info-item">
            <span class="info-label">Método:</span>
            <span class="info-value">${method}</span>
        </div>
        <div class="info-item">
            <span class="info-label">URL:</span>
            <span class="info-value">${url}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Código de Estado:</span>
            <span class="info-value status-${statusCode}">${statusCode}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Tiempo de Respuesta:</span>
            <span class="info-value">${responseTime} ms</span>
        </div>
        <div class="info-item">
            <span class="info-label">CORS:</span>
            <span class="info-value">${cors}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Timestamp:</span>
            <span class="info-value">${timestamp}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Observaciones:</span>
            <span class="info-value">${observaciones}</span>
        </div>
    `;
}

function addToTable(requestData) {
    const { method, url, statusCode, responseTime, cors } = requestData;

    let observaciones = '';
    if (statusCode === 200) observaciones = 'Petición exitosa';
    else if (statusCode === 201) observaciones = 'Recurso creado';
    else if (statusCode === 404) observaciones = 'No encontrado';
    else if (statusCode === 'ERROR') observaciones = 'Error de red';

    // Remover mensaje de tabla vacía si existe
    const emptyRow = elements.tableBody.querySelector('.empty-state');
    if (emptyRow) {
        emptyRow.parentElement.remove();
    }

    const row = document.createElement('tr');
    row.innerHTML = `
        <td><strong>${method}</strong></td>
        <td>${url}</td>
        <td class="status-${statusCode}">${statusCode}</td>
        <td>${responseTime} ms</td>
        <td>${cors}</td>
        <td>${observaciones}</td>
    `;

    elements.tableBody.insertBefore(row, elements.tableBody.firstChild);
}

function saveRequest(requestData) {
    appState.requests.unshift(requestData);
}

// Handlers de eventos
function handleGetRequest() {
    makeRequest('GET', `${CONFIG.endpoints.posts}/1`);
}

function handlePostRequest() {
    const newPost = {
        title: 'Nuevo Post desde mi aplicación',
        body: 'Este es un post de prueba creado con el método POST',
        userId: 1
    };
    makeRequest('POST', CONFIG.endpoints.posts, newPost);
}

function handlePutRequest() {
    const updatedPost = {
        id: 1,
        title: 'Post Actualizado',
        body: 'Contenido actualizado con PUT',
        userId: 1
    };
    makeRequest('PUT', `${CONFIG.endpoints.posts}/1`, updatedPost);
}

function handleDeleteRequest() {
    makeRequest('DELETE', `${CONFIG.endpoints.posts}/1`);
}

function exportToMarkdown() {
    if (appState.requests.length === 0) {
        alert('No hay peticiones registradas para exportar');
        return;
    }

    let markdown = '# Documentación de Peticiones HTTP\n\n';
    markdown += '## Tabla de Resultados\n\n';
    markdown += '| Método | URL | Código de Estado | Tiempo Respuesta | Observaciones | CORS |\n';
    markdown += '|--------|-----|------------------|------------------|---------------|------|\n';

    appState.requests.reverse().forEach(req => {
        let obs = '';
        if (req.statusCode === 200) obs = 'Petición exitosa';
        else if (req.statusCode === 201) obs = 'Recurso creado';
        else if (req.statusCode === 404) obs = 'No encontrado';
        else if (req.statusCode === 'ERROR') obs = 'Error de red';

        markdown += `| ${req.method} | ${req.url} | ${req.statusCode} | ${req.responseTime} ms | ${obs} | ${req.cors} |\n`;
    });

    markdown += '\n## Detalles de Implementación\n\n';
    markdown += '- **API utilizada:** JSONPlaceholder (https://jsonplaceholder.typicode.com)\n';
    markdown += '- **Métodos implementados:** GET, POST, PUT, DELETE\n';
    markdown += '- **Herramientas:** Fetch API, JavaScript ES6+\n';

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'documentacion-peticiones-http.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📄 Markdown exportado exitosamente');
}

// Event Listeners
elements.btnGet.addEventListener('click', handleGetRequest);
elements.btnPost.addEventListener('click', handlePostRequest);
elements.btnPut.addEventListener('click', handlePutRequest);
elements.btnDelete.addEventListener('click', handleDeleteRequest);
elements.btnExport.addEventListener('click', exportToMarkdown);

// Mensaje inicial en consola
console.log('%c🚀 Aplicación de Simulación HTTP iniciada', 'color: #2563eb; font-size: 16px; font-weight: bold');
console.log('%cAbre la pestaña Network en DevTools para ver más detalles', 'color: #64748b');
console.log('API Base:', CONFIG.baseURL);