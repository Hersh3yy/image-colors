const Busboy = require('busboy');

const parseFormData = (event) => {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: event.headers });
        const result = {};
        let fileBuffer;

        console.log("Starting form parsing with headers:", event.headers);

        busboy.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType } = info;
            console.log(`Processing file: `, {
                fieldname,
                filename,
                encoding,
                mimeType,
            });

            fileBuffer = [];
            let totalSize = 0;

            file.on('data', (data) => {
                fileBuffer.push(data);
                totalSize += data.length;
                console.log(`Received chunk of size: ${data.length}, Total size: ${totalSize}`);
            });

            file.on('end', () => {
                console.log(`File processing complete:`, {
                    filename,
                    totalSize,
                });
                result.file = Buffer.concat(fileBuffer);
                result.filename = filename; // Use the actual filename
                result.contentType = mimeType;
            });
        });

        busboy.on('field', (fieldname, val) => {
            console.log(`Received field: ${fieldname} = ${val}`);
            result[fieldname] = val;
        });

        busboy.on('finish', () => {
            console.log("Form parsing complete:", {
                filename: result.filename,
                contentType: result.contentType,
                fileSize: result.file?.length || 0,
            });
            
            if (!result.file) {
                return reject(new Error("No files found in the request."));
            }
            resolve(result);
        });

        busboy.on('error', (error) => {
            console.error("Busboy error:", error);
            reject(error);
        });

        const rawBody = event.body;
        busboy.end(Buffer.from(rawBody, 'base64'));
    });
};

module.exports = parseFormData;