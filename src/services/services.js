import fetch from 'node-fetch';
import { baseUrl, fhirRegionId, apiKey } from '../config/config.js';


export const obtenerRegion = async (region) => {
    try {
        const url = `${baseUrl}/${fhirRegionId}/fhir/Organization/${region}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            },
            mode: "cors",
            cache: "default",
        });

        if (!response.ok) {
            throw new Error('No fue posible la conexión con el servidor.');
        }

        const datos = await response.json();

        if (!datos.name) {
            throw new Error(`No existe nombre para la región con ID: ${referenceRegion}`);
        }

        return datos.name; // Or throw an error if needed
    } catch (error) {
        console.error('Error:', error);
        return null; // Or throw an error if needed
    }
};

export const obtenerDocument = async (territorio, idComposition) => {
    try {
        const url = `${baseUrl}${territorio}/fhir/Composition/${idComposition}/$document`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "x-api-key": apiKey
            },
            mode: "cors",
            cache: "default"
        });

        if (response.status === 401) {
            throw new Error("Unauthorized: Invalid API key");
        }

        if (!response.ok) {
            throw new Error('No fue posible la conexión con el servidor.');
        }

        const datosDocument = await response.json();

        if (!datosDocument.entry || datosDocument.entry.length === 0) {
            console.log("No se encuentra la entry practitioner");
            return null;
        }

        const recursoPractitioner = datosDocument.entry.find(entry => entry.resource.resourceType === 'Practitioner');

        if (!recursoPractitioner) {
            console.log("No Existe recurso Practitioner");
            return null;
        }
        const code = recursoPractitioner.resource.identifier[0].type.coding[0].code;
        const value = recursoPractitioner.resource.identifier[0].value;
        // Retornar code y value
        return { code, value };

    } catch (error) {
        console.error('Error:', error);
        return null; // Or throw an error if needed
    }
};

export const extractDataFromUrl = (attachmentUrl) => {
    const [territorio, idComposition] = attachmentUrl.split("/").filter(part => !isNaN(part) && part.trim() !== '');
    return { territorio, idComposition };
};

export const obtenerDocumentReference = async (documento, tipoDocumento) => {

    try {
        const url = `${baseUrl}${fhirRegionId}/fhir/DocumentReference?patient.identifier=${documento}&patient.identifier-type=${tipoDocumento}&_count=800&_sort=-_lastUpdated`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            },
            mode: "cors",
            cache: "default",
        });

        if (!response.ok) throw new Error('No fue posible la conexión con el servidor.');

        if (response.status === 401) {
            throw new Error("Unauthorized: Invalid API key");
        }

        const datos = await response.json();

        if (datos.total === 0) {
            console.log('No existe información');
            return {
                processedDocumentReferences: [],
                urlPatient: '',
                idDocRef: ''
            };
        }

        if (datos.entry && datos.entry.length > 0) {
            const processedDocumentReferences = await Promise.all(
                datos.entry.map(async (entry) => {
                    // Create a closure function to capture entry for each iteration
                    const createDocumentObject = async () => {
                        let urlObjeto = entry.resource.subject.reference;
                        let urlExtraida = urlObjeto.substring(urlObjeto.indexOf('/', "https://".length));
                        const urlPatient = urlExtraida;
                        const urlPatientSinBarra = urlPatient.substring(1);
                        let region = entry.resource.custodian.reference;
                        let splitpartes = region.split('/');
                        let referenceRegion = splitpartes.pop();
                        const nombreRegion = await obtenerRegion(referenceRegion);
                        let fullUrlDocRef = entry.fullUrl;
                        let splitPartes = fullUrlDocRef.split("/");
                        const idDocRef = splitPartes.pop();
                        let attachmentUrl = entry.resource.content?.[0]?.attachment?.url;
                        const { territorio, idComposition } = extractDataFromUrl(attachmentUrl);
                        // Obtener el code y value del practitioner
                        const { code, value } = await obtenerDocument(territorio, idComposition);

                        return {
                            region: nombreRegion,
                            autor: entry.resource.author[0].display,
                            fecha: entry.resource.date,
                            idDocRef,
                            code,   // Practitioner code
                            value, // Practitioner value
                            urlPatientSinBarra
                        };
                    };
                    return await createDocumentObject();
                })
            );
            if (processedDocumentReferences && processedDocumentReferences.length > 0) {
                const idDocRef = processedDocumentReferences[0]?.idDocRef || '';
                console.log("idDocRef", idDocRef);
                const urlPatient = processedDocumentReferences[0]?.urlPatientSinBarra || '';

                return {
                    processedDocumentReferences,
                    urlPatient,
                    idDocRef
                };
            }
            console.log('No se encontraron DocumentReference');
            return null;
        }
    } catch (error) {
        console.error('Error detallado:', error);
        throw error;
    }
}

export const arrayDocumentReference = async (documentReference) => {
    const arregloReference = documentReference.map(entry => ({
        id: entry.idDocRef,
        fechaDocumentReference: entry.fecha,
        infoDocument: `${entry.region} - ${entry.autor} - ${entry.fecha}`,
        code: entry.code,    // Practitioner code
        value: entry.value,  // Practitioner value
    }));

    arregloReference.sort((a, b) => new Date(b.fechaDocumentReference) - new Date(a.fechaDocumentReference));
    return arregloReference;
}

export const arrayObtenerTerritorioCompositions = async (documentReference) => {
    try {
        const arregloReference = await Promise.all(
            documentReference.map(async entry => {
                let id = entry.idDocRef;
                try {
                    const url = `${baseUrl}${fhirRegionId}/fhir/DocumentReference/${id}`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'x-api-key': apiKey
                        },
                        mode: "cors",
                        cache: "default",
                    });
                    if (!response.ok) throw new Error('No fue posible la conexión con el servidor.');

                    if (response.status === 401) {
                        throw new Error("Unauthorized: Invalid API key");
                    }

                    const datos = await response.json();
                    if (datos.content && datos.content.length > 0 && datos.content[0].attachment.url) {
                        let fullUrl = datos.content[0].attachment.url;
                        let splitUrl = fullUrl.split("/");
                        let idComposition = splitUrl[6];
                        let region = splitUrl[3];

                        //const [medicamentos, alergias, diagnosticos] = await obtenerMedicamentosDiagnosticosAlergias(region, idComposition)

                        return {
                            "region": region,
                            "idComposition": idComposition,
                        };
                    }
                } catch (error) {
                    console.error('Error al obtener datos de DocumentReference:', error);
                    return null;
                }
            }));
        console.log("REgion - Compositions", arregloReference)
        return arregloReference.filter(item => item !== null);
    } catch (error) {
        console.error('Error al procesar arregloReference:', error);
        return [];
    }
}

export const obtenerMedicamentosDiagnosticosAlergias = async (arregloterritoriosComposition) => {
    // Mapea los territorios y composiciones para hacer múltiples solicitudes

    const results = await Promise.all(arregloterritoriosComposition.map(async (entry) => {
        let display = "";
        let code = "";
        let codeText = "";

        const url = `${baseUrl}${entry.region}/fhir/Composition/${entry.idComposition}/$document`;
        console.log("url", url)

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                },
                mode: "cors",
                cache: "default",
            });

            if (response.status === 401) {
                throw new Error("Unauthorized: Invalid API key");
            }

            if (!response.ok) {
                throw new Error('No fue posible la conexión con el servidor.');
            }

            const datos = await response.json();
            //console.log("Datos:", JSON.stringify(datos, null, 2));

            const medicamentos = datos.entry.filter(medicamento => medicamento.resource && medicamento.resource.medicationCodeableConcept)
                .map(medicamento => ({
                    codeMedicamento: medicamento.resource.medicationCodeableConcept.coding[0].code,
                    medicamento: medicamento.resource.medicationCodeableConcept.coding[0].display
                }));

            const alergias = datos.entry.filter(alergia => {
                const display = alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display || alergia.resource.code?.text;
                return display !== undefined;
            })
                .map(alergia => {
                    let display = null; // Intenta obtener el display desde extension 
                    if (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) { display = alergia.resource.extension[0].valueCodeableConcept.coding[0].display; } // Si el display es "Medicamento", volverlo nulo 
                    if (display === "Medicamento") { display = null; } // Si el display es nulo, intenta obtenerlo desde code 
                    if (!display && alergia.resource.code?.text) { display = alergia.resource.code.text; } // Si no se encontró en ninguno o es nulo, asigna un mensaje por defecto 
                    if (!display) { display = "No relacionaron el display de la alergia"; } // Asegúrate de que todas las propiedades existen antes de intentar acceder a ellas 
                    const code = alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.code || "N/A";
                    const codeText = alergia.resource.code?.text || "N/A";
                    return {
                        code,
                        display,
                        codeText
                    };
                });


            const diagnosticos = datos.entry.filter(diagnostico => diagnostico.resource && diagnostico.resource.code)
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
            console.log("diagnosticos", diagnosticos)
            return { medicamentos, alergias, diagnosticos };

        } catch (error) {
            console.error('Error al procesar resultados:', error);
            return { medicamentos: [], alergias: [], diagnosticos: [] };
        }
    }));
    const combinedResults = {
        medicamentos: results.flatMap(result => result.medicamentos),
        alergias: results.flatMap(result => result.alergias),
        diagnosticos: results.flatMap(result => result.diagnosticos)
    };
    console.log("combinedResults", combinedResults);
    return combinedResults;
}

export const obtenerInfoPaciente = async (urlPatient) => {
    try {
        const url = `${baseUrl}${urlPatient}`;
        console.log("url", url)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            },
            mode: "cors",
            cache: "default",
        });

        if (!response.ok) { throw new Error('Error al obtener datos del paciente.'); }

        const datosPatient = await response.json();
        return datosPatient;

    } catch (error) {
        console.error('Error detallado:', error); throw error;
    }
};

export const obtenerYConsultar = async (identificacion, tipoDocumento) => {
    try {
        const { processedDocumentReferences, urlPatient, idDocRef } = await obtenerDocumentReference(identificacion, tipoDocumento);

        if (!urlPatient) {
            return {
                processedDocumentReferences: [],
                urlPatient: '',
                paciente: null  // o {} dependiendo de la estructura que esperes para paciente
            };
        }

        const paciente = await obtenerInfoPaciente(urlPatient)
        return {
            processedDocumentReferences,
            urlPatient,
            paciente
        };

    } catch (error) {
        console.error('Error detallado:', error); throw error;
    }
};
/*ocultarSpinner();
await obtenerInfoPaciente(urlPatient);
 
if (idDocRef) {
    await obtenerComposition(idDocRef);
}*/
