/**
 * Builds a one-screen daily snapshot from the Applications sheet and emails
 * it to whoever is configured in REPORT_RECIPIENTS. Meant to run on a daily
 * time-driven trigger, early morning, so it's the first thing a founder
 * sees rather than something they have to go look for.
 */

function sendDailySnapshotEmail() {
  const config = getConfig_();
  assertConfigured_(config);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    config.applicationsSheetName
  );
  if (!sheet) {
    throw new Error('Sheet "' + config.applicationsSheetName + '" not found.');
  }

  const rows = readApplicationsSheet_(sheet);
  const summary = summarizeApplications_(rows);
  const html = buildReportHtml_(summary);

  MailApp.sendEmail({
    to: config.reportRecipients.join(','),
    subject: 'Daily snapshot: ' + Utilities.formatDate(
      new Date(), config.timeZone || 'Asia/Kolkata', 'd MMM yyyy'
    ),
    htmlBody: html,
    name: config.senderName,
  });
}

function readApplicationsSheet_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const col = {};
  headers.forEach(function (h, i) { col[h] = i; });

  return values
    .filter(function (row) { return row[col['application_id']]; })
    .map(function (row) {
      return {
        applicationId: row[col['application_id']],
        organization: row[col['organization']],
        status: row[col['status']],
        submittedAt: row[col['submitted_at']],
      };
    });
}

function summarizeApplications_(rows) {
  const byOrganization = {};
  let paid = 0;
  let submitted = 0;

  rows.forEach(function (r) {
    if (!byOrganization[r.organization]) {
      byOrganization[r.organization] = { total: 0, paid: 0 };
    }
    byOrganization[r.organization].total++;
    if (r.status === 'paid') {
      byOrganization[r.organization].paid++;
      paid++;
    } else {
      submitted++;
    }
  });

  return {
    total: rows.length,
    paid: paid,
    submitted: submitted,
    byOrganization: byOrganization,
  };
}

function buildReportHtml_(summary) {
  const rows = Object.keys(summary.byOrganization)
    .sort()
    .map(function (org) {
      const o = summary.byOrganization[org];
      return (
        '<tr><td>' + org + '</td><td>' + o.total + '</td><td>' + o.paid + '</td></tr>'
      );
    })
    .join('');

  return (
    '<h2>Daily snapshot</h2>' +
    '<p>' + summary.total + ' applications total &middot; ' +
    summary.paid + ' paid &middot; ' + summary.submitted + ' awaiting payment</p>' +
    '<table border="1" cellpadding="6" cellspacing="0">' +
    '<tr><th>Organization</th><th>Applications</th><th>Paid</th></tr>' +
    rows +
    '</table>'
  );
}
