import express, { Router } from 'express';
import fetch from 'node-fetch';
import { baseUrl, fhirRegionId, apiKey } from '../config/config.js';

const router = Router();

router.get('/documentReference', async (req, res) => {
    const documento = '52700583';
    const tipoDocumento = 'CC';

    try {
        const url = `${baseUrl}${fhirRegionId}/fhir/DocumentReference?patient.identifier=${documento}&patient.identifier-type=${tipoDocumento}&_count=800&_sort=-_lastUpdated`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': `${apiKey}`
            },
            mode: "cors",
            cache: "default",
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const datos = response.json();
        res.json(datos);
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ error: 'Error al obtener datos del paciente' });
        }
});

export default router;