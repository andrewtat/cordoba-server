const express = require('express');
const cors = require('cors');
var GoogleCloud = require('./GoogleCloud');
var Analyzer = require('./Analyzer');

const PORT = 5000;
const server = express();

server.use(express.json());
server.use(cors({origin: 'https://localhost:3000'}));

server.listen(PORT, () => {
    console.log('Cordoba server running on port ' + PORT + '.');
});

server.get('', (request, response) => {
    console.log('hi');
});

server.get('/analyzeimage', (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Content-Type', 'application/json');
    GoogleCloud.analyzeImage(request.query.media_url).then(results => response.send(results));
});

server.post('/instagrammedia', (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000');
    response.setHeader('Access-Control-Allow-Methods', 'POST');
    response.setHeader('Content-Type', 'application/json');
    Analyzer.analyzeImages(request.body).then(results => response.send(results));
});