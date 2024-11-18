import { Router } from 'express';
import { obtenerConteoDocumentosPorRegion, obtenerNombrePrestador } from '../services/servicesTablero.js'

const router = Router();

router.get('/conteoDocumentosRegiones', async (req, res) => {
    try {
        const conteoRegiones = await obtenerConteoDocumentosPorRegion();
        res.json(conteoRegiones);
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json(
            {
                error: 'Error al obtener datos del paciente', details: error.message
            });
    }

});

router.get('/nombrePrestador/:id', async (req, res) => {
    const idPrestador = req.params.id;
    try {
        const nombrePrestador = await obtenerNombrePrestador(idPrestador);
        res.json({ nombrePrestador });
    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json(
            {
                error: 'Error al obtener nombre del prestador',
                details: error.message
            });
    }
});

export default router;