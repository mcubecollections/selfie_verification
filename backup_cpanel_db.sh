#!/bin/bash

################################################################################
# M'Cube Plus Selfie Verification - Database Backup Script
# For cPanel Production Environment
#
# This script creates backups of the SQLite database and keeps the last 30
#
# Installation:
#   1. Upload to /home/mcubyjwq/backup_cpanel_db.sh
#   2. chmod +x /home/mcubyjwq/backup_cpanel_db.sh
#   3. Setup cron job in cPanel to run daily
#
# Cron job example (runs daily at 2 AM):
#   0 2 * * * /home/mcubyjwq/backup_cpanel_db.sh
################################################################################

# Configuration - IMPORTANT: Update these paths to match your setup
HOME_DIR="/home/mcubyjwq"
DB_FILE="${HOME_DIR}/selfie_data/verifications.db"
BACKUP_DIR="${HOME_DIR}/backups"
LOG_FILE="${HOME_DIR}/logs/backup.log"

# Create timestamp for backup filename
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/verifications_${DATE}.db"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname ${LOG_FILE})"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Start backup
log_message "=== Starting database backup ==="

# Check if database file exists
if [ ! -f "${DB_FILE}" ]; then
    log_message "ERROR: Database file not found at ${DB_FILE}"
    log_message "Please check DB_PATH configuration"
    exit 1
fi

# Get database size
DB_SIZE=$(du -h "${DB_FILE}" | cut -f1)
log_message "Database size: ${DB_SIZE}"

# Create backup
log_message "Creating backup: ${BACKUP_FILE}"
cp "${DB_FILE}" "${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
    log_message "Backup created successfully"
    
    # Verify backup file
    if [ -f "${BACKUP_FILE}" ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        log_message "Backup size: ${BACKUP_SIZE}"
    else
        log_message "ERROR: Backup file not found after copy"
        exit 1
    fi
else
    log_message "ERROR: Backup failed"
    exit 1
fi

# Clean up old backups (keep last 30)
log_message "Cleaning up old backups (keeping last 30)..."
cd "${BACKUP_DIR}"

# Count current backups
BACKUP_COUNT=$(ls -1 verifications_*.db 2>/dev/null | wc -l)
log_message "Current backup count: ${BACKUP_COUNT}"

# Remove old backups if more than 30
if [ ${BACKUP_COUNT} -gt 30 ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - 30))
    log_message "Removing ${REMOVE_COUNT} old backup(s)"
    ls -t verifications_*.db | tail -n +31 | xargs -r rm -f
    log_message "Old backups removed"
else
    log_message "No old backups to remove"
fi

# Final backup count
FINAL_COUNT=$(ls -1 verifications_*.db 2>/dev/null | wc -l)
log_message "Final backup count: ${FINAL_COUNT}"

# Calculate total backup size
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log_message "Total backup directory size: ${TOTAL_SIZE}"

log_message "=== Backup completed successfully ==="
log_message ""

exit 0
