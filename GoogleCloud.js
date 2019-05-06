var GraphAPI = require('./GraphAPI');
const fetch = require('node-fetch');
require('dotenv').config();

const GoogleCV = {
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
    endpoint: 'https://vision.googleapis.com/v1/images:annotate?key=',
    imageCap: 10
}

// ---------- PUBLIC ------------

/**
 * Returns Google Cloud Vision analysis of the Instagram image at imageURL.
 * @param {string} imageURL The media_url of the Instagram image
 */
async function analyzeImage(imageURL) {
    var requestsList = await buildRequestsListJSON(imageURL);
    const request = new fetch.Request(GoogleCV.endpoint + GoogleCV.apiKey, {method: 'POST', body: JSON.stringify(requestsList)});
    return await fetch(request)
        .then(response => response.json())
        .then(results => {
            return results;
        })
        .catch(error => {
            console.log("There was an error while retrieving results from Google Cloud: " + error);
        });
}

exports.analyzeImage = analyzeImage;

// ------------ Facebook Graph API ------------------



// ------------ PRIVATE ----------------

/**
 * Returns a JSON object representing the Google Cloud Vision request payload
 * @param {string} imageURL The media_url of the Instagram image
 */
async function buildRequestsListJSON(imageURL) {
    var requests = await buildRequestsJSON(imageURL);
    const requestsList = {
        requests: requests
    };
    return requestsList;
}

/**
 * Returns a JSON object representing the singular image request for Google Cloud Vision
 * @param {string} imageURL The media_url of the Instagram image
 */
async function buildRequestsJSON(imageURL) {
    var requests = [];
    const image = await buildImageRequestJSON(imageURL);
    requests.push(image);
    return requests;
}

/**
 * Returns a JSON object with the Instagram image in base64 representation
 * @param {string} imageURL The media_url of the Instagram image
 */
async function buildImageRequestJSON(imageURL) {
    var imageBuffer = await retrieveInstagramImageAsImageBuffer(imageURL); // Get image from Facebook in image buffer format
    var base64Image = convertImageBytesToBase64(imageBuffer); // Convert image buffer to base64

    // Construct image JSON using base64 image
    const image = {
        image: {
            content: base64Image
        },
        features: [
            {
                type: "LABEL_DETECTION",
                maxResults: 3
            }, 
            {
                type: "IMAGE_PROPERTIES"
            },
            {
                type: "FACE_DETECTION"
            }
        ]
    };
    return image;
}

/**
 * Returns an array buffer representing the image sourced from Instagram via imageURL
 * @param {string} imageURL The media_url of the Instagram image
 */
async function retrieveInstagramImageAsImageBuffer(imageURL) {
    return await fetch(imageURL)
        .then(response => {
            if (response.ok) {
                return response.arrayBuffer();
            } else {
                throw new Error('Network response was not ok.');
            }                
        })
        .catch(error => {
            console.log('There has been a problem with your Instagram image fetch operation: ', error.message);
        });
}

/**
 * Returns a base64 image converted from its array buffer representation
 * @param {int[]} imageBuffer  The image in array buffer representation
 */
function convertImageBytesToBase64(imageBuffer) {
    var binary = '';
    var imageBytes = new Uint8Array(imageBuffer);
    var imageLength = imageBytes.byteLength;
    for ( var i = 0; i < imageLength; i++) {
        binary += String.fromCharCode(imageBytes[i]);
    }
    return Buffer.from(binary, 'binary').toString('base64');
}