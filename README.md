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

npm i -g newman newman-reporter-htmlextra
npm i -g newman-reporter-allure
npm i -g allure-commandline

newman run "postman/API Testing Demo.postman_collection.json" -r htmlextra --reporter-htmlextra-export "postman/newman-report.html"

newman run "API Testing Demo.postman_collection.json" -r cli,allure --reporter-allure-resultsDir ".\allure-results"
allure generate .\allure-results -o .\allure-report --clean
allure open .\allure-report
```

