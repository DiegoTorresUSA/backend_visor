import express from 'express';
import morgan from 'morgan';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

import documentReferenceRouter from './routes/documentReference.js';
import indexRouter from './routes/index.js';

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
const publicDirectoryPath = resolve(__dirname, 'public');
app.use(express.static(publicDirectoryPath));

// Routes
app.use('/', indexRouter);
app.use('/api', documentReferenceRouter);

// Start the server
app.listen(app.get('port'), () => {
  console.log(`Server listening on port ${app.get('port')}`);
});