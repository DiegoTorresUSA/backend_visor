import { Router } from 'express';
import { obtenerYConsultar, arrayDocumentReference, arrayObtenerTerritorioCompositions, obtenerMedicamentosDiagnosticosAlergias } from '../services/services.js'

const router = Router();

router.get('/documentReference', async (req, res) => {
    const documento = req.query.documento;
    const tipoDocumento = req.query.tipoDocumento;

    try {
        const { processedDocumentReferences, paciente, urlPatient } = await obtenerYConsultar(documento, tipoDocumento);
        const organizacionArregloDocReference = await arrayDocumentReference(processedDocumentReferences);
        const relacionTerritorioCompositions = await arrayObtenerTerritorioCompositions(processedDocumentReferences);
        const obtenerMedicamentosDiagnosticosAlergiasPaciente = await obtenerMedicamentosDiagnosticosAlergias(relacionTerritorioCompositions);

        res.json({ organizacionArregloDocReference, paciente, urlPatient, relacionTerritorioCompositions, obtenerMedicamentosDiagnosticosAlergiasPaciente });

    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json(
            {
                error: 'Error al obtener datos del paciente', details: error.message
            });
    }
});

export default router;