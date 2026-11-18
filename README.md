# # Advent Calendar

A festive, interactive advent calendar with a little something to make someone smile each day.

Create a personalised calendar, share the link, and let someone discover a cheerful wish, a thoughtful question, or a little Christmas inspiration behind each door.

## Features

- Personalise a calendar with the recipient's name and your name.

- Choose between two designs: festive and beige.

- Share the calendar through a unique link.

- Discover a message behind each of the 24 doors.

- Return to saved door-opening progress using the same email address.

- Receive a confirmation prompt before opening a future door early.

Calendars and progress are stored in Neon Postgres.

## How it works

1. Enter the recipient's name and your name.

2. Choose a design and create the calendar.

3. Copy the generated link and share it.

4. The recipient enters an email address to track their progress.

5. Open the doors and enjoy the messages.

The email address is used to identify saved progress. It is not a verified sign-in or an email subscription.

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

## Tests

Run the date-related tests with:

```bash

npm test

```

## Prototype notes

- Email addresses identify progress but are not authenticated.

- Anyone with a calendar link can access that calendar.

- Calendar data is currently stored together in one database record, a simple approach intended for the prototype.

## Planned improvements

- A more festive visual design.
