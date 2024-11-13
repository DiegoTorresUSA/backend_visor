import { Router } from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.get('/', (req, res) => {
    res.json({'title': 'Hello World'});
     });


router.get("/consulta", (req, res) => {
    res.sendFile(join(__dirname, "../pages/visor.html"));
});
    

     export default router;