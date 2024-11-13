let arregloReference = [];
let relacionReference = [];
let urlPatient;
let idDocRef;
let idComposition;
let idComposition2;
let region;
let region2;
let medicamentos = [];
let diagnosticos = [];



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


const configurarFetchPat = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_PAT
        },
        mode: "cors",
        cache: "default",
    });
}

const configurarFetchComposition = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    });
}

const configurarFetchCompositionAlergias = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    })
}

const configurarFetchDiagnosticos = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    })
}

const configurarfetchDocument = (endpoint, method = 'GET') => {
    return fetch(endpoint, {

        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    })
}


const configurarFetchPais = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        mode: "cors",
        cache: "default",
    });
};


// const obtenerInstitucion = async (institucion) => {
//     try {
//         const response = await configurarFetchInstitucion(`${URL_INSTITUCION}${institucion}`);
//
//         if (!response.ok) {
//             if (response.status === 401) {
//                 console.log("Unauthorized: Invalid API key");
//             } else {
//                 console.error("Error:", response.statusText);
//             }
//             return null; // Or throw an error if needed
//         }
//
//         const datos = await response.json();
//
//         // Check for the presence of "name" property based on your API response structure
//         if (datos.name) {
//             const nombreInstitucion = datos.name;
//             console.log("nombreInstitucion", nombreInstitucion);
//             return nombreInstitucion;
//         } else {
//             console.warn("Nombre de institución no encontrado en los datos.");
//             return null; // Or throw an error if needed
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         return null; // Or throw an error if needed
//     }
// };


//****************Informacion Institucion********************

const configurarFetchCompositionMedicamentos = (endpoint, method = 'GET') => {
    return fetch(endpoint, {
        method: method,
        headers: {
            'x-api-key': API_KEY_DR
        },
        mode: "cors",
        cache: "default",
    });
}

//****************Informacion Composition********************

const obtenerComposition = async (idDocRef) => {
    try {
        const response = await configurarFetchComposition(`${URL_BASE}/${pais}/fhir/DocumentReference/${idDocRef}`);
        if (response.ok) {
            console.log("Conexion realizada Composition")
            let datosComposition = await response.json();
            console.log("datosComposition", datosComposition)
            if (datosComposition.content[0].url !== "") {
                let fullUrl = datosComposition.content[0].attachment.url;
                let splitUrl = fullUrl.split("/");
                idComposition = splitUrl[6];
                region = splitUrl[3]
                await obtenerCompositionMedicamentos(region, idComposition);
                await obtenerCompositionAlergias(region, idComposition);
                await obtenerCompositionDiagnosticos(region, idComposition);
            } else {
                console.log("No existen datos del composition para el paciente")
            }
        } else if (response.status === 401) {
            console.log("Invalid API-KEY");
        }
        else {
            console.log("Error:", response.statusText);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}

//****************Informacion Composition********************


const obtenerDocument = async (territorio, idComposition) => {
    try {
        const responseDocument = await configurarfetchDocument(`https://ihce.ihcecol.gov.co/${territorio}/fhir/Composition/${idComposition}/$document`);
        if (responseDocument.ok) {
            console.log("Conexión Realizada a $document");
            let datosDocument = await responseDocument.json();
            if (datosDocument.entry && datosDocument.entry.length > 0) {
                const recursoPractitioner = datosDocument.entry.find(entry => entry.resource.resourceType === 'Practitioner')

                if (recursoPractitioner) {
                    const code = recursoPractitioner.resource.identifier[0].type.coding[0].code;
                    const value = recursoPractitioner.resource.identifier[0].value;
                    // Retornar code y value
                    return { code, value };
                } else {
                    console.log("No Existe recurso Practitioner");
                    return null;
                }
            } else {
                console.log("no se encuentra el entry Practitioner");
                return null;
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//****************Informacion InfoCompositionMedicamentos********************
const obtenerCompositionMedicamentos = async (region, idComposition) => {
    try {
        const responseCompositionMedicamentos = await configurarFetchCompositionMedicamentos(`${URL_BASE}/${region}/fhir/Composition?_id=${idComposition}${URL_FINAL_MEDICAMENTOS}`)
        if (responseCompositionMedicamentos.ok) {
            console.log("Conexión Realizada composition Medicamentos")
            let datosCompositionMedicamentos = await responseCompositionMedicamentos.json();
            medicamentos = datosCompositionMedicamentos.entry.filter(medicamento => medicamento.resource && medicamento.resource.medicationCodeableConcept)
                .map(medicamento => ({
                    medicamento: medicamento.resource.medicationCodeableConcept.coding[0].display
                }));
            mostrarMedicamentos(medicamentos);
        } else {
            console.log("Error:", responseCompositionMedicamentos.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
//****************Informacion InfoCompositionMedicamentos********************


//****************Informacion InfoCompositionAlergias********************
const obtenerCompositionAlergias = async (region, idComposition) => {
    try {
        const responseInfoAlergias = await configurarFetchCompositionAlergias(`${URL_BASE}/${region}/fhir/Composition?_id=${idComposition}${URL_FINAL_ALERGIAS}`);

        if (responseInfoAlergias.ok) {
            console.log("Conexion realizada Alergias")
            const datosAlergias2 = await responseInfoAlergias.json();
            const alergias = datosAlergias2.entry.filter(alergia =>
                (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) ||
                (alergia.resource.code?.coding?.[0]?.display)
            ).map(alergia => {
                let display = null;

                // Intenta obtener el display desde extension
                if (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) {
                    display = alergia.resource.extension[0].valueCodeableConcept.coding[0].display;
                    //console.log("Display from extension:", display);
                } else {
                    //console.log("No display from extension");
                }

                // Si el display es "Medicamento", volverlo nulo
                if (display === "Medicamento") {
                    //console.log("Display from extension is 'Medicamento', setting to null");
                    display = null;
                }

                // Si el display es nulo, intenta obtenerlo desde code
                if (!display && alergia.resource.code?.text) {
                    display = alergia.resource.code?.text;
                    //console.log("Display from code:", display);
                } else if (!display) {
                    //console.log("No display from code");
                }

                // Si no se encontró en ninguno o es nulo, asigna un mensaje por defecto
                if (!display) {
                    display = "No relacionaron el display de la alergia";
                    //console.log("Default message:", display);
                }

                return {
                    alergia: display
                };
            });
            mostrarAlergias(alergias);
        } else {
            console.log("Error:", responseCompositionMedicamentos.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
//****************Informacion InfoCompositionAlergias********************


const obtenerCompositionDiagnosticos = async (region, idComposition) => {
    try {
        const respuestaInfoDiagnosticos = await configurarFetchDiagnosticos(`${URL_BASE}/${region}/fhir/Composition?_id=${idComposition}${URL_FINAL_DIAGNOSTICOS}`);
        if (respuestaInfoDiagnosticos.ok) {
            console.log("Conexión Realizada composition Diagnosticos");
            let datosCompositionDiagnosticos = await respuestaInfoDiagnosticos.json();
            diagnosticos = datosCompositionDiagnosticos.entry.filter(diagnostico => diagnostico.resource && diagnostico.resource.code)
                .map(diagnostico => ({
                    diagnostico: diagnostico.resource.code.coding[0].display
                }))
            mostrarDiagnosticos(diagnosticos);
        } else {
            console.log("Error:", responseCompositionMedicamentos.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

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
        console.log("data", data)

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

        const { organizacionArregloDocReference, paciente, urlPatient, obtenerMedicamentosDiagnosticosAlergiasPaciente } = data;

        /*console.log("urlPatient", urlPatient)
        console.log("organizacionArregloDocReference", organizacionArregloDocReference)
        console.log("paciente", paciente)*/
        mostrarPatient(paciente);
        if (!urlPatient) {
            console.log("urlPatient no encontrado", urlPatient);
            return;
        }

        ocultarSpinner();
        arrayDocumentReference(organizacionArregloDocReference);

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


const obtenerInfoPacienteDos = async () => {
    try {
        const responsePatient = await configurarFetchPat(`${URL_BASE}${urlPatient}`);
        if (responsePatient.ok) {
            console.log("Conexion Realizada PatienteDos");
            const datosPatient = await responsePatient.json();
            console.log("info paciente", datosPatient);
            return datosPatient;
        } else if (responsePatient.status === 401) {
            console.log("Unauthorized: Invalid API key")
        } else {
            console.log("Error:", responsePatient.statusText);
        }
    } catch (error) {
        console.log("Error:", error);
    }
}


const obtenerPais = async (codPais) => {
    if (!pais) {
        return "Código de país inválido";
    }
    try {
        const url = `https://restcountries.com/v3.1/alpha/${codPais}`;
        const response = await configurarFetchPais(url);

        if (response.ok) {
            const datosResponse = await response.json();

            // Verificar si 'nativeName' y 'spa' existen antes de acceder a ellas
            let pais = "No disponible";
            if (datosResponse[0].name.nativeName && datosResponse[0].name.nativeName.spa) {
                pais = datosResponse[0].name.nativeName.spa.common;
            } else {
                // Si 'spa' no está disponible, usa el nombre común
                pais = datosResponse[0].name.common;
            }
            console.log("pais", pais);
            return pais;
        } else if (response.status === 401) {
            console.log("Unauthorized: Invalid API key");
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
        return null; // Or throw an error if needed
    }
};

async function arrayDocumentReference(arreglo) {
    const breadcrumbItems = arreglo.map(ref => `
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

            // Obtener Composition y el paciente
            const compositions = await obtenerCompositionDos(idDocRef);
            console.log("compositions", compositions)
            const patient = await obtenerInfoPacienteDos(); // Obtener datos del paciente
            console.log("patient desde obtenerInfoPacienteDos", patient)

            if (patient) {
                if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {

                } else {
                    console.warn("La propiedad 'extension' no está presente o no es un array en 'patient'.");
                }

                // Cargar el modal siempre, independientemente de si se encontró la discapacidad
                await mostrarModalRda(compositions, patient, code, value);
            } else {
                console.error("Error: Patient data not retrieved from obtenerInfoPacienteDos");
            }
        });
    });
}

function obtenerRelacionDocumentReference(arreglo) {
    relacionReference = arreglo.entry.map(entry => {
        const reference = entry.resource.id;
        return {
            reference: reference,
        }
    })
    const compositions = relacionReference.map(ref =>
        obtenerCompositionDos(ref.reference),
    )

}


/***** Version 2, traer la información correspondient a cada uno de los document reference *****/

const obtenerCompositionDos = async (idDocRef) => {
    try {
        const response = await configurarFetchComposition(`${URL_BASE}/${pais}/fhir/DocumentReference/${idDocRef}`);
        if (response.ok) {
            console.log("Conexion a Composition Dos");
            let datosCompositionDos = await response.json();
            if (datosCompositionDos.content && datosCompositionDos.content.length > 0 && datosCompositionDos.content[0].attachment.url) {
                let fullUrl = datosCompositionDos.content[0].attachment.url;
                let splitUrl = fullUrl.split("/");
                idComposition2 = splitUrl[6];
                region2 = splitUrl[3];

                const [medicamentos, alergias, diagnosticos] = await Promise.all([
                    obtenerMedicamentos2(region2, idComposition2),
                    obtenerCompositionAlergias2(region2, idComposition2),
                    obtenerDiagnosticos2(region2, idComposition2)
                ]);

                return {
                    idDocRef,
                    medicamentos: medicamentos || [], // Manejo de casos vacíos
                    alergias: alergias || [], // Manejo de casos vacíos
                    diagnosticos: diagnosticos || [] // Manejo de casos vacíos
                };
            } else {
                console.log("No existen datos del composition para el paciente");
                return { idDocRef, medicamentos: [], alergias: [], diagnosticos: [] };
            }

        } else if (response.status === 401) {
            console.log("Invalid API-KEY");
            return { idDocRef, medicamentos: [], alergias: [], diagnosticos: [] };
        } else {
            console.log("Error:", response.statusText);
            return { idDocRef, medicamentos: [], alergias: [], diagnosticos: [] };
        }
    } catch (error) {
        console.error('Error:', error);
        return { idDocRef, medicamentos: [], alergias: [], diagnosticos: [] };
    }
}

const obtenerMedicamentos2 = async (region, IdComposition) => {
    try {
        const response = await configurarFetchCompositionMedicamentos(`${URL_BASE}/${region}/fhir/Composition?_id=${IdComposition}${URL_FINAL_MEDICAMENTOS}`);
        if (response.ok) {
            const datosMedications2 = await response.json();
            console.log("datosMedications2", datosMedications2)
            medicamentos = datosMedications2.entry.filter(medicamento => medicamento.resource && medicamento.resource.medicationCodeableConcept)
                .map(medicamento => ({
                    codeMedicamento: medicamento.resource.medicationCodeableConcept.coding[0].code,
                    medicamento: medicamento.resource.medicationCodeableConcept.coding[0].display

                }));
            return medicamentos
        } else if (response.status === 401) {
            console.log("Invalid API-KEY");
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

const obtenerCompositionAlergias2 = async (region, idComposition) => {
    try {
        const response = await configurarFetchCompositionAlergias(`${URL_BASE}/${region}/fhir/Composition?_id=${idComposition}${URL_FINAL_ALERGIAS}`);
        if (response.ok) {
            const datosAlergias2 = await response.json();
            console.log("datosAlergias2", datosAlergias2);
            const alergias = datosAlergias2.entry.filter(alergia =>
                (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) ||
                (alergia.resource.code?.text)
            ).map(alergia => {
                let display = null;
                let codeText = null;
                let code = null;

                // Intenta obtener el display desde extension
                if (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) {
                    display = alergia.resource.extension[0].valueCodeableConcept.coding[0].display;
                    //console.log("Display from extension:", display);
                } else {
                    //console.log("No display from extension");
                }

                // Si el display es "Medicamento", volverlo nulo
                if (display === "Medicamento") {
                    //console.log("Display from extension is 'Medicamento', setting to null");
                    display = null;
                }

                // Si el display es nulo, intenta obtenerlo desde code
                if (!display && alergia.resource.code?.text) {
                    display = alergia.resource.code?.text;
                } else if (!display) {
                    //console.log("No display from code");
                }

                // Si no se encontró en ninguno o es nulo, asigna un mensaje por defecto
                if (!display) {
                    display = "No relacionaron el display de la alergia";
                    //console.log("Default message:", display);
                }

                if (display) {
                    code = alergia.resource.extension[0].valueCodeableConcept.coding[0].code;
                    codeText = alergia.resource.code?.text;
                }

                return {
                    code: code,
                    alergia: display,
                    codeText: codeText
                };
            });
            return alergias;
        } else if (response.status === 401) {
            console.log("Invalid API-KEY");
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//obtenerInstitucion('2575400380');

const obtenerDiagnosticos2 = async (region, idComposition) => {
    try {
        const response = await configurarFetchDiagnosticos(`${URL_BASE}/${region}/fhir/Composition?_id=${idComposition}${URL_FINAL_DIAGNOSTICOS}`);
        if (response.ok) {
            const responseDiagnostico2 = await response.json();
            console.log("Diagnosticos", responseDiagnostico2)
            const diagnosticos2 = responseDiagnostico2.entry.filter(diagnostico => diagnostico.resource.code)
                .map(diagnostico => {
                    if (diagnostico.resource.code.coding[0].display) {
                        return {
                            codeDiagnostico: diagnostico.resource.code.coding[0].code,
                            diagnostico: diagnostico.resource.code.coding[0].display
                        };
                    } else {
                        return {
                            diagnostico: "No relacionaron el display del diagnostico"
                        };
                    }
                });
            return diagnosticos2;
        } else if (response.status === 401) {
            console.log("Invalid API-KEY");
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


const mostrarModalRda = async (composition, patient, code, value) => {
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('custom-notification');
    console.log("patientModal", patient)
    console.log("compositionModal", composition)


    let modalContent = document.getElementById("mostrarCompositions");
    modalContent.innerHTML = ''; // Limpiar contenido anterior

    if (!composition || !composition.idDocRef || !patient || !patient.id) {
        console.warn("Missing required data for modal.");
        modalContent.innerHTML = '<p>No hay información disponible para mostrar.</p>';
        return; // Exit function if data is missing
    }
    let edad = calcularEdad(patient.birthDate);
    let idDiscapacidad = null;
    let idGenero = null;
    let idPais = null;
    let idPaisResidencia = null;
    let idEtnia = null;
    let idZonaResidencia = null;
    let mensajesError = [];
    let ciudad = null;

    try {
        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idDiscapacidad = validarDiscapacidad(patient.extension[0].valueCodeableConcept.coding[0].code);
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.discapacidad'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.discapacidad'.");
            // Mostrar un mensaje al usuario o realizar otra acción
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idGenero = validarIdentidadGenero(patient.extension[1].valueCodeableConcept.coding[0].code);
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.genero'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.genero'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idPais = await obtenerPais(patient.extension[2].valueCodeableConcept.coding[0].code);
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.pais'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.pais'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idPaisResidencia = patient.address[0].country;
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.Residencia'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.Residencia'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idEtnia = await validarEtnia(patient.extension[3].valueCodeableConcept.coding[0].code)
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.Etnia'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.Etnia'.");
        }

        if (patient.extension && Array.isArray(patient.extension) && patient.extension.length > 0) {
            idZonaResidencia = await validarZonaResidencia(patient.address[0].extension[0].valueCodeableConcept.coding[0].code);
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
        }

        if (patient.address && Array.isArray(patient.address) && patient.extension.length > 0) {
            ciudad = patient.address[0].city;
        } else {
            //console.warn("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
            agregarMensajeError("La propiedad 'extension' no está presente o no es un array en 'patient.address.city'.");
        }


    } catch (error) {
        console.error("Error validating data:", error);
        mensajesError.push("Ocurrió un error al procesar la información del paciente.");
    }

    function agregarMensajeError(mensaje) {
        mensajesError.push(mensaje);
    }

    function mostrarNotificacion(mensaje) {
        notificationContainer.textContent = mensaje;
        document.body.appendChild(notificationContainer);

        // Ocultar la notificación después de unos segundos
        setTimeout(() => {
            notificationContainer.remove();
        }, 3000);
    }


    let content = `
            <div class="container-fluid">            
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <h5 class="text-muted">
                            * Esta información corresponde al DocumentReference almacenado en el Ministerio de Salud y Protección Social con el ID 
                            <span class="text-danger font-weight-bold">${composition.idDocRef}</span>
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
                                <p><strong>Género:</strong> ${patient.gender}</p>
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
                            ${composition.alergias.map(a => `
                                <li class="list-group-item">
                                    <span class="text-danger font-weight-bold">${a.code} - ${a.codeText}</span>
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
                            ${composition.diagnosticos.map(d => `
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
                            ${composition.medicamentos.map(m => `
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
                        <p><strong>Tipo de Documento:</strong> ${code}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Número de Documento:</strong> ${value}</p>
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


