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
        console.log("URL de la consulta:", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: { "x-api-key": apiKey },
            mode: "cors",
            cache: "default"
        });

        console.log("Response Status:", response.status);
        console.log("Response Headers:", response.headers.get("content-type"));

        // Obtener la respuesta en texto sin procesarla aún
        const rawResponse = await response.text();
        console.log("Raw Response:", rawResponse);

        // Validar que el Content-Type contenga "json"
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("json")) {
            console.warn("⚠️ Posible respuesta no válida, Content-Type:", contentType);
            throw new Error(`⚠️ El servidor devolvió una respuesta no válida (no es JSON).`);
        }

        // Convertir a JSON y retornar
        const data = JSON.parse(rawResponse);
        console.log("Response JSON:", data);

        if (!data.entry || data.entry.length === 0) {
            console.log("No se encuentra la entry practitioner");
            return null;
        }

        const recursoPractitioner = data.entry.find(entry => entry.resource.resourceType === 'Practitioner');
        if (!recursoPractitioner) {
            console.log("No Existe recurso Practitioner");
            return null;
        }
        const code = recursoPractitioner.resource.identifier[0].type.coding[0].code;
        const value = recursoPractitioner.resource.identifier[0].value;
        return { code, value };

        
    } catch (error) {
        console.error("Error en obtenerDocument:", error);
        return null;
    }
};

export const extractDataFromUrl = (attachmentUrl) => {
    const [territorio, idComposition] = attachmentUrl.split("/").filter(part => !isNaN(part) && part.trim() !== '');
    return { territorio, idComposition };
};

export const obtenerDocumentReference = async (documento, tipoDocumento) => {

    try {
        console.log("entre a traer los document reference",documento, tipoDocumento )
        const url = `${baseUrl}${fhirRegionId}/fhir/DocumentReference?patient.identifier=${documento}&patient.identifier-type=${tipoDocumento}&_count=800&_sort=-_lastUpdated`;
        console.log("url consulta Document Reference", url)
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            },
            mode: "cors",
            cache: "default",
        });

        if (!response.ok) {
            const data = await response.json();
            console.log("Response de la consulta", data);
            throw new Error(`⚠️ Error en la consulta: ${response.status} - ${response.statusText}`);
        }
        
        
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
            console.log("datos", datos)
            const processedDocumentReferences = await Promise.all(
                datos.entry.map(async (entry) => {
                    // Create a closure function to capture entry for each iteration
                    const createDocumentObject = async () => {
                        console.log("datos.entry", datos.entry)
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
                        console.log("attachmentUrl", attachmentUrl)
                        const { territorio, idComposition } = extractDataFromUrl(attachmentUrl);
                        console.log("territorio fuera del extractDataFromUrl ", territorio)
                        console.log("territorio fuera del extractDataFromUrl ", idComposition)
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
                const code = processedDocumentReferences[0]?.code || '';
                const value = processedDocumentReferences[0]?.value || '';
                const urlPatient = processedDocumentReferences[0]?.urlPatientSinBarra || '';

                return {
                    processedDocumentReferences,
                    urlPatient,
                    idDocRef,
                    code,   // Practitioner code
                    value, // Practitioner value
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
        return arregloReference.filter(item => item !== null);
    } catch (error) {
        console.error('Error al procesar arregloReference:', error);
        return [];
    }
}

export const obtenerMedicamentosDiagnosticosAlergias = async (arregloterritoriosComposition) => {
    // Mapea los territorios y composiciones para hacer múltiples solicitudes

    const results = await Promise.all(arregloterritoriosComposition.map(async (entry) => {
        const url = `${baseUrl}${entry.region}/fhir/Composition/${entry.idComposition}/$document`;

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

            const medicamentos = datos.entry.filter(medicamento => medicamento.resource && medicamento.resource.medicationCodeableConcept)
                .map(medicamento => ({
                    codeMedicamento: medicamento.resource.medicationCodeableConcept.coding[0].code,
                    medicamento: medicamento.resource.medicationCodeableConcept.coding[0].display
                }));

            const alergias = datos.entry.filter(alergia => {
                const display = alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display || alergia.resource.code?.text;
                return display !== undefined;
            }).map(alergia => {
                let display = null; // Intenta obtener el display desde extension 
                if (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) {
                    display = alergia.resource.extension[0].valueCodeableConcept.coding[0].display;
                } // Si el display es "Medicamento", volverlo nulo 
                if (display === "Medicamento") {
                    display = null;
                } // Si el display es nulo, intenta obtenerlo desde code 
                if (!display && alergia.resource.code?.text) {
                    display = alergia.resource.code.text;
                } // Si no se encontró en ninguno o es nulo, asigna un mensaje por defecto 
                if (!display) {
                    display = "No relacionaron el display de la alergia";
                } // Asegúrate de que todas las propiedades existen antes de intentar acceder a ellas 

                const code = alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.code || "N/A";
                const codeText = alergia.resource.code?.text || "N/A";

                return {
                    code,
                    display,
                    codeText
                };
            });

            const diagnosticos = datos.entry.filter(diagnostico =>
                diagnostico.resource?.resourceType === "Condition" &&
                diagnostico.resource.code?.coding?.[0]?.code &&
                diagnostico.resource.code?.coding?.[0]?.display)
                .map(diagnostico => ({
                    codeDiagnostico: diagnostico.resource.code.coding[0].code || "N/A",
                    diagnostico: diagnostico.resource.code.coding[0].display || "N/A"
                }));
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
    return combinedResults;
}

export const obtenerInfoPaciente = async (urlPatient) => {
    try {
        const url = `${baseUrl}${urlPatient}`;
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
        console.log("Entre a obtener y Consultar", identificacion, tipoDocumento);

        const { processedDocumentReferences = [], urlPatient, idDocRef } = await obtenerDocumentReference(identificacion, tipoDocumento);
        console.log("processedDocumentReferences", processedDocumentReferences)

        if (!Array.isArray(processedDocumentReferences)) {
            console.error("⚠️ processedDocumentReferences no es un array:", processedDocumentReferences);
            return {
                processedDocumentReferences: [],
                urlPatient: '',
                paciente: null  
            };
        }
        //console.log("documentReferenceData", documentReferenceData)

        if (!processedDocumentReferences || processedDocumentReferences.length === 0) {
            console.warn("⚠️ No se encontraron DocumentReferences");
            return {
                processedDocumentReferences: [],
                urlPatient: '',
                paciente: null  
            };
        }


        if (!urlPatient) {
            console.warn("⚠️ No se encontró información del paciente.");
            return {
                processedDocumentReferences,
                urlPatient: '',
                paciente: null
            };
        }

        const paciente = await obtenerInfoPaciente(urlPatient);
        
        return { processedDocumentReferences, urlPatient, paciente, idDocRef };

    } catch (error) {
        console.error("Error en obtenerYConsultar:", error.message);
        throw error;
    }
};



