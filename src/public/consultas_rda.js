//Capturo los contenedores para renderizar la información
const containerPatient = document.getElementById("accordion-body-patient");
const getdocumento = document.getElementById("inputDocumento");
const getTipoDocumento = document.getElementById("inputTipoDocumento");
const containerEnvios = document.getElementById("accordion-body-envios");



document.getElementById("consultaInfoIhce").addEventListener("click", function (e) {
    e.preventDefault();
    let documento = getdocumento.value;
    let tipoDocumento = getTipoDocumento.value;
    if (!documento) {
        var notyf = new Notyf({
            duration: 2000,
            position: {
                x: 'right',
                y: 'top',
            }// Set your global Notyf configuration here
        });
        notyf.error('Debes digitar un Número de documento');
    } else if (documento.length <= 5) {
        var notyf = new Notyf({
            duration: 2000,
            position: {
                x: 'right',
                y: 'top',
            }// Set your global Notyf configuration here
        });
        notyf.error('Número de documento no valido');
    } else {
        obtenerYConsultar(documento, tipoDocumento);
    }
});


const configurarFetchPais = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        mode: "cors",
        cache: "default",
    });
};

const obtenerYConsultar = async (identificacion, tipoDocumento) => {
    try {
        mostrarSpinner();
        const response = await fetch(`/visor/documentReference?tipoDocumento=${tipoDocumento}&documento=${identificacion}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.paciente == null) {
            var notyf = new Notyf({
                duration: 2000,
                position: {
                    x: 'right',
                    y: 'top',
                }
            });
            notyf.error('Paciente no Existe');
            ocultarSpinner();
            return; // Detenemos la ejecución si no hay resultados 
        }

        const { organizacionArregloDocReference, paciente, urlPatient } = data;

        /*console.log("urlPatient", urlPatient)
        console.log("organizacionArregloDocReference", organizacionArregloDocReference)
        console.log("paciente", paciente)*/
        mostrarPatient(paciente);
        if (!urlPatient) {
            console.log("urlPatient no encontrado", urlPatient);
            return;
        }

        ocultarSpinner();
        arrayDocumentReference(organizacionArregloDocReference, paciente);

        //console.log("arreglo dentro de arrayDocumentReference", arreglo)

        /*if (idDocRef) {
            await obtenerComposition(idDocRef);
        }*/

    } catch (error) {
        console.error('Error al obtener y consultar:', error);
        var notyf = new Notyf({
            duration: 2000, position:
            {
                x: 'right',
                y: 'top',
            }
        });
        notyf.error(`Error al obtener datos: ${error.message}`);
        ocultarSpinner();
    }
};

//function mostrar patient
function mostrarPatient(infoPatient) {
    containerPatient.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th scope="col">Paciente</th>
                    <th scope="col">No. de Documento</th>
                    <th scope="col">Fecha de Nacimiento</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${infoPatient.name[0].given[0]} ${infoPatient.name[0].family}</td>
                    <td>${infoPatient.identifier[0].value}</td>
                    <td>${infoPatient.birthDate}</td>
                </tr>
            </tbody>
        </table>
    `;
}

/*const obtenerPais = async (codPais) => {
    if (!codPais) {
        return "Código de país inválido";
    }
    try {
        const url = `https://restcountries.com/v3.1/alpha/${codPais}`;
        const response = await configurarFetchPais(url);

        if (response.ok) {
            const datosResponse = await response.json();

            // Verificar si 'nativeName' y 'spa' existen antes de acceder a ellas
            let codPais = "No disponible";
            if (datosResponse[0].name.nativeName && datosResponse[0].name.nativeName.spa) {
                codPais = datosResponse[0].name.nativeName.spa.common;
            } else {
                // Si 'spa' no está disponible, usa el nombre común
                codPais = datosResponse[0].name.common;
            }
            return codPais;
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
        return null; // Or throw an error if needed
    }
};*/

async function arrayDocumentReference(arregloDocuments, paciente) {
    const breadcrumbItems = arregloDocuments.map(ref => `
        <li class="list-group-item" data-id="${ref.id}" data-code="${ref.code}" data-value="${ref.value}">
            <span>${ref.infoDocument}</span>
        </li>
    `).join('');

    containerEnvios.innerHTML = `
        <nav style="--bs-breadcrumb-divider: '>';" aria-label="breadcrumb">
            <ol class="list-group list-group-numbered">
                ${breadcrumbItems}
            </ol>
        </nav>
    `;

    // Agregar evento de clic a cada ítem del breadcrumb
    containerEnvios.querySelectorAll('li[data-id]').forEach(item => {
        item.addEventListener('click', async () => {
            const idDocRef = item.getAttribute('data-id');
            const code = item.getAttribute('data-code');    // Obtener code del practitioner
            const value = item.getAttribute('data-value');  // Obtener value del practitioner

            try {
                const response = await fetch(`/visor/obtenerDatosComposition/${idDocRef}`);

                const data = await response.json();

                // Cargar el modal siempre, independientemente de si se encontró la discapacidad
                await mostrarModalRda(arregloDocuments, data, code, value, paciente, idDocRef);
            } catch (error) {
                console.error("Error al obtener los datos específicos:", error);
            }


        });
    });
}

const mostrarModalRda = async (arregloCompositions, data, value, code, patient, idDocRef) => {
    console.log("patient", patient)
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('custom-notification');

    let modalContent = document.getElementById("mostrarCompositions");
    modalContent.innerHTML = ''; // Limpiar contenido anterior

    let edad = calcularEdad(patient.birthDate);
    let idDiscapacidad = null;
    let idGenero = null;
    let idPais = null;
    let idPaisResidencia = null;
    let idEtnia = null;
    let idZonaResidencia = null;
    let mensajesError = [];
    let ciudad = null;
    let sexo = null;

    try {
        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idDiscapacidad = validarDiscapacidad(patient.extension[0].valueCodeableConcept.coding[0].code);
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.discapacidad'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idGenero = validarIdentidadGenero(patient.extension[1].valueCodeableConcept.coding[0].code);
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.genero'.");
        }

        if (patient.address) {
            idPais = patient.address[0].country;
            if (idPais === "170"){
                idPais = "Colombia"
            } 
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.pais'.");
        }

        if (patient.gender) {
            sexo = patient.gender;
            if (sexo === "female"){
                sexo = "Mujer"
            } 

            if (sexo === "male"){
                sexo = "Hombre"
            }
            
            if (sexo === "unknown" || sexo === "other"){
                sexo = "Indeterminado / Intersexual"
            }
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.pais'.");
        }


        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idPaisResidencia = patient.address[0].country;
            if (idPaisResidencia === "170"){
                idPaisResidencia = "Colombia"
            } 
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.Residencia'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idEtnia = validarEtnia(patient.extension[3].valueCodeableConcept.coding[0].code)
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.Etnia'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idZonaResidencia = validarZonaResidencia(patient.address[0].extension[0].valueCodeableConcept.coding[0].code);
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
        }

        if (patient.address && Array.isArray(patient.address) && patient.extension.length > 0) {
            ciudad = patient.address[0].city;
        } else {
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
        }


    } catch (error) {
        console.error("Error validating data:", error);
        mensajesError.push("Ocurrió un error al procesar la información del paciente.");
    }

    function agregarMensajeError(mensaje) {
        mensajesError.push(mensaje);
    }

    let content = `
            <div class="container-fluid">            
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <h5 class="text-muted">
                            * Esta información corresponde al DocumentReference almacenado en el Ministerio de Salud y Protección Social con el ID 
                            <span class="text-danger font-weight-bold">${idDocRef}</span>
                        </h5>
                    </div>
                </div>
            </div>

                <div class="card mb-3 shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0">Datos del Paciente</h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Nombre:</strong> ${patient.name[0].given[0]}  ${patient.name[0].family}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Documento:</strong> ${patient.identifier[0].value}</p>
                            </div>
                                        <div class="col-md-6">
                                <p><strong>Edad:</strong> ${edad} años</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Identidad de Genero:</strong> ${idGenero}</p>
                        </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Sexo Biológico:</strong> ${sexo}</p>
                            </div>
                                        <div class="col-md-6">
                                <p><strong>Pais de Nacimiento:</strong> ${idPais}</p>
                        </div>
                            <div class="col-md-6">
                                <p><strong>Pais de Residencia:</strong> ${idPaisResidencia}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Municipio de Residencia:</strong> ${ciudad}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Etnia:</strong> ${idEtnia}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Tipo Discapacidad:</strong> ${idDiscapacidad}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Zona de Residencia:</strong> ${idZonaResidencia}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card mb-3 shadow-sm">
                    <div class="card-header bg-danger text-white">
                        <h4 class="mb-0">Alergias</h4>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${data.alergias.map(a => `
                                <li class="list-group-item">
                                    <span class="text-danger font-weight-bold">${a.code} - ${a.display}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <div class="card mb-3 shadow-sm">
                    <div class="card-header bg-info text-white">
                        <h4 class="mb-0">Diagnósticos</h4>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${data.diagnosticos.map(d => `
                                <li class="list-group-item">
                                    <span class="text-info font-weight-bold">${d.codeDiagnostico} - ${d.diagnostico}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <div class="card mb-3 shadow-sm">
                    <div class="card-header bg-success text-white">
                        <h4 class="mb-0">Medicamentos</h4>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${data.medicamentos.map(m => `
                                <li class="list-group-item">
                                    <span class="text-success font-weight-bold">${m.codeMedicamento} - ${m.medicamento}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>



                <!-- Otras Secciones -->
                <div class="card mb-3 shadow-sm">
                    <div class="card-header bg-secondary text-white">
                        <h4 class="mb-0">Profesional de la Salud</h4>
                    </div>
                    <div class="card-body">
                        <div class="col-md-6">
                        <p><strong>Tipo de Documento:</strong> ${value}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Número de Documento:</strong> ${code}</p>
                        </div>
                    </div>
                </div>
                <div id="error-container" class="alert alert-danger" role="alert"></div>
            </div>
        `;
    modalContent.innerHTML = content;
    const errorContainer = document.getElementById('error-container');
    if (mensajesError.length > 0) {
        errorContainer.innerHTML = mensajesError.join('<br>');
    }
    $('#exampleModal').modal('show'); // Mostrar el modal
};


function calcularEdad(fecha) {

    let nacimiento = new Date(fecha);

    let fechaHoy = new Date();

    let edad = fechaHoy.getFullYear() - nacimiento.getFullYear();

    return edad;
}

function validarDiscapacidad(discapacidad) {
    if (!discapacidad) {
        return "Código de discapacidad inválido";
    }
    const discapacidades = [
        { code: "01", display: "Discapacidad física" },
        { code: "02", display: "Discapacidad visual" },
        { code: "03", display: "Discapacidad auditiva" },
        { code: "04", display: "Discapacidad intelectual" },
        { code: "05", display: "Discapacidad sicosocial" },
        { code: "06", display: "Sordoceguera" },
        { code: "07", display: "Discapacidad múltiple" },
        { code: "08", display: "Sin discapacidad" }
    ];

    const resultadoDiscapacidad = discapacidades.find(entry => entry.code === discapacidad);

    return resultadoDiscapacidad ? resultadoDiscapacidad.display : "No se encontró la discapacidad";

}

function validarIdentidadGenero(genero) {
    if (!genero) {
        return "Código de genero inválido";
    }
    const identidadGenero = [
        { code: "01", display: "Masculino" },
        { code: "02", display: "Femenino" },
        { code: "03", display: "Transgénero" },
        { code: "04", display: "Neutro" },
        { code: "05", display: "No lo declara" }
    ];

    const resultadoGenero = identidadGenero.find(entry => entry.code === genero);

    return resultadoGenero ? resultadoGenero.display : "No existe genero que comparar en el document";
}

function validarEtnia(etnia) {
    const etnias = [
        { code: "01", display: "Indigena" },
        { code: "02", display: "ROM (Gitanos)" },
        { code: "03", display: "Raizal (San Andrés y Providencia)" },
        { code: "04", display: "Palenquero de San Basilio de Palenque" },
        { code: "05", display: "Negro(a)" },
        { code: "06", display: "Afrocolombiano(a)" },
        { code: "99", display: "Ninguna de las anteriores" }
    ];

    const resultadoEtnia = etnias.find(entry => entry.code === etnia);
    return resultadoEtnia ? resultadoEtnia.display : "No existe etnia que comparar en el document"
}


function validarZonaResidencia(zona) {
    const zonaResidencia = [
        { code: "01", display: "Urbana" },
        { code: "02", display: "Rural" }
    ];

    const resultadoZonaResidencia = zonaResidencia.find(entry => entry.code === zona);

    return resultadoZonaResidencia ? resultadoZonaResidencia.display : "No existe zona que comparar en el document"

}/***** Version 2, traer la información correspondient a cada uno de los document reference *****/

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


