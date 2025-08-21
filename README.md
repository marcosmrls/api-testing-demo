# API Testing Demo

Incluye: API Node/Express + JWT, Postman/Newman, OpenAPI (contrato).

## Arranque del API
```bash
cd server
npm install
cp .env.example .env
npm start
```

## Postman/Newman
- Importa `postman/API Testing Demo.postman_collection.json`.
- Reporter HTML:
```bash
npm i -g newman-reporter-htmlextra
newman run "postman/API Testing Demo.postman_collection.json" -r htmlextra --reporter-htmlextra-export "postman/newman-report.html"
```

