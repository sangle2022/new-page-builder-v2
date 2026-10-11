'use strict';

// Catalyst Advanced I/O entry point. Catalyst strips the
// "/server/<function_name>" prefix, so the Express app sees paths like
// "/api/pages" and "/p/my-page".
module.exports = require('./src/app');
