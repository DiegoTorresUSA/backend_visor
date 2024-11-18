import fetch from 'node-fetch';
import { apiKey, baseUrlRegion, baseUrlPrestador, fhirRegionId } from '../config/config.js';

const arrayRegiones = [
    { idRegion: "05", region: "Antioquia" },
    { idRegion: "68", region: "Santander" },
    { idRegion: "76", region: "Valle" },
    { idRegion: "50", region: "Meta" },
    { idRegion: "25", region: "Cundinamarca" },
    { idRegion: "11001", region: "Bogota" },
    { idRegion: "73", region: "Tolima" },
    { idRegion: "44", region: "Guajira" }
];

const extraerIdRegion = arrayRegiones.map(region => region.idRegion);

export const obtenerConteoDocument = async (region) => {
    try {
        const url = `${baseUrlRegion}${region}&_count=2000&_sort=-_lastUpdated`;
        console.log("url", url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (response.status === 401) {
            console.log("Unauthorized: Invalid API key");
            return null;
        }

        if (response.ok) {
            const datos = await response.json();
            console.log("datos", datos)
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
                //console.log("authorsWithNames", authorsWithNames);
            }

            // Actualiza arrayRegiones con el total de conteo para cada región
            const regionIndex = arrayRegiones.findIndex(r => r.idRegion === region);
            if (regionIndex !== -1) {
                arrayRegiones[regionIndex].total = total;
            }
            console.log("arrayRegiones", arrayRegiones);
            return arrayRegiones[regionIndex]; // Devuelve el objeto de la región actualizado
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

export const obtenerNombrePrestador = async (idPrestador) => {
    try {
        const response = await fetch(`${baseUrlPrestador}/${idPrestador}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        if (response.ok) {
            const datos = await response.json();
            const nombrePrestador = datos.name;
            return nombrePrestador;
        } else if (response.status === 401) {
            console.log("Unauthorized: Invalid API key");
        } else {
            console.log("Error:", response.statusText);
        }
        return null;
    } catch (error) {
        console.error('Error:', error);
    }
};

// Función principal para obtener el conteo de documentos de todas las regiones
export const obtenerConteoDocumentosPorRegion = async () => {
    const resultados = [];
    for (const region of extraerIdRegion) {
        const resultado = await obtenerConteoDocument(region);
        if (resultado) {
            resultados.push(resultado);
        }
    }
    return resultados;
};
