const { Router } = require('express');
const router = Router();
const path = require('path');


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
    res.sendFile(path.join(__dirname, "../pages/visor.html"));
});
    

     module.exports = router;