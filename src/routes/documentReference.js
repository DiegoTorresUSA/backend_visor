import { Router } from 'express';
import { obtenerYConsultar, arrayDocumentReference, arrayObtenerTerritorioCompositions, extractDataFromUrl } from '../services/services.js'
import { baseUrl, fhirRegionId, apiKey } from '../config/config.js';

const router = Router();

router.get('/documentReference', async (req, res) => {
    const documento = req.query.documento;
    const tipoDocumento = req.query.tipoDocumento;
    
    console.log("Documento recibido:", documento);
    console.log("Tipo de documento recibido:", tipoDocumento);

    try {
        const { processedDocumentReferences, paciente, urlPatient } = await obtenerYConsultar(documento, tipoDocumento);
        const organizacionArregloDocReference = await arrayDocumentReference(processedDocumentReferences);
        const relacionTerritorioCompositions = await arrayObtenerTerritorioCompositions(processedDocumentReferences);

        res.json({ organizacionArregloDocReference, paciente, urlPatient });

    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json(
            {
                error: 'Error al obtener datos del paciente', details: error.message
            });
    }
});


//endpoint para extraer del DocumentReference, el territorio y idComposition, para lanzar la consulta
// hacia $document y extraer alergias, medicamentos y diagnosticos

router.get('/obtenerDatosComposition/:idDocRef', async (req, res) => {
    const idDocRef = req.params.idDocRef;

    try {
        const url = `${baseUrl}${fhirRegionId}/fhir/DocumentReference/${idDocRef}`;
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

        // Extrae idTerritorio y idComposition
        const data = await response.json();
        const attachmentUrl = data.content?.[0]?.attachment?.url;
        const { territorio, idComposition } = extractDataFromUrl(attachmentUrl);

        // Usa idTerritorio e idComposition para obtener Composition
        const compositionResponse = await fetch(`${baseUrl}${territorio}/fhir/Composition/${idComposition}/$document`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            },
            mode: "cors",
            cache: "default",
        });

        const datosCompositionResponse = await compositionResponse.json();

        const medicamentos = datosCompositionResponse.entry.filter(medicamento => medicamento.resource.resourceType === 'MedicationStatement')
            .map(medicamento => ({
                codeMedicamento: medicamento.resource.medicationCodeableConcept.coding[0].code,
                medicamento: medicamento.resource.medicationCodeableConcept.coding[0].display
            }));

        const alergias = datosCompositionResponse.entry
            .filter(alergia => {
                return alergia.resource.resourceType === 'AllergyIntolerance';
            })
            .map(alergia => {
                let display = null;
                // Intenta obtener el display desde extension 
                if (alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.display) {
                    display = alergia.resource.extension[0].valueCodeableConcept.coding[0].display;
                }

                // Si el display es "Medicamento", volverlo nulo 
                if (display === "Medicamento") {
                    display = null;
                }

                // Si el display es nulo, intenta obtenerlo desde code 
                if (!display && alergia.resource.code?.text) {
                    display = alergia.resource.code.text;
                }

                // Si no se encontró en ninguno o es nulo, asigna un mensaje por defecto 
                if (!display) {
                    display = "No relacionaron el display de la alergia";
                }

                // Asegúrate de que todas las propiedades existen antes de intentar acceder a ellas 

                const code = alergia.resource.extension?.[0]?.valueCodeableConcept?.coding?.[0]?.code || "N/A";
                const codeText = alergia.resource.code?.text || "N/A";

                return {
                    code,
                    display,
                    codeText
                };
            });

        if (alergias.length === 0) {
            console.error("No existe estructura de 'AllergyIntolerance'");
        }

        const diagnosticos = datosCompositionResponse.entry.filter(diagnostico =>
            diagnostico.resource?.resourceType === "Condition" &&
            diagnostico.resource.code?.coding?.[0]?.code &&
            diagnostico.resource.code?.coding?.[0]?.display)
            .map(diagnostico => ({
                codeDiagnostico: diagnostico.resource.code.coding[0].code || "N/A",
                diagnostico: diagnostico.resource.code.coding[0].display || "N/A"
            }));

        res.json({ medicamentos, alergias, diagnosticos });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al obtener los datos");
    }
});


export default router;