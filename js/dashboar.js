// Funciones relacionadas con el dashboard

// Cargar datos estadísticos
async function loadDashboardStats() {
    toggleLoader(true, 'Cargando estadísticas...');
    
    try {
        // Obtener total de insumos
        const totalInsumosSnapshot = await db.collection('insumos').get();
        const totalInsumos = totalInsumosSnapshot.size;
        document.getElementById('totalInsumos').textContent = totalInsumos;
        
        // Obtener insumos con stock bajo
        const stockBajoSnapshot = await db.collection('insumos')
            .where('stock', '<', 10)
            .get();
        const stockBajo = stockBajoSnapshot.size;
        document.getElementById('stockBajo').textContent = stockBajo;
        
        // Obtener lotes próximos a vencer
        const proximosVencerSnapshot = await db.collection('lotes')
            .where('fechaVencimiento', '<=', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
            .get();
        const proximosVencer = proximosVencerSnapshot.size;
        document.getElementById('proximosVencer').textContent = proximosVencer;
        
        // Obtener movimientos recientes
        const movimientosRecientesSnapshot = await db.collection('movimientos')
            .orderBy('fecha', 'desc')
            .limit(5)
            .get();
        const movimientosRecientes = movimientosRecientesSnapshot.size;
        document.getElementById('movimientosRecientes').textContent = movimientosRecientes;
        
        // Cargar gráficos
        await loadCategoriesChart();
        await loadMovimientosChart();
        
        // Cargar tablas
        await loadStockBajoTable(stockBajoSnapshot.docs);
        await loadProximosVencerTable(proximosVencerSnapshot.docs);
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        showNotification('Error', 'No se pudieron cargar las estadísticas', 'error');
    } finally {
        toggleLoader(false);
    }
}

// Cargar gráfico de insumos por categoría
async function loadCategoriesChart() {
    const chartContainer = document.getElementById('categoriasChart');
    if (!chartContainer) return;
    
    try {
        const snapshot = await db.collection('insumos').get();
        const categoriesData = {};
        
        snapshot.forEach(doc => {
            const categoria = doc.data().categoria;
            if (categoriesData[categoria]) {
                categoriesData[categoria]++;
            } else {
                categoriesData[categoria] = 1;
            }
        });
        
        const labels = Object.keys(categoriesData);
        const data = Object.values(categoriesData);
        
        new Chart(chartContainer.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'
                    ]
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Insumos por Categoría'
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error al cargar gráfico de categorías:", error);
        chartContainer.innerHTML = '<p>Error al cargar el gráfico</p>';
    }
}

// Cargar gráfico de movimientos recientes
async function loadMovimientosChart() {
    const chartContainer = document.getElementById('movimientosChart');
    if (!chartContainer) return;
    
    try {
        const snapshot = await db.collection('movimientos')
            .orderBy('fecha', 'desc')
            .limit(7)
            .get();
        
        const labels = [];
        const entradas = [];
        const salidas = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            labels.push(formatDate(data.fecha));
            
            if (data.tipo === 'entrada') {
                entradas.push(data.cantidad);
                salidas.push(0);
            } else {
                entradas.push(0);
                salidas.push(data.cantidad);
            }
        });
        
        new Chart(chartContainer.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: entradas,
                        borderColor: '#10b981',
                        backgroundColor: '#d1fae5'
                    },
                    {
                        label: 'Salidas',
                        data: salidas,
                        borderColor: '#ef4444',
                        backgroundColor: '#fee2e2'
                    }
                ]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Movimientos Recientes'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Cantidad'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error al cargar gráfico de movimientos:", error);
        chartContainer.innerHTML = '<p>Error al cargar el gráfico</p>';
    }
}

// Cargar tabla de insumos con stock bajo
async function loadStockBajoTable(docs) {
    const tableContainer = document.getElementById('stockBajoTable');
    if (!tableContainer) return;
    
    try {
        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const doc of docs) {
            const data = doc.data();
            tableHTML += `
                <tr>
                    <td>${data.nombre}</td>
                    <td>${data.categoria}</td>
                    <td>
                        <span class="status-indicator status-low"></span>
                        ${data.stock}
                    </td>
                    <td>
                        <a href="#" class="btn btn-primary btn-icon" title="Ver detalles">
                            <i class="mdi mdi-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        }
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error al cargar tabla de stock bajo:", error);
        tableContainer.innerHTML = '<p>Error al cargar la tabla</p>';
    }
}

// Cargar tabla de lotes próximos a vencer
async function loadProximosVencerTable(docs) {
    const tableContainer = document.getElementById('proximosVencerTable');
    if (!tableContainer) return;
    
    try {
        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Insumo</th>
                        <th>Lote</th>
                        <th>Fecha de Vencimiento</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const doc of docs) {
            const data = doc.data();
            const insumoDoc = await db.collection('insumos').doc(data.insumoId).get();
            const insumoData = insumoDoc.data();
            
            tableHTML += `
                <tr>
                    <td>${insumoData.nombre}</td>
                    <td>${data.lote}</td>
                    <td>
                        <span class="status-indicator status-critical"></span>
                        ${formatDate(data.fechaVencimiento)}
                    </td>
                    <td>${data.stock}</td>
                    <td>
                        <a href="#" class="btn btn-primary btn-icon" title="Ver detalles">
                            <i class="mdi mdi-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        }
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error al cargar tabla de próximos a vencer:", error);
        tableContainer.innerHTML = '<p>Error al cargar la tabla</p>';
    }
}

// Actualizar estadísticas
document.getElementById('refreshStatsBtn').addEventListener('click', loadDashboardStats);

// Inicializar dashboard
async function initDashboard() {
    toggleLoader(true, 'Cargando dashboard...');
    
    try {
        // Verificar autenticación
        await new Promise((resolve, reject) => {
            auth.onAuthStateChanged(user => {
                if (user) {
                    resolve();
                } else {
                    reject('No hay usuario autenticado');
                }
            });
        });
        
        // Cargar datos del usuario
        loadUserData(auth.currentUser.uid);
        
        // Cargar estadísticas
        await loadDashboardStats();
    } catch (error) {
        console.error("Error al inicializar el dashboard:", error);
        showNotification('Error', 'No se pudo cargar el dashboard', 'error');
        
        // Redirigir al login si no hay usuario autenticado
        if (error === 'No hay usuario autenticado') {
            window.location.href = 'index.html';
        }
    } finally {
        toggleLoader(false);
    }
} 