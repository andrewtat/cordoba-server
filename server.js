const express = require('express');
var GoogleCloud = require('./GoogleCloud');

const PORT = 5000;
const server = express();

server.listen(PORT, () => {
    console.log('Cordoba server running on port ' + PORT + '.');
});

// server.use((request, response, next) => {
//     response.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
//     response.setHeader('Access-Control-Allow-Methods', 'GET');
//     response.setHeader('Access-Control-Allow-Headers',);
//     next();
// });

server.get('', (request, response) => {
    console.log('hi');
});

server.get('/analyzeimage', (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Content-Type', 'application/json');
    GoogleCloud.analyzeImage(request.query.media_url).then(results => response.send(results));
});

