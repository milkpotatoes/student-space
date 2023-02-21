#! /bin/bash

build="$1"
index=1

if ! command -v node >/dev/null 2>&1; then
    echo "No Node.js found, go to https://nodejs.org/ download Node.js and install "
    echo "If you are Ubuntu user, you can try 'sudo apt install nodejs' to install"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "No npm found, go to https://nodejs.org/ download Node.js and install "
    echo "If you are Ubuntu user, you can try 'sudo apt install npm' to install"
    exit 1
fi

if ! command -v uglifyjs >/dev/null 2>&1; then
    echo "Command not found: uglifyjs"
    echo "Trying to install..."
    echo "Please enter your password"
    sudo npm install uglify-js -g
    exit 1
fi

echo "Updating node modules..."
# npm install

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

echo "Making pure modules..."

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

function createTempFile() {
    Path=$1
    temp_file=$(echo "$Path" | sed "s/\([^\\/]\+\)\.\(\w\+\)$/\1.temp.\2/g")
    echo "$Path"

    if [ -f $temp_file ]; then
        echo "temp file deleted"
        rm $temp_file
    fi
    cp "$Path" "$temp_file"
}

function editTempFile() {
    file=$1
    temp_file=$(echo "$file" | sed "s/\.\(\w\+\?\)$/.temp.\1/g")
    mini_file=$(echo "$file" | sed "s/\.\(\w\+\?\)$/.min.\1/g")
    for name in ${files_path[@]}; do
        readarray -d / -t file_name <<<$name
        file_name=${file_name[${#file_name[@]} - 1]}
        file_name=$(echo -n $file_name)
        mini_file_name=$(echo -n "$file_name" | sed "s/\.\(\w\+\?\)$/.min.\1/")
        sed -i "s/$file_name/$mini_file_name/g" $temp_file

    done

    if echo "$file" | grep -q "\.js$"; then
        uglifyjs "$temp_file" -o "$mini_file"
        rm $temp_file
    fi
}

function escapeString() {
    str=$1
    cat <<< $str | sed "s/\([\"!\<\>\(\)]\)/\\\\\\1/g"
}

function insertAfterBury() {
    keyword=$1
    file=$2
    content=$3
    
    sed -i "`grep -n "<\!-- $keyword -->" $file | cut -d ":" -f 1`a $content" $file
}

function editHtmlFile() {
    path=$1

    echo "ddddddddddddddddddddddddddd"
    echo $path

    temp_file=`sed "s/\.\(\w\+\?\)$/.temp.\1/g" <<< "$path"`
    echo $temp_file
    if [ -f "./frontjs" ]; then
        content=`cat "./frontjs"`
        content=`escapeString "$content"`
        insertAfterBury "frontjs-script" "$temp_file" "$content"
    fi

    if [ -f "./360fenxi" ]; then
        content=`cat "./360fenxi"`
        content=`escapeString "$content"`
        insertAfterBury "360fenxi-script" "$temp_file" "$content"
    fi

    if [ -f "./bdtongji" ]; then
        content=`cat "./bdtongji"`
        insertAfterBury "bdtongji-script" "$temp_file" "$content"
    fi
    editTempFile $path
}

declare -a files_path

function createTempFiles() {
    floder="$1"

    lists=$(ls "$floder" --hide="*.min.*" --hide="*.temp.*")

    for file in ${lists[@]}; do
        createTempFile "$floder$file"
        files_path+=("$floder$file")
    done
}

createTempFiles ./js/
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo "Temp files created success"
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo "Edinting temp files..."
for temp_file in ${files_path[@]}; do
    echo "Edinting temp files: $temp_file..."
    editTempFile $temp_file
done
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"

createTempFile "./index.html"
if [ ! -f "./index.html.bak" ]; then
    cp "./index.html" "./index.html.bak"
fi

editHtmlFile ./index.html

if [ $build="build" ]; then
    mv "./index.html" "./index-`date +%s`.html.bak"
    mv "./index.temp.html" "./index.html"
fi
