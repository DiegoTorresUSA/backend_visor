import { Router } from 'express';
const router = Router();
import { join } from 'path';


router.get('/', (req, res) => {
    res.json({'title': 'Hello World'});
     });

router.get('/test', (req, res) => {
    const data = {
        "name": "John",
        "website": "https://example.com"
    };
    res.json(data);
    });
    
router.get("/consulta", (req, res) => {
    res.sendFile(join(__dirname, "../pages/visor.html"));
});
    

     export default router;