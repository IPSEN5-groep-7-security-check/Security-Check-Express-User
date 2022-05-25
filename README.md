# Security-Check-Express-User

# Install packages

npm install

# Start API
```sh
node server.js
```

# Prisma & Database

## Init Prisma git submodule

docs: https://git-scm.com/book/en/v2/Git-Tools-Submodules


```sh
git submodule update --init --recursive
```
```sh
see difference prisma: git diff --cached --submodule
```

## Connect to Planetscale database

1. [Install](https://github.com/planetscale/cli#installation) the pscale commandline tool

2. Login

    ```sh
    pscale auth login
    ```

3. Switch to the `ipsen5` organization if you haven't already

    ```sh
    pscale org switch ipsen5
    ```

4. Run local proxy for the `ipsen5` database `develop` branch.

    ```sh
    pscale connect ipsen5 develop --port 3309
    ```

5. Generate prisma client if you haven't already

    ```sh
    npx prisma generate
    ```

## Useful Prisma commands

### View data

```sh
npx prisma studio
```

## Reset the database

```sh
npx prisma migrate reset
npx prisma db push
```

# Overwegingen

- Waarom hebben we een maximum aantal scan per gebruiker?
  - Kunnen we deze requiment laten vallen?
  - Gebruikers identificeren
    - Is IP de juiste methode om verschillende gebruikers te identiciferen?
      - Hoe gaan we om met proxies?
    - Finger printing? https://www.amiunique.org/fp
- Wat willen we precies loggen?
  - Scan is gestart
  - Scan is voltooid
  - Scan heeft gefaald
- Error handling
