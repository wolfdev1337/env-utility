# Environment Variable Validator

A robust utility to validate environment variables against `env.d.ts` type definitions, generate TypeScript types from `.env` files, and ensure your application runs with correct configurations. This tool supports custom regex validation, enums, and environment-specific overrides.

---

## **Features**

1. **Type Validation**:

   - Validate environment variables against a `env.d.ts` file.
   - Support for strings, enums, and custom regex patterns.

2. **Regex Validation**:

   - Define regex patterns directly in the `env.d.ts` file using `@regex` tags.
   - Supports multiple regex patterns per variable. By adding inline comment next to the variable defintion in the env.d.ts

3. **Customizable `env.d.ts`**:

   - Generate a basic `env.d.ts` file from your `.env` file.
   - Developers can modify the generated file to include enums, regex patterns.

---

## **Installation**

### Install using npm

```bash
npm install env-utility
```

# Usage

Make sure you have a `env.d.ts` file.

- An example to `.env` and `env.d.ts` files:

  `env.d.ts` file supports both enum and regex.
  You can add regex by adding inline comment next to the variable by using @regex tag

  `.env`

  ```
  API_URL=https://api.example.com
  NODE_ENV=development
  PORT=3000
  ```

  `env.d.ts`

  ```
  enum NodeEnv {
  development = "development",
  production = "production",
  }

  interface ProcessEnv {
  API_URL: string; // @regex ^https?://[a-zA-Z0-9.-]+$ @regex ^ftp://[a-zA-Z0-9.-]+$
  NODE_ENV: NodeEnv;
  PORT: string; // @regex ^\d+$
  }
  ```

  - To generate basic env.d.ts from .env file:

  ```bash
      env-utility generate
      Options:
        -e, --env-file  Path to the .env file             [string] [default: "./.env"]
        -d, --dts-file  Path to the env.d.ts file     [string] [default: "./env.d.ts"]
  ```

- You have to ways to validate the env, either from CLI or importing `validateEnv` in you code :

  - CLI:

    ```
    env-utility validate
    Options:
    -e, --env-file Path to the .env file [string] [default: "./.env"]
    -d, --dts-file Path to the env.d.ts file [string] [default: "./env.d.ts"]
    ```

    Add to your `package.json`

        ```json
        {
          "scripts": {
            "prebuild": "env-utility validate"
          }
        }
        ```

  - Import validateEnv:
    ```ts
    import { validateEnv } from "env-utility";
    validateEnv();
    ```

From the example above, if you have invalid `.env` file:

```
API_URL=https2://api.example.com
NODE_ENV=developments
PORT=3000
```

The output will be:

```
Environment variable validation failed:
- API_URL: API_URL does not match any of the required patterns: ^https?://[a-zA-Z0-9.-]+$, ^ftp://[a-zA-Z0-9.-]+$
- NODE_ENV: Invalid enum value. Expected 'development' | 'production', received 'developments'
```
