'use strict';

// Page Builder V2 - Catalyst Advanced I/O function.
//
//   /p/:slug          published landing pages (public HTML)
//   /api/public/*     runtime script, lead capture, OTP, pincode (public)
//   /api/*            app API (signed-in Catalyst users, role-checked)

const express = require('express');
const fileUpload = require('express-fileupload');
const { attachCatalyst } = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const publicController = require('./controllers/public.controller');
const publicRoutes = require('./routes/public.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Page documents (GrapesJS project JSON + HTML) can be large.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(fileUpload({ limits: { fileSize: 10 * 1024 * 1024 }, abortOnLimit: true, responseOnLimit: 'Images must be under 10 MB' }));
app.use(attachCatalyst);

app.get('/', (req, res) => res.json({ success: true, service: 'page-builder-v2' }));
app.get('/p/:slug', publicController.publishedPage);
app.use('/api/public', publicRoutes);
app.use('/api', apiRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));
app.use(errorHandler);

module.exports = app;
