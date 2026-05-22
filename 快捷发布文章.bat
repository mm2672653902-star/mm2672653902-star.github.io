@echo off
chcp 65001 > nul
echo ===================================================
echo       小毛的blog空间 - 自动化快捷发布脚本
echo ===================================================

cd /d "%~dp0"

echo [1/4] 读取本地环境配置...
if not exist env.txt (
    echo 错误: 未找到 env.txt 配置文件！
    pause
    exit /b
)

for /f "usebackq delims=" %%i in ("env.txt") do (
    set "%%i"
)

if "%GITHUB_TOKEN%"=="" (
    echo 错误: env.txt 中未定义 GITHUB_TOKEN！
    pause
    exit /b
)

echo 正在确保本地 Git 仓库已初始化...
if not exist .git (
    cmd /c git init
)

echo 正在设置 Git 全局用户信息...
cmd /c git config --global user.name "%GITHUB_USERNAME%"
cmd /c git config --global user.email "%EMAIL%"

echo [2/4] 清理旧编译文件 (hexo clean)...
cmd /c npx hexo clean

echo [3/4] 编译静态网页 (hexo g)...
cmd /c npx hexo g

echo [4/4] 部署推送到 GitHub Pages (hexo d)...
cmd /c npx hexo d

echo ===================================================
echo 部署完成！请访问: http://%MY_DOMAIN% 或 https://%GITHUB_USERNAME%.github.io
echo ===================================================
pause
