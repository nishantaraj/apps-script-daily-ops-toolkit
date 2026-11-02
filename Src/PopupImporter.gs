/**
 * A "Data Import" menu that lets anyone on the team paste a CSV export
 * (from a form tool, a partner's spreadsheet, wherever) into the
 * Applications sheet without creating duplicate rows. Meant for the
 * ad-hoc exports that don't come through the main intake pipeline.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Data Import')
    .addItem('Paste CSV export...', 'showPasteCsvDialog_')
    .addToUi();
}

function showPasteCsvDialog_() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Paste CSV export',
    'Paste the full CSV text below, including the header row. Expected ' +
      'columns: application_id, applicant_name, organization, program_code, ' +
      'submitted_at, status.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const result = importCsvText_(response.getResponseText());
  ui.alert(
    'Import finished',
    result.added + ' new row(s) added, ' + result.skipped +
      ' skipped as already present.',
    ui.ButtonSet.OK
  );
}

/**
 * Parses pasted CSV text and appends only the rows whose application_id
 * isn't already in the Applications sheet. Exposed as its own function so
 * it can be unit tested with a fake string, independent of the UI prompt.
 */
function importCsvText_(csvText) {
  const config = getConfig_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    config.applicationsSheetName
  );

  const parsed = Utilities.parseCsv(csvText);
  const headers = parsed.shift();
  const idCol = headers.indexOf('application_id');
  if (idCol === -1) {
    throw new Error('Pasted CSV has no application_id column.');
  }

  const existingIds = new Set(
    sheet
      .getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 1)
      .getValues()
      .map(function (r) { return r[0]; })
      .filter(Boolean)
  );

  const sheetHeaders = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  let added = 0;
  let skipped = 0;

  parsed.forEach(function (row) {
    const applicationId = row[idCol];
    if (!applicationId || existingIds.has(applicationId)) {
      skipped++;
      return;
    }

    // Reorder the pasted row to match the sheet's own column order, so a
    // differently-ordered export still lands in the right columns.
    const ordered = sheetHeaders.map(function (header) {
      const sourceCol = headers.indexOf(header);
      return sourceCol === -1 ? '' : row[sourceCol];
    });

    sheet.appendRow(ordered);
    existingIds.add(applicationId);
    added++;
  });

  return { added: added, skipped: skipped };
}
