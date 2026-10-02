# FairShare

FairShare is a Vue 3 web application built with Vite. The app helps roommates organize shared expenses.

## Prerequisites

- [Node.js](https://nodejs.org/) `22.18.0` or newer in the Node 22 series, or `24.12.0` or newer.
- npm, which is included with Node.js.

Check your installed versions from a terminal:

```sh
node --version
npm --version
```

## Set Up

From the repository root, install the app dependencies:

```sh
cd fairshare
npm install
```

## Run Locally

Start the Vite development server:

```sh
npm run dev
```

Open the URL printed in the terminal, typically [http://localhost:5173](http://localhost:5173). Vite provides hot reload as you edit the app. Stop the server with `Ctrl+C`.

## Other Commands

Run a production build:

```sh
npm run build
```

Preview the production build locally after building:

```sh
npm run preview
```

## Project Structure

- `src/App.vue` contains the main FairShare page.
- `src/main.js` creates and mounts the Vue application.
- `src/assets/` contains the app's styles and assets.
- `public/` contains static files served directly by Vite.