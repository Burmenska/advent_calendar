# Advent Calendar

A personal advent calendar you can make for someone, then share with a link. Each of the 24 doors sits on an illustrated December scene and opens onto a wish, a question, or a small prompt.

Live: [https://adventcalendar-for-you.vercel.app](https://adventcalendar-for-you.vercel.app)

## Features

- Personalise a calendar with the recipient's name and your name.
- Choose a design, then preview the scene before creating the link.
- Two designs:
  - **Christmas Magic** (red), a cabin fireplace with doors on stockings, wall cubbies, hearth boxes, and books.
  - **Winter Elegance** (blue), a snowy house with a glowing window for each day.
- Share the calendar through a unique link.
- Opened days swap in matching open-day artwork from the same scene positions.
- Save door-opening progress against an email address, and return to it later.
- Ask for confirmation before a future door is opened early.

Calendars saved under the earlier `beige` design id still open with the Winter Elegance artwork.

Calendars and progress are stored in Neon Postgres.

## How it works

1. Enter the recipient's name and your name.
2. Choose Christmas Magic or Winter Elegance.
3. Preview the calendar, then create it.
4. Copy the generated link and share it.
5. The recipient enters an email address so opened days are remembered.
6. Open the doors and read the messages.

The email address identifies saved progress. It is not a verified sign-in, and nothing is sent to that address.

## Designs and open-day art

Closed and open scene images live in `public/designs/`:

| Design | Closed | Open |
| --- | --- | --- |
| Christmas Magic | `festive.jpg` | `festive-open.jpg` |
| Winter Elegance | `elegant.jpg` | `elegant-open.jpg` |

Clickable areas are defined as percent hotspots in `public/app.js`. When a day is opened, the matching patch from the open image is composed onto the closed scene at that hotspot.

## Built with

- Node.js with ES modules
- HTML, CSS, and JavaScript
- Neon Postgres for persistent storage
- The `pg` package for database access
- Vercel for hosting

## Run locally

### Requirements

- Node.js and npm
- A Neon Postgres database connection string

### Setup

Install dependencies:

```bash
npm install
```

Set the database connection environment variable in your terminal:

```bash
export AC_DB_DATABASE_URL="your-neon-connection-string"
```

The command above is for macOS and Linux. In Windows PowerShell, use:

```powershell
$env:AC_DB_DATABASE_URL="your-neon-connection-string"
```

Start the app:

```bash
npm start
```

Open `http://localhost:3000` in your browser.

Keep your database connection string private. Do not commit it to the repository.

## Deployment

The app is hosted on Vercel, with a connected Neon database.

Production URL: [https://adventcalendar-for-you.vercel.app](https://adventcalendar-for-you.vercel.app)

The server expects this environment variable:

```text
AC_DB_DATABASE_URL
```

Make sure it is available in the deployment environment you are using.

The database table is created automatically when the app first accesses storage. The database role must have permission to create tables.

## Calendar messages

The message collection is maintained in `wishes.js`.

To update it, edit the quoted phrases inside the existing message array and keep the surrounding code unchanged.

Messages are saved when a calendar is created. Updating the collection affects new calendars, not existing ones.

The wording on the create page, including the design names, lives in `PAGE_COPY` at the top of `public/app.js`.

## Tests

Run the date-related tests with:

```bash
npm test
```

## Prototype notes

- Email addresses identify progress but are not authenticated.
- Anyone with a calendar link can access that calendar.
- Calendar data is currently stored together in one database record, a simple approach intended for the prototype.
