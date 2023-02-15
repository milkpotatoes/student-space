function Confirm-Path {
    param ( $Path )
    if (Test-Path $Path) {
        if (-not (Test-Path $Path -PathType Container)) {
            # Write-Output "path: $Path is not directory"
            Move-Item -Path $Path -Destination "$Path.bak"
            $null = New-Item $Path -ItemType Directory
        }
    }
    else {
        # Write-Output "Path: $Path is not exsist"
        $null = New-Item $Path -ItemType Directory
    }
}

npm install

# modules Directory
Remove-Item -Path "./modules" -Force -Recurse
Confirm-Path -Path "./modules"

# dexie module
Confirm-Path -Path "./modules/dexie"
Copy-Item -Path "./node_modules/dexie/dist/modern/dexie.min.mjs" -Destination "./modules/dexie/dexie.min.mjs"

# eruda module with plugins
Confirm-Path -Path "./modules/eruda"
Copy-Item -Path "./node_modules/eruda/eruda.js" -Destination "./modules/eruda/eruda.js"
Copy-Item -Path "./node_modules/eruda-dom/eruda-dom.js" -Destination "./modules/eruda/eruda-dom.js"
Copy-Item -Path "./node_modules/eruda-memory/eruda-memory.js" -Destination "./modules/eruda/eruda-memory.js"

# base64 module
Confirm-Path -Path "./modules/js-base64"
Copy-Item -Path "./node_modules/js-base64/base64.mjs" -Destination "./modules/js-base64/base64.mjs"

# mdui module
Confirm-Path -Path "./modules/mdui"
# mdui css
Confirm-Path -Path "./modules/mdui/css"
Copy-Item -Path "./node_modules/mdui/dist/css/mdui.min.css" -Destination "./modules/mdui/css/mdui.min.css"
Copy-Item -Path "./node_modules/mdui/dist/css/mdui.min.css" -Destination "./modules/mdui/css/mdui.min.css"
# mdui fonts
Confirm-Path -Path "./modules/mdui/fonts/roboto"
Copy-Item -Path "./node_modules/mdui/dist/fonts/roboto/*.woff" -Destination "./modules/mdui/fonts/roboto/"
Copy-Item -Path "./node_modules/mdui/dist/fonts/roboto/*.woff2" -Destination "./modules/mdui/fonts/roboto/"
# mdui fonts
Confirm-Path -Path "./modules/mdui/icons/material-icons"
Copy-Item -Path "./node_modules/mdui/dist/icons/material-icons/*.woff" -Destination "./modules/mdui/icons/material-icons/"
Copy-Item -Path "./node_modules/mdui/dist/icons/material-icons/*.woff2" -Destination "./modules/mdui/icons/material-icons/"
# mdui javascript
Confirm-Path -Path "./modules/mdui/js"
Copy-Item -Path "./node_modules/mdui/dist/js/mdui.esm.js" -Destination "./modules/mdui/js/mdui.esm.js"

# showdown modules
Confirm-Path -Path "./modules/showdown/"
Copy-Item -Path "./node_modules/showdown/dist/showdown.min.js" -Destination "./modules/showdown/showdown.min.js"

# viewerjs module
Confirm-Path -Path "./modules/viewerjs/"
Copy-Item -Path "./node_modules/viewerjs/dist/viewer.esm.js" -Destination "./modules/viewerjs/viewer.esm.js"
Copy-Item -Path "./node_modules/viewerjs/dist/viewer.min.css" -Destination "./modules/viewerjs/viewer.min.css"

