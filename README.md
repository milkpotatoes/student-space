# student-space
学习空间开源仓库

## 如何使用

在继续进行下一步之前，请确保您的计算机上已安装 node ，并可使用 npm 命令。

您可以使用 `npm -v` 进行检查

1. 在终端打开本文件夹
2. 处理文件
   1. Linux 系统
      1. 使用 `chmod +x publish.sh` 为脚本添加可执行权限
      2. 运行 `./publish.sh` 脚本处理文件
   2. Windows 10/11
      1. 执行 `./publish.ps1` 即可
3. 双击 `index.html` 文件以在浏览器直接打开或使用 node 或 python 等提供的简易web服务
    - 使用 Node 提供 web 服务: `node server.js`
    - 使用 Python 提供 Web 服务: `python -m http.server [端口号]`
    
4. 启动 Web 服务后，在浏览器打开 `127.0.0.1:[端口号]` 或其他对应 ip 即可, node脚本已将端口号预设为 `1080`。

