# BulbutinNg

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Environment Setup

**First time setup**: See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for instructions on setting up your Mapbox access token for local development and Netlify deployment.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project for production:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. The custom build script injects environment variables at build time.

For local production builds with a custom token:

```bash
MAPBOX_ACCESS_TOKEN="pk.your-token" npm run build
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
