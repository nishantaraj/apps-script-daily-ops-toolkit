/**
 * Scans the Applications sheet for unpaid applications and sends a staged
 * reminder at each configured day offset, exactly once per application per
 * stage, ever. The "exactly once" part is the whole point: this is safe to
 * run on an hourly trigger, safe to re-run by hand, and safe to run twice
 * if a trigger ever double-fires.
 */

function scanAndSendReminders() {
  const config = getConfig_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const appsSheet = ss.getSheetByName(config.applicationsSheetName);
  if (!appsSheet) {
    throw new Error('Sheet "' + config.applicationsSheetName + '" not found.');
  }

  const logSheet = getOrCreateReminderLogSheet_(ss, config);
  const alreadySent = loadSentStages_(logSheet);

  const rows = readApplicationsSheet_(appsSheet);
  const allStages = config.reminderStageDays.concat(config.reminderExtendedDays);
  const now = new Date();

  rows.forEach(function (row) {
    if (row.status === 'paid') return;

    const submitted = new Date(row.submittedAt);
    const daysSince = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));

    allStages.forEach(function (stageDay) {
      const stageKey = stageLabel_(stageDay, config);
      const alreadyLogged = alreadySent.has(row.applicationId + '::' + stageKey);

      if (!alreadyLogged && daysSince >= stageDay) {
        sendReminderEmail_(row, stageKey);
        logReminderSent_(logSheet, row.applicationId, stageKey);
      }
    });
  });
}

function stageLabel_(stageDay, config) {
  if (config.reminderExtendedDays.indexOf(stageDay) !== -1) {
    return 'extended_' + stageDay;
  }
  return stageDay === 0 ? 'immediate' : 'day_' + stageDay;
}

function getOrCreateReminderLogSheet_(ss, config) {
  let sheet = ss.getSheetByName(config.reminderLogSheetName);
  if (!sheet) {
    sheet = ss.insertSheet(config.reminderLogSheetName);
    sheet.appendRow(['application_id', 'stage', 'sent_at']);
  }
  return sheet;
}

function loadSentStages_(logSheet) {
  const values = logSheet.getDataRange().getValues();
  values.shift(); // header
  const set = new Set();
  values.forEach(function (row) {
    set.add(row[0] + '::' + row[1]);
  });
  return set;
}

function logReminderSent_(logSheet, applicationId, stageKey) {
  logSheet.appendRow([applicationId, stageKey, new Date()]);
}

function sendReminderEmail_(row, stageKey) {
  // In a real deployment this looks up the applicant's own email address
  // by application_id; this demo only has organization-level sample data,
  // so it logs what it would have sent instead of calling MailApp.
  Logger.log(
    'Would send "' + stageKey + '" reminder for ' + row.applicationId +
    ' (' + row.organization + ')'
  );

  // Example of the real call, once an email column exists on the sheet:
  // MailApp.sendEmail({
  //   to: row.applicantEmail,
  //   subject: 'Complete your enrollment',
  //   htmlBody: buildReminderHtml_(row, stageKey),
  // });
}
