# Apps Script daily ops toolkit

Three small, original Google Apps Script tools for the part of operations work that's really just
"someone has to check a spreadsheet every day and nobody should have to." This is written from
scratch for this repo, generic and config-driven, no company data or endpoints in it. The real
version of this (real recipients, a real reminder cadence, a real admin console) belongs to my
employer; the write-ups for that are in
[case-studies](https://github.com/nishantaraaj-prog/case-studies), under
`05-Automation-And-AI`.

## Folder map

Everything lives in `Src/`, ready to paste into an Apps Script project.

| File in `Src/` | What it does |
|---|---|
| `Config.gs` | Reads settings from Script Properties, no secrets committed to the script |
| `DailyReport.gs` | Builds and emails a daily snapshot from a sheet of raw records |
| `Reminders.gs` | Scans unpaid applications and sends staged reminders, once each, ever |
| `PopupImporter.gs` | A menu item that pastes a CSV export into the sheet without duplicating rows already there |

## Why Script Properties, not constants in the code

Every value that differs between a test copy and the real spreadsheet, recipient lists, the sender
name, which columns mean what, lives in **File > Project properties > Script properties**, not in
the `.gs` files. That means this code can be copied into a brand new spreadsheet and configured
without touching a line of it, and it means nobody ever has to decide whether an email address in a
public repo is real or a placeholder.

Set these before running anything:

| Property | Example value |
|---|---|
| `REPORT_RECIPIENTS` | `founder@example.com,ops@example.com` |
| `REPORT_SENDER_NAME` | `Daily Ops Bot` |
| `REMINDER_STAGE_DAYS` | `0,2,5,7` |
| `REMINDER_EXTENDED_DAYS` | `14,21` |

## Expected sheet shape

**Applications** sheet: `application_id`, `applicant_name`, `organization`, `status` (`submitted` /
`paid`), `submitted_at`.

**Reminder Log** sheet (created automatically on first run): `application_id`, `stage`, `sent_at`.
This is what makes the reminder scan idempotent, a stage that's already logged for an application
is never sent twice, even if the trigger fires twice or the script is re-run by hand.

## How I'd wire this up

1. Paste the `.gs` files and `appsscript.json` from `Src/` into a bound or standalone Apps Script
   project.
2. Set the Script Properties above.
3. Run `Reminders.scanAndSendReminders` and `DailyReport.sendDailySnapshotEmail` once by hand to
   authorize the Gmail and Spreadsheet scopes.
4. Add two time-driven triggers (Triggers > Add Trigger): the reminder scan hourly, the daily
   report once a day, early morning.
5. Reload the spreadsheet. A **Data Import** menu appears, from `PopupImporter.gs`, for pasting in
   ad-hoc CSV exports from a form tool or a partner's spreadsheet.

## A note on `GmailApp` vs `MailApp`

This toolkit uses `MailApp.sendEmail`, which doesn't need the broader Gmail scope and is enough for
sending mail from a script. If a real deployment needs to read replies (an inbox-driven workflow),
that's a different, more sensitive scope, and worth a deliberate decision, not a default.
