# levelhub-api
NodeJs project for LevelHub

This folder contains the backend API for the project. It includes configuration files, source code, and environment settings required to run the API.

## Folder Structure

```
api/
├── .editorconfig       # Editor configuration for consistent coding styles
├── .env                # Environment variables (not included in version control)
├── .gitignore          # Git ignore rules
├── config.js           # Main configuration file for the API
├── example.env         # Example environment variables file
├── index.js            # Entry point for the API
├── package.json        # Node.js dependencies and scripts
├── README.md           # Documentation for the API
├── src/                # Source code for the API
│   ├── constants.js    # Application-wide constants
│   ├── corsConfig.js   # CORS configuration
│   ├── messages.js     # Centralized messages for the API
│   ├── assets/         # Static assets used by the API
│   └── ...             # Other source files
```

## Prerequisites

- [Node.js](https://nodejs.org/) (version specified in `package.json`)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## Setup

1. Clone the repository and navigate to the `api` folder:
   ```sh
   git clone <repository-url>
   cd api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file by copying `example.env` and updating the values:
   ```sh
   cp example.env .env
   ```

## Running the API

To start the API in development mode:
```sh
npm run dev
```

To start the API in production mode:
```sh
npm start
```

## Scripts

The following scripts are defined in the `package.json` file:

- `npm run dev`: Starts the API in development mode with live reloading.
- `npm start`: Starts the API in production mode.

## Environment Variables

The API uses environment variables defined in the `.env` file. Refer to `example.env` for the required variables and their descriptions.

## Features

- **CORS Configuration**: Managed in [`src/corsConfig.js`](src/corsConfig.js).
- **Centralized Messages**: Defined in [`src/messages.js`](src/messages.js).
- **Constants**: Application-wide constants are stored in [`src/constants.js`](src/constants.js).

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and push the branch.
4. Submit a pull request.

## License

This project is licensed under the terms specified in the root `LICENSE.md` file.
