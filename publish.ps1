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


if (-not (Get-Command npm -errorAction SilentlyContinue)) {
    Write-Output "No Node.js found, go to https://nodejs.org/en/ download Node.js and install "
    exit 1
}

Write-Output "Updating node modules..."
npm install 

if (-not (Get-Command uglifyjs -errorAction SilentlyContinue)) {
    Write-Output "Please open Powershell as Administrator and run 'npm install uglify -g'"
    exit 1
}

Write-Output "Making pure modules..."
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

Write-Output "Minifing resource..."

function createTempFile {
    param (
        $Path
    )

    $temp_file = $Path -replace "^(.+[\\\/])([^\\\/]+)(\.\w+)$", '$1$2.temp$3'
    
    if ( Test-Path($temp_file)) {
        Remove-Item -Path $temp_file
    }
    Copy-Item -Path $Path -Destination $temp_file 
}

function editTempFile {
    param (
        $file
    )
    $temp_file = $file -replace "\.(\w+?)$", '.temp.$1'
    $mini_file = $file -replace "\.(\w+?)$", '.min.$1'
    $content = Get-Content $temp_file -Encoding utf8
    foreach ($name in $files_path) {
        $file_name = $name -split "[\\\/]"
        # Write-Output $file_name
        $file_name = $file_name[$file_name.Length - 1]
        $mini_file_name = $file_name -replace "\.(\w+?)$", '.min.$1'
        # Write-Output $name
        # Write-Output $mini_file
        # Write-Output $file_name
        $content = $content.Replace($file_name, $mini_file_name)
    }
    Set-Content -Path $temp_file -Value $content -Encoding utf8
    if ( $file -match "\.js$") {
        $null = uglifyjs $temp_file -o $mini_file 
        Remove-Item -Path $temp_file
    }
}

function editHtmlFile {
    param (
        $path
    )
    $temp_file = $path -replace "\.(\w+?)$", '.temp.$1'
    if (Test-Path(".\frontjs")) {
        $content = Get-Content $temp_file -Encoding utf8
        $frontjs = Get-Content ".\frontjs" -Encoding UTF8
        $content = $content.Replace("<!-- frontjs-script -->", $frontjs)
        $bdtongji = Get-Content ".\bdtongji" -Encoding UTF8
        $content = $content.Replace("<!-- bdtongji-script -->", $bdtongji)
        $360fenxi = Get-Content ".\360fenxi" -Encoding UTF8
        $content = $content.Replace("<!-- 360fenxi-script -->", $360fenxi)
        Set-Content -Path $temp_file -Value $content -Encoding utf8
    }
    editTempFile $path
} 

$files_path = New-Object System.Collections.ArrayList


function createTempFiles {
    param (
        $floder
    )
    
    $lists = Get-ChildItem $floder -Exclude @("*.min.*", "*.temp.*")
    foreach ( $file in $lists) {
        createTempFile "$file"
        $null = $files_path.Add( "$file")
    }
} 

createTempFiles ".\js"

foreach ($temp_file in $files_path) {
    editTempFile $temp_file
}

createTempFile ".\index.html"
if ( -not( Test-Path ".\index.html.bak")) {
    Copy-Item -Path ".\index.html" -Destination ".\index.html.bak"
}

editHtmlFile ".\index.html"

if ( $args[0] -eq "build" ){
    $time_stamp = (([DateTime]::Now.ToUniversalTime().Ticks - 621355968000000000)/10000000).tostring().Substring(0,10)
    Move-Item -Path ".\index.html" -Destination "./index-$time_stamp.html.bak"
    Move-Item -Path ".\index.temp.html" ".\index.html"
}