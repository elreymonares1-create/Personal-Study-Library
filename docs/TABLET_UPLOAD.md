# Use the improved version from your phone/tablet

1. Export a complete backup from your current study app and keep it on your device.
2. Download `Personal_Study_Library_Improved_0.2.0.zip` from the conversation.
3. GitHub repository → Add file → Upload files → select this new ZIP → Commit changes.
4. Open the existing Codespace and its terminal. Run one line at a time:

```bash
git pull --ff-only
unzip Personal_Study_Library_Improved_0.2.0.zip -d /tmp/study-improved-020
cp -R /tmp/study-improved-020/Study_Library_PWA/. .
git add index.html manifest.webmanifest service-worker.js precache-manifest.js offline.html .nojekyll .gitignore .github css js assets tools tests docs recovery README.md
git commit -m "Improve shared study system to 0.2.0"
git push
```

If Git says a pull would overwrite local changes, stop and send the exact error. Do not run reset/clean commands. If the extraction directory already exists, use a different new `/tmp` directory rather than overwriting a partial extraction.

5. Repository Settings → Pages → Source = GitHub Actions.
6. Actions → Deploy Study Library PWA must pass. Open the Pages URL once it succeeds.
7. Existing installed app: Settings → Check for Updates → Update Now when your work is saved. No reinstall at the same URL.
8. First hosted use: import your old app's backup once; file-HTML and HTTPS storage are different origins. Verify sources/progress before installing in Chrome.

Your PDFs, notes and personal backups stay on your tablet. Do not upload personal backup files to the public repository. Public ZIP source contains only app code, original academic banks, tests and a source recovery copy. The deployment allow-list excludes recovery/test/docs/ZIP files.
