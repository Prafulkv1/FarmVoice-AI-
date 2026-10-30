# Reset MySQL root password using --init-file (requires elevation)
$ErrorActionPreference = "Continue"
$logFile = "C:\Users\praful k v\mysql-reset.log"
$initFile = "C:\Users\praful k v\mysql-init.sql"
$newPass = "FarmVoiceRoot@2026"
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe"

function Write-Log($msg) { $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"; "$ts`t$msg" | Out-File -FilePath $logFile -Append }

Write-Log "=== RESET START ==="
Write-Log "Current user: $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)"

# Write the init SQL - update all root accounts
$sql = "ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPass';`nALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '$newPass';`nFLUSH PRIVILEGES;"
Set-Content -Path $initFile -Value $sql -Encoding UTF8
Write-Log "Init file written: $initFile"

# Stop the MySQL service
Write-Log "Stopping MySQL80 service..."
$stopOut = net stop MySQL80 2>&1
Write-Log ("net stop output: " + ($stopOut -join " "))
Start-Sleep -Seconds 5

# Check status
$svc = Get-Service MySQL80 -ErrorAction SilentlyContinue
Write-Log ("Service status after stop: " + ($svc.Status | Out-String))

# Start mysqld manually with the init-file
Write-Log "Starting mysqld with --init-file..."
$proc = Start-Process -FilePath $mysqld -ArgumentList "--init-file=$initFile", "--console" -PassThru -WindowStyle Hidden
Write-Log ("mysqld started, PID: " + $proc.Id)
Start-Sleep -Seconds 10

# Check if process still alive
if ($proc.HasExited) {
    Write-Log "mysqld exited immediately (code $($proc.ExitCode)) - likely port conflict"
} else {
    Write-Log "mysqld is running"
    # Verify new password works
    Write-Log "Verifying root access..."
    $verify = mysql -u root -p$newPass -e "SELECT VERSION(); SELECT User, Host FROM mysql.user WHERE User='root';" 2>&1
    Write-Log ("verify output: " + ($verify -join " "))

    # Stop the manual mysqld instance
    Write-Log "Stopping manual mysqld..."
    Stop-Process -Id $proc.Id -Force 2>$null
    Start-Sleep -Seconds 3
}

# Restart the Windows service normally
Write-Log "Restarting MySQL80 service..."
$startOut = net start MySQL80 2>&1
Write-Log ("net start output: " + ($startOut -join " "))
Start-Sleep -Seconds 4

# Final verification via service
Write-Log "Final verification..."
$final = mysql -u root -p$newPass -e "SELECT VERSION();" 2>&1
Write-Log ("final output: " + ($final -join " "))

Write-Log "=== RESET END ==="
Write-Log "New root password: $newPass"
