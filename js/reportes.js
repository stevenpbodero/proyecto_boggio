// Sistema de reportes

class ReportManager {
    constructor() {
        this.products = [];
        this.movements = [];
        this.categories = [];
        this.suppliers = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.generateReports();
        this.setupEventListeners();
    }

    // Cargar datos
    async loadData() {
        this.products = Utils.loadFromStorage('inventory_products') || [];
        this.movements = Utils.loadFromStorage('inventory_movements') || [];
        this.categories = Utils.loadFromStorage('inventory_categories') || [];
        this.suppliers = Utils.loadFromStorage('inventory_suppliers') || [];
    }

    // Generar reportes
    generateReports() {
        this.generateStockReport();
        this.generateMovementReport();
        this.generateCategoryReport();
        this.generateLowStockReport();
    }

    // Reporte de stock
    generateStockReport() {
        const stockReport = document.getElementById('stockReport');
        if (!stockReport) return;

        try {
            const totalValue = this.products.reduce((sum, product) => {
                return sum + (product.currentStock * product.purchasePrice);
            }, 0);

            const lowStockCount = this.products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
            const outOfStockCount = this.products.filter(p => p.currentStock === 0).length;
            const healthyStockCount = this.products.length - lowStockCount - outOfStockCount;

            stockReport.innerHTML = `
                <div class="report-stats">
                    <div class="report-stat">
                        <h3>${this.products.length}</h3>
                        <p>Total Productos</p>
                    </div>
                    <div class="report-stat">
                        <h3>${Utils.formatCurrency(totalValue)}</h3>
                        <p>Valor Total Inventario</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-success">${healthyStockCount}</h3>
                        <p>Stock Saludable</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-warning">${lowStockCount}</h3>
                        <p>Stock Bajo</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-danger">${outOfStockCount}</h3>
                        <p>Sin Stock</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating stock report:', error);
            stockReport.innerHTML = '<p>Error al generar el reporte de stock</p>';
        }
    }

    // Reporte de movimientos
    generateMovementReport() {
        const movementReport = document.getElementById('movementReport');
        if (!movementReport) return;

        try {
            const today = new Date().toDateString();
            const todayMovements = this.movements.filter(m => 
                new Date(m.date).toDateString() === today
            );

            const entradaCount = todayMovements.filter(m => m.type === 'entrada').length;
            const salidaCount = todayMovements.filter(m => m.type === 'salida').length;
            const totalEntrada = todayMovements
                .filter(m => m.type === 'entrada')
                .reduce((sum, m) => sum + m.quantity, 0);
            const totalSalida = todayMovements
                .filter(m => m.type === 'salida')
                .reduce((sum, m) => sum + m.quantity, 0);

            movementReport.innerHTML = `
                <div class="report-stats">
                    <div class="report-stat">
                        <h3>${todayMovements.length}</h3>
                        <p>Movimientos Hoy</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-success">${entradaCount}</h3>
                        <p>Entradas</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-danger">${salidaCount}</h3>
                        <p>Salidas</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-success">${totalEntrada}</h3>
                        <p>Unidades Entrantes</p>
                    </div>
                    <div class="report-stat">
                        <h3 class="text-danger">${totalSalida}</h3>
                        <p>Unidades Salientes</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error generating movement report:', error);
            movementReport.innerHTML = '<p>Error al generar el reporte de movimientos</p>';
        }
    }

    // Reporte por categorías
    generateCategoryReport() {
        const categoryReport = document.getElementById('categoryReport');
        if (!categoryReport) return;

        try {
            const categoryStats = this.categories.map(category => {
                const categoryProducts = this.products.filter(p => p.category === category.id);
                const productCount = categoryProducts.length;
                const totalValue = categoryProducts.reduce((sum, product) => {
                    return sum + (product.currentStock * product.purchasePrice);
                }, 0);
                const lowStockCount = categoryProducts.filter(p => p.currentStock <= p.minStock).length;

                return {
                    category: category.name,
                    productCount,
                    totalValue,
                    lowStockCount
                };
            }).filter(stat => stat.productCount > 0) // Solo mostrar categorías con productos
              .sort((a, b) => b.totalValue - a.totalValue); // Ordenar por valor descendente

            if (categoryStats.length === 0) {
                categoryReport.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <p>No hay datos para mostrar por categorías</p>
                    </div>
                `;
                return;
            }

            categoryReport.innerHTML = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Productos</th>
                                <th>Valor Total</th>
                                <th>Alertas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${categoryStats.map(stat => `
                                <tr>
                                    <td>${Utils.escapeHtml(stat.category)}</td>
                                    <td>${stat.productCount}</td>
                                    <td>${Utils.formatCurrency(stat.totalValue)}</td>
                                    <td>
                                        ${stat.lowStockCount > 0 ? 
                                            `<span class="stock-low">${stat.lowStockCount} alertas</span>` : 
                                            '<span class="text-success">✅</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error generating category report:', error);
            categoryReport.innerHTML = '<p>Error al generar el reporte por categorías</p>';
        }
    }

    // Reporte de stock bajo
    generateLowStockReport() {
        const lowStockReport = document.getElementById('lowStockReport');
        if (!lowStockReport) return;

        try {
            const lowStockProducts = this.products.filter(p => 
                p.currentStock <= p.minStock
            ).sort((a, b) => a.currentStock - b.currentStock);

            if (lowStockProducts.length === 0) {
                lowStockReport.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">✅</div>
                        <p>No hay productos con stock bajo</p>
                    </div>
                `;
                return;
            }

            lowStockReport.innerHTML = `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Stock Actual</th>
                                <th>Stock Mínimo</th>
                                <th>Diferencia</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lowStockProducts.map(product => {
                                const category = this.categories.find(c => c.id === product.category);
                                const difference = product.minStock - product.currentStock;
                                const status = product.currentStock === 0 ? 
                                    '<span class="stock-out">SIN STOCK</span>' : 
                                    '<span class="stock-low">STOCK BAJO</span>';
                                
                                return `
                                    <tr>
                                        <td>${Utils.escapeHtml(product.name)}</td>
                                        <td>${Utils.escapeHtml(category?.name || 'Sin categoría')}</td>
                                        <td>${product.currentStock}</td>
                                        <td>${product.minStock}</td>
                                        <td>${difference}</td>
                                        <td>${status}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error generating low stock report:', error);
            lowStockReport.innerHTML = '<p>Error al generar el reporte de stock bajo</p>';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        const exportBtn = document.getElementById('exportReports');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReports());
        }

        const refreshBtn = document.getElementById('refreshReports');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshReports());
        }
    }

    // Refrescar reportes
    async refreshReports() {
        const refreshBtn = document.getElementById('refreshReports');
        Utils.setLoading(refreshBtn, true);

        try {
            await this.loadData();
            this.generateReports();
            Utils.showNotification('Reportes actualizados', 'success');
        } catch (error) {
            console.error('Error refreshing reports:', error);
            Utils.showNotification('Error al actualizar los reportes', 'danger');
        } finally {
            Utils.setLoading(refreshBtn, false);
        }
    }

    // Exportar reportes
    exportReports() {
        try {
            const reportsData = {
                fecha: new Date().toLocaleString('es-ES'),
                resumen: {
                    totalProductos: this.products.length,
                    valorTotalInventario: this.products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0),
                    productosStockBajo: this.products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length,
                    productosSinStock: this.products.filter(p => p.currentStock === 0).length,
                    totalMovimientosHoy: this.movements.filter(m => 
                        new Date(m.date).toDateString() === new Date().toDateString()
                    ).length
                },
                productos: this.products.map(p => ({
                    nombre: p.name,
                    codigo: p.code,
                    categoria: this.categories.find(c => c.id === p.category)?.name || 'Sin categoría',
                    stockActual: p.currentStock,
                    stockMinimo: p.minStock,
                    precioCompra: p.purchasePrice,
                    precioVenta: p.salePrice,
                    estado: p.currentStock === 0 ? 'SIN_STOCK' : p.currentStock <= p.minStock ? 'STOCK_BAJO' : 'OK'
                })),
                movimientosRecientes: this.movements
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 50)
                    .map(m => ({
                        fecha: Utils.formatDate(m.date),
                        producto: this.products.find(p => p.id === m.productId)?.name || 'Desconocido',
                        tipo: m.type,
                        cantidad: m.quantity,
                        motivo: m.reason
                    })),
                categorias: this.categories.map(c => ({
                    nombre: c.name,
                    totalProductos: this.products.filter(p => p.category === c.id).length,
                    valorTotal: this.products
                        .filter(p => p.category === c.id)
                        .reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0)
                }))
            };

            const dataStr = JSON.stringify(reportsData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            const fecha = new Date().toISOString().split('T')[0];
            link.download = `reporte_inventario_${fecha}.json`;
            link.click();
            
            Utils.showNotification('Reportes exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exporting reports:', error);
            Utils.showNotification('Error al exportar los reportes', 'danger');
        }
    }
}

// Inicializar gestor de reportes
let reportManager;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reportes.html')) {
        reportManager = new ReportManager();
    }
});