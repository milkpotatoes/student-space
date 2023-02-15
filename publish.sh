#! /bin/bash

npm install

function ConfirmPath() {
    Path=$1
    if [ -f "$Path" ]; then
        mv $Path "$Path.bak"
        mkdir -p $path
    else
        if [ -d "$Path" ]; then
            rm -rf $Path
        fi
        mkdir -p $Path
    fi
}

# modules Directory
ConfirmPath ./modules
rm -rf ./modules
ConfirmPath ./modules

# dexie module
ConfirmPath ./modules/dexie
cp ./node_modules/dexie/dist/modern/dexie.min.mjs ./modules/dexie/dexie.min.mjs

# eruda module with plugins
ConfirmPath ./modules/eruda
cp ./node_modules/eruda/eruda.js ./modules/eruda/eruda.js
cp ./node_modules/eruda-dom/eruda-dom.js ./modules/eruda/eruda-dom.js
cp ./node_modules/eruda-memory/eruda-memory.js ./modules/eruda/eruda-memory.js

# base64 module
ConfirmPath ./modules/js-base64
cp ./node_modules/js-base64/base64.mjs ./modules/js-base64/base64.mjs

# mdui module
ConfirmPath ./modules/mdui
# mdui css
ConfirmPath ./modules/mdui/css
cp ./node_modules/mdui/dist/css/mdui.min.css ./modules/mdui/css/mdui.min.css
cp ./node_modules/mdui/dist/css/mdui.min.css ./modules/mdui/css/mdui.min.css
# mdui fonts
ConfirmPath ./modules/mdui/fonts/roboto
ConfirmPath ./modules/mdui/fonts/roboto
cp ./node_modules/mdui/dist/fonts/roboto/*.woff ./modules/mdui/fonts/roboto/
cp ./node_modules/mdui/dist/fonts/roboto/*.woff2 ./modules/mdui/fonts/roboto/
# mdui fonts
ConfirmPath ./modules/mdui/icons/material-icons
cp ./node_modules/mdui/dist/icons/material-icons/*.woff ./modules/mdui/icons/material-icons/
cp ./node_modules/mdui/dist/icons/material-icons/*.woff2 ./modules/mdui/icons/material-icons/
# mdui javascript
ConfirmPath ./modules/mdui/js
cp ./node_modules/mdui/dist/js/mdui.esm.js ./modules/mdui/js/mdui.esm.js

# showdown modules
ConfirmPath ./modules/showdown/
cp ./node_modules/showdown/dist/showdown.min.js ./modules/showdown/showdown.min.js

# viewerjs module
ConfirmPath ./modules/viewerjs/
cp ./node_modules/viewerjs/dist/viewer.esm.js ./modules/viewerjs/viewer.esm.js
cp ./node_modules/viewerjs/dist/viewer.min.css ./modules/viewerjs/viewer.min.css
