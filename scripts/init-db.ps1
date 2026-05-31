# 初始化本地数据库（解决 Settings 表不存在等问题）
Set-Location $PSScriptRoot\..

Write-Host "正在初始化数据库..." -ForegroundColor Cyan

# 删除可能存在的空库（根目录误生成的 dev.db）
if (Test-Path ".\dev.db") {
    Remove-Item ".\dev.db" -Force
    Write-Host "已删除项目根目录的空 dev.db" -ForegroundColor Yellow
}

npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "数据库就绪: prisma\dev.db" -ForegroundColor Green
Write-Host "请执行: npm run dev" -ForegroundColor Green
