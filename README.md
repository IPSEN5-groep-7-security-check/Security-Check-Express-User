# Security-Check-Express-User

# Install packages

npm install

# Start API
```sh
node server.js
```

# Init Prisma submodule

docs: https://git-scm.com/book/en/v2/Git-Tools-Submodules


```sh
git submodule update --init --recursive
```
```sh
see difference prisma: git diff --cached --submodule
```

# Connect to Planetscale database

1. [Install](https://github.com/planetscale/cli#installation) the pscale commandline tool

2. Login

    ```sh
    pscale auth login
    ```

3. Run local proxy

    ```sh
    pscale connect ipsen5 --port 3309
    ```

4. Generate prisma client if you haven't already

    ```sh
    npx prisma generate
    ```


# View data

```sh
npx prisma studio
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
