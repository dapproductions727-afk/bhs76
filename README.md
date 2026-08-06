# Briarcliff High Class of 1976 — 50th Reunion site

A plain static site. No build step, no framework. Open `index.html` in a browser
and it works.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: hero, countdown, recent photos, committee letter |
| `weekend.html` | Thursday / Friday / Saturday schedule |
| `photos.html` | Full photo gallery, loaded from Google Drive |
| `memoriam.html` | In memoriam |
| `rsvp.html` | Register and pay |
| `styles.css` | All styling, shared by every page |
| `site.js` | Countdown, gallery, lightbox, scroll reveals |

## Adding photos

Drop them in the shared Google Drive folder (**BHS 1976 Photos**). They appear on
the site on the next page load. Nothing to edit, nothing to redeploy.

The **file name becomes the caption**, so name them well: `Homecoming 1975.jpg`
shows as "Homecoming 1975".

## Things that still need real content

Search the project for `SWAP:` to find each one.

- **In memoriam names** — `memoriam.html`, currently `[Classmate name]` placeholders
- **Committee names** — `index.html`, in the letter's signature block
- **Venmo handle** — `rsvp.html`, currently `Briarcliff-1976` in two places that must match
- **Committee email and phone** — the footer on every page

## Working on it locally

```
python3 -m http.server 3000
```

Then open <http://localhost:3000>. Use the server rather than opening the file
directly, because the Google Drive gallery will not load over `file://`.

## Deploying

Pushing to the `main` branch deploys automatically to Vercel.

## Note on the Google API key

The Drive API key in `site.js` is public by design — that is how the browser
reads the folder. It is read-only and the folder is already shared publicly.
Once the site is on its real domain, restrict the key in the Google Cloud
console to the Drive API and to that domain.
