const URL_BASE = 'https://ihce.ihcecol.gov.co/170/fhir/DocumentReference?custodian=reg-';
const URL_BASE_PRESTADOR = 'https://ihce.ihcecol.gov.co/170/fhir/Organization/'
const URL_BASE_FINAL = '&_count=2000&_sort=-_lastUpdated'
const idPrestador = "inst-4485500391";
let myChart;
const API_KEY_DR = 'pEx8O-ek4Lr4dAXM5xPDLlrDelz_BSVYDl4vSr0qdng';

const cantidadTerritorio = document.getElementById('datos');

const arrayRegiones = [
    {
        idRegion: "05",
        region: "Antioquia"
    },
    {
        idRegion: 68,
        region: "Santander"
    },
    {
        idRegion: 76,
        region: "Valle"
    },
    {
        idRegion: 50,
        region: "Meta"
    },
    {
        idRegion: 25,
        region: "Cundinamarca"
    },
    {
        idRegion: 11001,
        region: "Bogota"
    },
    {
        idRegion: 73,
        region: "Tolima"
    },
    {
        idRegion: 44,
        region: "Guajira"
    }
]// Your API key



const configurarFetchConteo = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    });
};

const configurarFetchPrestador = (endpoint, method = 'GET') => {
    return fetch(endpoint,{
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    })
}


const extraerIdRegion = arrayRegiones.map(region => region.idRegion);



async function obtenerConteoDocument(region) {
    try {
        const response = await configurarFetchConteo(`${URL_BASE}${region}${URL_BASE_FINAL}`);
        if (response.ok) {
            const datos = await response.json();
            const total = datos.entry.length;

            if (datos.entry && datos.entry.length > 0) {
                const author = datos.entry.map(autor => autor.resource.author[0].reference.split("/").pop());
                const uniqueAuthors = new Set(author);
                const authorSinDuplicados = Array.from(uniqueAuthors);

                const authorsWithNames = [];
                for (const author of authorSinDuplicados) {
                    const nombrePrestador = await obtenerNombrePrestador(author);
                    authorsWithNames.push({ author, nombrePrestador });
                }
                console.log("authorsWithNames", authorsWithNames);
            }

            // Update arrayRegiones with the total count for each region
            const regionIndex = arrayRegiones.findIndex(r => r.idRegion === region);
            if (regionIndex !== -1) {
                arrayRegiones[regionIndex].total = total;
            }
            await mostrarDatos(arrayRegiones[regionIndex]); // Pass the updated region object
            await printCharts()
        return arrayRegiones;
        }else if (response.status === 401) {
            console.log("Unauthorized: Invalid API key");
        }else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}



async function obtenerNombrePrestador(idPrestador){
    try {
        const response = await configurarFetchPrestador(`${URL_BASE_PRESTADOR}/${idPrestador}`);
        if (response.ok){
            const datos = await response.json();
            const nombrePrestador = datos.name
            return nombrePrestador;
        }else if (response.status === 401) {
            console.log("Unauthorized: Invalid API key");
        }else {
            console.log("Error:", response.statusText);
        }
        return null;
    }catch (error) {
        console.error('Error:', error);
    }
}

(async () => {
    for (const region of extraerIdRegion) {
        await obtenerConteoDocument(region);
    }
})();


async function mostrarDatos(region) {
    //console.log('Region data:', region); // You can see the object with total property

    cantidadTerritorio.innerHTML += `
        <div class="col-xl-3 col-lg-6 col-sm-6 grid-margin stretch-card" >
            <div class="card info-box " style="height: 15rem;" >
                <div class="small-box bg-info " style="height: 100%;">
                    <div class="inner">
                        <h3>${region.total}</h3>
                        <p style="color: black; font-weight: bold; font-size: x-large;">${region.region}</p>
                    </div>
                    <div class="icon">
                        <i class="far fa-copy"></i></span>
                    </div>
                    <a href="#" class="small-box-footer">
                        More info <i class="fas fa-arrow-circle-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}


const printCharts = () => {
    const labelsRegiones = arrayRegiones.map(region => region.region);
    const datasets = arrayRegiones.map(total => total.total);
    renderModelChart(labelsRegiones, datasets)
}

const renderModelChart = (labelsRegiones, datasets) =>{
    const ctx = document.getElementById('modelsChart').getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    const data = {
        labels: labelsRegiones,
        datasets: [{
            data: datasets,
            borderColor: getDataColors(),
            backgroundColor: getDataColors(80),
        }]
    }

    const options = {
        scales: {
            x: {
                title: {
                    color: 'black',
                    display: true,
                    text: 'Territorios',
                    font: {
                        size: 24
                    }
                },
                ticks: {
                    font: {
                        size: 16 // Adjust the font size here
                    }
                }
            },
            y: {
                title: {
                    color: 'black',
                    display: true,
                    text: 'Transacciones',
                    font: {
                        size: 24
                    }
                },
                ticks: {
                    font: {
                        size: 16 // Adjust the font size here
                    }
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Comparativa de transacciones por departamento',
                font: {
                    size: 24
                }
            },
            legend: {
                display: false,
                font: {
                    size: 24
                }
            },

        }
    }

    myChart = new Chart(ctx, { type: 'bar', data, options });
}


//https://ihce.ihcecol.gov.co/170/fhir/metadata
//https://ihce.ihcecol.gov.co/170/fhir/DocumentReference?custodian=reg-50&_count=200&_sort=-_lastUpdated
//https://ihce.ihcecol.gov.co/170/fhir/author?_summary=count
//https://ihce.ihcecol.gov.co/170/fhir/DocumentReference?_summary=count

//"HAPI-0524: Unknown search parameter \"identifier-type\" for resource type \"DocumentReference\". Valid search parameters for this search are: [_content, _id, _lastUpdated, _profile, _security, _source, _tag, _text, authenticator, author, category, contenttype, custodian, date, description, encounter, event, facility, format, identifier, language, location, patient, period, related, relatesto, relation, relationship, security-label, setting, status, subject, type