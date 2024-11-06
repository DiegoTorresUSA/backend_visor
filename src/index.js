const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');

// Settings 
app.set('port', process.env.PORT || 3000);

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files
// Verificación de __dirname 
console.log('__dirname:', __dirname); 
// Ajuste de la ruta para archivos estáticos 
const publicDirectoryPath = path.resolve(__dirname, 'public'); 
console.log('Serving static files from:', publicDirectoryPath); 
app.use(express.static(publicDirectoryPath));

// Routes
app.use(require('./routes/index.js'));

// Inicializando el servidor
app.listen(app.get('port'), () => {
    console.log(`listening on port: ${app.get('port')}`);
});
