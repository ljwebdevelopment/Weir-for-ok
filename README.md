# Christopher Wier Campaign Website

Static campaign website for Christopher Wier for Oklahoma House District 4.

## Project Files

- `index.html` - main website page
- `css/styles.css` - site styling
- `js/main.js` - navigation, form validation, and form submission logic
- `google-apps-script.js` - Google Apps Script code that sends form submissions to Google Sheets
- `assets/` - logos and campaign photography

## Local Preview

Because this is a static site, you can open `index.html` directly in a browser.

For a local server preview:

```bash
python -m http.server 4445
```

Then open:

```text
http://localhost:4445
```

## Google Sheets Setup

The volunteer and contact forms are wired to submit to a Google Apps Script Web App. Until the Web App URL is added in `js/main.js`, form submissions will show the fallback error message.

1. Open the campaign Google Sheet:

   ```text
   https://docs.google.com/spreadsheets/d/1uEHEmSjGEDX4SWyFGhUF7eGxkj2GIOQRVWQH7Ao5m9g
   ```

2. Confirm the Sheet has a tab named exactly:

   ```text
   wier
   ```

   The script will create this tab if it does not exist, but the configured tab name is `wier`.

3. In Google Sheets, go to `Extensions` > `Apps Script`.

4. Delete any starter code in the Apps Script editor.

5. Paste the full contents of `google-apps-script.js` into the editor.

6. Save the project and name it:

   ```text
   Wier Campaign Forms
   ```

7. Click `Deploy` > `New deployment`.

8. Click the gear icon next to `Type` and choose `Web app`.

9. Use these deployment settings:

   ```text
   Description: Wier Campaign Form Handler
   Execute as: Me
   Who has access: Anyone
   ```

10. Click `Deploy` and authorize the script when Google prompts you.

    If Google shows an unverified app warning, choose `Advanced`, then continue to the project. This is expected for a script you own.

11. Copy the Web App URL. It should look similar to:

    ```text
    https://script.google.com/macros/s/AKfycb.../exec
    ```

12. Open `js/main.js` and find:

    ```js
    const SCRIPT_URL = '';
    ```

13. Paste the Web App URL between the quotes:

    ```js
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
    ```

14. Save `js/main.js`, commit the change, and redeploy the website.

## Testing Google Sheets

After deployment:

1. Visit the Web App URL directly in your browser.
2. Confirm it returns a JSON message saying the form handler is running.
3. Submit the website volunteer or contact form.
4. Check the `wier` tab in the Google Sheet for a new row.

If you edit `google-apps-script.js` later, create a new Apps Script deployment version:

```text
Deploy > Manage deployments > Edit > Version > New version > Deploy
```

The Web App URL should stay the same when updating an existing deployment.
