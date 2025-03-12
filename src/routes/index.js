import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.get('/', (req, res) => {
    res.json({ 'title': 'Hello World' });
});

router.get("/consulta", (req, res) => {
    res.sendFile(join(__dirname, "../pages/visor.html"));
});

router.get("/tableroControl", (req, res) => {
    res.sendFile(join(__dirname, "../pages/tableroControl.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(join(__dirname, "../pages/login.html"));
});

export default router;