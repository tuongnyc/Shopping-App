const fs = require('fs');

const deleteFile = (filePath) => {
    // delete a file.
    fs.unlink(filePath, (error) => {
        if(error) {
            throw (error);
        }
    });
}

exports.deleteFile = deleteFile;