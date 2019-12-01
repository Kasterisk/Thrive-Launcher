"use strict"

const fsExtra = require("fs-extra");
const path = require("path");

const {Progress} = require("./progress");
const {formatBytes} = require("./utils");

const movingFileModal = new Modal("movingFileModal", "movingFileModalDialog",
    {autoClose: false});

const getAllFiles = function(dirPath, arrayOfFiles) {
    const files = fsExtra.readdirSync(dirPath);
 
    arrayOfFiles = arrayOfFiles || [];
 
    files.forEach(function(file) {
        if (fsExtra.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    })
 
    return arrayOfFiles;
}

const getTotalSize = function(directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath);
   
    let totalSize = 0;
   
    arrayOfFiles.forEach(function(filePath) {
        totalSize += fsExtra.statSync(filePath).size;
    })
   
    return formatBytes(totalSize);
}

function moveInstalledFiles(files, destination){
    return new Promise((resolve, reject) => {
        let finished = false;

        let result = getTotalSize(String(files));

        movingFileModal.show();
        const content = document.getElementById("movingFileModalContent");
    
        content.textContent = "Moving files to: " + destination + " ...";
        content.append(document.createElement("br"));
        content.append(document.createTextNode("Total size: " + result));
        content.append(document.createElement("br"));
        content.append(document.createTextNode("This may take several minutes, " +
                                               "please be patient."));
    
        Promise.all(files.map((file) =>
        fsExtra.move(file, path.join(destination, path.basename(file))).then(() => {
            console.log("moved: " + path.basename(file));
        } ))).
        then(() =>{
            finished = true;
            movingFileModal.hide();
            resolve(finished);
        }).
        catch((err) => {
            movingFileModal.hide();
            showGenericError("Failed to move file(s): " + err.message);
            reject(err);
        });
    });
}

module.exports.moveInstalledFiles = moveInstalledFiles;
