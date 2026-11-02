/**
 * Central configuration, read from Script Properties rather than hardcoded.
 * Set these under File > Project properties > Script properties before
 * running anything else in this toolkit. See README.md for the full list.
 */

function getConfig_() {
  const props = PropertiesService.getScriptProperties();

  const recipients = (props.getProperty('REPORT_RECIPIENTS') || '')
    .split(',')
    .map(function (s) { return s.trim(); })
    .filter(Boolean);

  const stageDays = (props.getProperty('REMINDER_STAGE_DAYS') || '0,2,5,7')
    .split(',')
    .map(Number);

  const extendedDays = (props.getProperty('REMINDER_EXTENDED_DAYS') || '14,21')
    .split(',')
    .map(Number);

  return {
    reportRecipients: recipients,
    senderName: props.getProperty('REPORT_SENDER_NAME') || 'Daily Ops Bot',
    reminderStageDays: stageDays,
    reminderExtendedDays: extendedDays,
    applicationsSheetName: 'Applications',
    reminderLogSheetName: 'Reminder Log',
  };
}

/**
 * Small guard so a misconfigured copy of this spreadsheet fails loudly and
 * early, instead of silently sending nothing or emailing nobody.
 */
function assertConfigured_(config) {
  if (config.reportRecipients.length === 0) {
    throw new Error(
      'REPORT_RECIPIENTS is not set. Add it under Script properties before running this.'
    );
  }
}
