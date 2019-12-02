/**
 * Helpers for moving installed thrive files.
 */
"use strict"

const fsExtra = require("fs-extra");
const path = require("path");

const {formatBytes} = require("./utils");

const {Modal, showGenericError} = require("./modal");
const movingFileModal = new Modal("movingFileModal", "movingFileModalDialog", {
    autoClose: false
});

/**
 * Check all subdirectories and files recursively
 * And add them to an array of files
*/
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

/* Combine all of the file sizes from the array */
const getTotalSize = function(directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath);
   
    let totalSize = 0;
   
    arrayOfFiles.forEach(function(filePath) {
        totalSize += fsExtra.statSync(filePath).size;
    })
   
    return totalSize;
}

/* Move the requested files with promise */
function moveInstalledFiles(files, destination){
    return new Promise((resolve, reject) => {
        let totalVersionsSize = 0;

        // Get the files size and sum the total size
        // of each installed Thrive folders
        files.forEach(function(file) {
            let result = getTotalSize(String(file));
            totalVersionsSize += result;
        });

        console.log("Total versions size: " + formatBytes(totalVersionsSize));

        // Handle the popup
        movingFileModal.show();
        const content = document.getElementById("movingFileModalContent");
    
        content.innerHTML = "Moving all installed files to " + destination + " ...";
        content.append(document.createElement("br"));
        content.append(document.createTextNode("Total size: " + formatBytes(totalVersionsSize)));
        content.append(document.createElement("br"));
        content.append(document.createTextNode("This may take several minutes, " +
                                               "please be patient."));
        
        const ring = document.createElement("div");
        ring.classList.add("loading-ring");
        content.append(ring);

        // Move process
        Promise.all(files.map((file) =>
        fsExtra.move(file, path.join(destination, path.basename(file))).then(() => {
            console.log("moved: " + path.basename(file));
        } ))).
        then(() =>{
            content.textContent = "Finished moving (" + files.length + ") items.";

            // Only create the close button after finished
            const closeContainer = document.createElement("div");
            closeContainer.style.marginTop = "10px";
            closeContainer.style.textAlign = "center";
            const close = document.createElement("div");
            close.textContent = "Close";
            close.className = "CloseButton";

            close.addEventListener("click", () => {
                movingFileModal.hide();
            });

            closeContainer.append(close);
            content.append(closeContainer);
            
            resolve();
        }).
        catch((err) => {
            movingFileModal.hide();
            showGenericError("Failed to move file(s): " + err.message);
            reject(err);
        });
    });
}

module.exports.moveInstalledFiles = moveInstalledFiles;
