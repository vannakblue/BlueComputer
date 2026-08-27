@echo off
title Blue Computer - Local Omnichannel Retail & POS Server
color 0B
cls

echo =====================================================================
echo           BLUE COMPUTER - LOCAL DEVELOPMENT SERVER (PHNOM PENH)
echo =====================================================================
echo.
echo [1/3] Applying database migrations...
py manage.py migrate

echo.
echo [2/3] Opening web browser at http://127.0.0.1:8000/ ...
start http://127.0.0.1:8000/

echo.
echo [3/3] Starting Django Local Server...
echo ---------------------------------------------------------------------
echo  * E-Commerce Storefront: http://127.0.0.1:8000/
echo  * In-Store POS Station:  http://127.0.0.1:8000/pos/
echo  * Admin Inventory Hub:   http://127.0.0.1:8000/admin-portal/
echo  * Live Order Tracking:   http://127.0.0.1:8000/track/
echo ---------------------------------------------------------------------
echo  Press CTRL + C to stop the server anytime.
echo =====================================================================
echo.

py manage.py runserver 127.0.0.1:8000

pause
