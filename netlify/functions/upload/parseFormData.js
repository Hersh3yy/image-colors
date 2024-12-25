const Busboy = require('busboy');

const parseFormData = (event) => {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: event.headers });
        const result = {};
        let fileBuffer;

        console.log("Starting form parsing...");

        // Log the content type of the incoming request
        console.log("Incoming request content type:", event.headers['content-type']);

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            console.log(`File [${fieldname}] received: ${filename}`);
            fileBuffer = [];
            file.on('data', (data) => {
                fileBuffer.push(data);
            });
            file.on('end', () => {
                console.log(`File [${fieldname}] finished: ${filename}`);
                result.file = Buffer.concat(fileBuffer); // Combine the file data into a single Buffer
                result.filename = filename;
                result.contentType = mimetype;
            });
        });

        busboy.on('field', (fieldname, val) => {
            console.log(`Field [${fieldname}]: ${val}`);
            result[fieldname] = val; // Store the field value
        });

        busboy.on('finish', () => {
            console.log("Busboy parsing finished:", result);
            if (!result.file) {
                console.error("No files found in the request.");
                return reject(new Error("No files found in the request."));
            }
            resolve(result);
        });

        busboy.on('error', (error) => {
            console.error("Error parsing form data:", error);
            reject(error);
        });

        // Read the raw body from the event
        const rawBody = event.body; // Get the raw body from the event
        busboy.end(Buffer.from(rawBody, 'base64')); // End the busboy stream with the raw body
    });
};

module.exports = parseFormData;