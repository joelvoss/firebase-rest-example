# firebase-rest-example

Example REST application to demonstate the usage of firebase auth.

## Requirements

- Node ^10.14.2
- npm ^6.9.0
- Firebase project & private key

## Prerequisites

We assume that a firebase project has already been created and a new private key
for the default service account has been generated.

1. Download the private key of your firebase service account and place it inside
   the `secret/` folder.

2. Make a copy of `example.env` and name it `.env`.  
   ➞ `cd` into this directory and run `cp example.env .env`

3. Replace the placeholder values with real values.  
   You can find those in your firebase admin console under \
   `https://console.firebase.google.com/u/1/project/<project-id>/settings/general/`

## Usage

1. Make sure that all requirements and prerequisites are met.

2. Install application dependencies.

```text
npm install  OR  yarn install
```

3. Validate application setup

```text
npm run validate  OR  yarn validate
```

4. Build application

```text
npm run build -- -c  OR  yarn build -c
```

5. Start the application either in development or production.

```text
npm start  OR  yarn start
```

## Notes about authentication

The application expects a bearer token to authenticate incoming request.
To mint such an authentication token, use the Firebase Client SDK in your
client application.

In addition, this application registers a route ro generate a bearer token but
it is noted that this functions merely as an escape hatch.

---

This project was bootstrapped with [jvdx](https://github.com/joelvoss/jvdx).
