let myChart;
const cantidadTerritorio = document.getElementById('datos');

const estilos = `
<style>
    .stat-card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
    }

    .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .stat-card .background-icon {
        position: absolute;
        right: -20px;
        bottom: -20px;
        font-size: 8rem;
        opacity: 0.1;
        transform: rotate(-15deg);
        transition: all 0.3s ease;
    }

    .stat-card:hover .background-icon {
        transform: rotate(0deg) scale(1.1);
        opacity: 0.15;
    }

    .stat-card .total {
        font-size: 2.5rem;
        font-weight: 700;
        color: #2563eb;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .stat-card .region {
        font-size: 1.25rem;
        color: #4b5563;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .stat-card .trend {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #059669;
    }

    .stat-card .footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .stat-card .footer-link {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        transition: color 0.3s ease;
    }

    .stat-card .footer-link:hover {
        color: #2563eb;
    }

    .stat-card .badge {
        background: #dbeafe;
        color: #2563eb;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
    }
</style>
`;


document.head.insertAdjacentHTML('beforeend', estilos);

const arrayRegiones = [
    {
        idRegion: "05",
        region: "Antioquia"
    },
    {
        idRegion: "68",
        region: "Santander"
    },
    {
        idRegion: "76",
        region: "Valle"
    },
    {
        idRegion: "50",
        region: "Meta"
    },
    {
        idRegion: "25",
        region: "Cundinamarca"
    },
    {
        idRegion: "11001",
        region: "Bogota"
    },
    {
        idRegion: "73",
        region: "Tolima"
    },
    {
        idRegion: "44",
        region: "Guajira"
    }
];

const extraerIdRegion = arrayRegiones.map(region => region.idRegion);

async function obtenerConteoDocument(region) {
    mostrarSpinner()
    try {
        const response = await fetch(`/tablero/conteoDocumentosRegiones?region=${region}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        console.log("Información", data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

function limpiarDatos() {
    cantidadTerritorio.innerHTML = '';
}

function mostrarDatos(regionesData) {
    if (!Array.isArray(regionesData)) {
        console.error('Se esperaba un array de datos:', regionesData);
        return;
    }

    limpiarDatos();

    cantidadTerritorio.innerHTML = '<div class="stat-grid"></div>';
    const grid = cantidadTerritorio.querySelector('.stat-grid');

    regionesData.forEach(data => {
        if (!data || !data.total || !data.region) {
            console.error('Datos inválidos para una región:', data);
            return;
        }

        // Calculamos el promedio (esto es un ejemplo, ajusta según tus necesidades)
        const promedio = regionesData.reduce((acc, curr) => acc + curr.total, 0) / regionesData.length;
        const estaArribaDelPromedio = data.total > promedio;

        grid.innerHTML += `
            <div class="stat-card">
                <i class="far fa-building background-icon"></i>
                
                <div class="total">
                    ${data.total.toLocaleString()}
                    <span class="badge">${estaArribaDelPromedio ? '↑' : '↓'} Promedio</span>
                </div>
                
                <div class="region">
                    ${data.region}
                </div>
                
                <div class="trend">
                    <i class="fas ${estaArribaDelPromedio ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    ${Math.abs(((data.total - promedio) / promedio * 100)).toFixed(1)}% del promedio
                </div>
                
                <div class="footer">
                    <span class="badge">
                        <i class="far fa-clock"></i>
                        Actualizado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <a href="#" class="footer-link" onclick="verDetalles('${data.idRegion}')">
                        Ver detalles
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
    });
}

function verDetalles(idRegion) {
    console.log(`Ver detalles de la región: ${idRegion}`);
    // Implementar la lógica para mostrar más detalles
}

const printCharts = (regionesData) => {
    const labelsRegiones = regionesData.map(data => data.region);
    const datasets = regionesData.map(data => data.total);
    renderModelChart(labelsRegiones, datasets);
}

// Primero necesitas incluir ApexCharts en tu HTML
// <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

let apexChart;

const renderModelChart = (labelsRegiones, datasets) => {
    // Destruir el gráfico anterior si existe
    if (apexChart) {
        apexChart.destroy();
    }

    // Preparar los datos
    const seriesData = datasets.map((value, index) => ({
        x: labelsRegiones[index],
        y: value,
    }));

    // Configuración del gráfico
    const options = {
        series: [{
            name: 'Transacciones',
            data: seriesData
        }],
        chart: {
            type: 'bar',
            height: 450,
            fontFamily: 'Helvetica, Arial, sans-serif',
            background: 'transparent',
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: true,
                    zoom: true,
                    zoomin: true,
                    zoomout: true,
                    pan: true,
                    reset: true
                },
                export: {
                    csv: {
                        filename: 'transacciones-por-region',
                        columnDelimiter: ',',
                        headerCategory: 'Región',
                        headerValue: 'Transacciones'
                    },
                    svg: {
                        filename: 'transacciones-grafico',
                    },
                    png: {
                        filename: 'transacciones-grafico',
                    }
                },
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1000,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                distributed: true,
                dataLabels: {
                    position: 'top'
                },
                columnWidth: '70%',
                barHeight: '70%'
            }
        },
        colors: [
            '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
            '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'
        ],
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val;
            },
            offsetY: -20,
            style: {
                fontSize: '12px',
                colors: ['#1e293b'],
                fontWeight: 600
            }
        },
        grid: {
            show: true,
            borderColor: '#e2e8f0',
            strokeDashArray: 4,
            position: 'back',
            xaxis: {
                lines: {
                    show: false
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        },
        xaxis: {
            categories: labelsRegiones,
            labels: {
                style: {
                    fontSize: '12px',
                    fontWeight: 500,
                    colors: Array(labelsRegiones.length).fill('#64748b')
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                formatter: function (val) {
                    if (val >= 1000000) {
                        return `${(val / 1000000).toFixed(1)}M`;
                    } else if (val >= 1000) {
                        return `${(val / 1000).toFixed(1)}K`;
                    }
                    return val;
                },
                style: {
                    fontSize: '12px',
                    colors: ['#64748b']
                }
            }
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            style: {
                fontSize: '12px'
            },
            y: {
                formatter: function (val) {
                    return new Intl.NumberFormat('es-CO').format(val);
                },
                title: {
                    formatter: function (seriesName) {
                        return seriesName + ':';
                    }
                }
            },
            marker: {
                show: false
            },
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                const value = series[seriesIndex][dataPointIndex];
                const region = w.globals.labels[dataPointIndex];
                const total = series[seriesIndex].reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);

                return `
                    <div class="custom-tooltip" style="
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.98);
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        border-radius: 6px;
                        border: 1px solid #e2e8f0;
                        font-family: Helvetica, Arial, sans-serif;
                    ">
                        <div style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">
                            ${region}
                        </div>
                        <div style="color: #64748b; font-size: 12px;">
                            <div>Total: ${new Intl.NumberFormat('es-CO').format(value)}</div>
                            <div>Porcentaje: ${percentage}%</div>
                        </div>
                    </div>
                `;
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'darken',
                    value: 0.1
                }
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                    type: 'darken',
                    value: 0.35
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                type: 'vertical',
                shadeIntensity: 0.5,
                gradientToColors: ['#60a5fa'],
                inverseColors: false,
                opacityFrom: 0.9,
                opacityTo: 0.6,
                stops: [0, 100]
            }
        },
        title: {
            text: 'Comparativa de Transacciones por Departamento',
            align: 'center',
            margin: 20,
            offsetY: 10,
            style: {
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#0f172a'
            }
        }
    };

    // Crear el gráfico
    apexChart = new ApexCharts(document.getElementById('modelsChart'), options);
    apexChart.render();
};

// Añadir estilos para el contenedor
const styles = `
    <style>
        .chart-wrapper {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin: 20px 0;
        }
        
        .custom-tooltip {
            transition: all 0.2s ease;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', styles);

// Función principal para inicializar todo
async function inicializarDashboard() {
    const regionesData = await obtenerConteoDocument();

    if (regionesData && regionesData.length > 0) {
        mostrarDatos(regionesData);
        printCharts(regionesData);
    } else {
        console.error('No se pudieron obtener datos de las regiones');
    }
    ocultarSpinner()
}

// Función para mostrar el spinner
function mostrarSpinner() {
    let loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));

    if (!loadingModal) {
        loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {
            backdrop: 'static',
            keyboard: false
        });
    }

    loadingModal.show();
}

// Función para ocultar el spinner y eliminar el backdrop si es necesario
function ocultarSpinner() {
    const loadingModalElement = document.getElementById('loadingModal');
    const loadingModal = loadingModalElement ? bootstrap.Modal.getInstance(loadingModalElement) : null;

    if (loadingModal) {
        loadingModal.hide();
        setTimeout(() => {
            loadingModal.dispose();
            loadingModalElement.classList.remove('show', 'fade');  // Eliminar clases CSS
            loadingModalElement.style.display = 'none';  // Asegurarse de ocultar el modal
        }, 500);  // Espera para permitir que la animación termine
    } else {
        console.error("No se encontró la instancia del modal");
    }
}

// Iniciar la aplicación
inicializarDashboard();