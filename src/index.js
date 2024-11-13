import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import documentReferenceRouter from './routes/documentReference.js';
import indexRoutes from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
// Settings
app.set('port', process.env.PORT || 3000);

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRoutes);
app.use('/visor', documentReferenceRouter);

// Start the server
app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${app.get('port')}`);
});