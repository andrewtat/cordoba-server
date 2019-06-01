var GoogleCloud = require('./GoogleCloud');

// ---------- PUBLIC ------------

async function analyzeImages(media) {
    var images = await packageImages(media, 25);
    return processImageAnalyses(images);
}

exports.analyzeImages = analyzeImages;

// ---------- PRIVATE ------------

async function packageImages(media, imageCap) {
    const endIndex = (imageCap > media.length) ? media.length: imageCap;
    
    const images = media.slice(0, endIndex).map(async post => {
        // Create JSON object with media metadata and JSON analysis
        return await GoogleCloud.analyzeImage(post.media_url)
            .then(response => {
                var image = {
                    instagramID: post.id,
                    likesCount: post.like_count,
                    timestamp: post.timestamp,
                    imageURL: post.media_url,
                    analysis: response.responses[0]
                };
                return image;
            });
    });
    return await Promise.all(images);
}

function processImageAnalyses(images) {
    var helpers = {
        likelihoodWeights: [ // Declare likelihoodWeights once here so it's not instantiated every time in the upcoming forEach loop
            {
                name: "UNKNOWN",
                value: 0
            },
            {
                name: "VERY_UNLIKELY",
                value: 0
            },
            {
                name: "UNLIKELY",
                value: 0
            },
            {
                name: "POSSIBLE",
                value: 1
            },
            {
                name: "LIKELY",
                value: 2
            },
            {
                name: "VERY_LIKELY",
                value: 3
            },
        ],
        uniqueLabels: new Set(),
        dominantColors: [],
        faces: {
            count: 0,
            emotions: {
                anger: 0,
                joy: 0,
                sorrow: 0,
                surprise: 0
            },
            otherAttributes: {
                blurred: 0,
                headwear: 0,
                underexposed: 0
            },
            angle: {
                panSum: 0,
                rollSum: 0,
                tiltSum: 0
            },
            confidenceSum: 0,
            bounds: [ // Starts in the top-left and goes clockwise
                { // 0: upper-left
                    xFractionSum: 0,
                    yFractionSum: 0
                },
                { // 1: upper-right
                    xFractionSum: 0,
                    yFractionSum: 0
                },
                { // 2: lower-right
                    xFractionSum: 0,
                    yFractionSum: 0
                },
                { // 3: lower-left
                    xFractionSum: 0,
                    yFractionSum: 0
                }
            ]
        }
    }

    images.forEach(image => {
        // Process faceAnnotations if they exist
        if (image.analysis.faceAnnotations) {
            processFaceAnnotation(image.analysis.faceAnnotations[0], helpers);
        }

        // Process colors
        const imageColors = image.analysis.imagePropertiesAnnotation.dominantColors.colors;
        helpers.dominantColors.push(findMostDominantColor(imageColors));

        // Process labelAnnotations
        processLabelAnnotations(image.analysis.labelAnnotations, helpers);
    });

    var result = {
        mostCommonEmotion: (helpers.faces.count > 0) ? getMostCommonEmotion(helpers.faces.emotions) : null,
        mostDominantColor: findMostDominantColor(helpers.dominantColors),
        mostCommonSubjects: getNthHighestLabels(helpers.uniqueLabels, 3)
    };

    return result;
}

/**
 * Processes a faceAnnotation object via likelihoodWeights and updates results in helpers
 * @param {*} faceAnnotation 
 * @param {*} helpers 
 * @param {*} likelihoodWeights 
 */
function processFaceAnnotation(faceAnnotation, helpers) {
    // Increase face count
    helpers.faces.count++;

    // Process likelihoods
    helpers.faces.emotions.anger += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.angerLikelihood))[0].value;
    helpers.faces.emotions.joy += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.joyLikelihood))[0].value;
    helpers.faces.emotions.sorrow += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.sorrowLikelihood))[0].value;
    helpers.faces.emotions.surprise += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.surpriseLikelihood))[0].value;

    helpers.faces.otherAttributes.blurred += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.blurredLikelihood))[0].value;
    helpers.faces.otherAttributes.headwear += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.headwearLikelihood))[0].value;
    helpers.faces.otherAttributes.underexposed += helpers.likelihoodWeights.filter((weight) => (weight.name === faceAnnotation.underExposedLikelihood))[0].value;

    // Process confidence
    helpers.faces.confidenceSum += faceAnnotation.detectionConfidence;

    // Process angle
    helpers.faces.angle.panSum += faceAnnotation.panAngle;
    helpers.faces.angle.rollSum += faceAnnotation.rollAngle;
    helpers.faces.angle.tiltSum += faceAnnotation.tiltAngle;
    
    // Process bounds
    
}

/**
 * Returns the most dominant color JSON out of the passed in colors array
 * @param {Array} colors An array of color JSON objects
 */
function findMostDominantColor(colors) {
    var mostDominantColor = colors.reduce((highestFraction, color) => {
        return (highestFraction.pixelFraction || 0) > color.pixelFraction ? highestFraction : color;
    });
    return mostDominantColor;
}

function processLabelAnnotations(labelAnnotations, helpers) {
    for(var i = 0; i < labelAnnotations.length; i++) {
        if (!helpers.uniqueLabels.has(labelAnnotations[i])) {
            helpers.uniqueLabels.add(labelAnnotations[i]);
        }
    }
}

/**
 * Returns the emotion with the highest count, breaking ties in alphabetical order
 * @param {Object} emotions JSON object storing counts of emotions
 */
function getMostCommonEmotion(emotions) {
    return Object.keys(emotions).reduce((currentMostCommon, emotion) => emotions[currentMostCommon] > emotions[emotion] ? currentMostCommon : emotion);
}

function getNthHighestLabels(labels, n) {
    const sortedLabels = Array.from(labels).sort((previous, current) => { 
        return (current.topicality > previous.topicality) ? current : previous;
    });
    return sortedLabels.slice(0, n);
}