# kaavapino-ui
[![Build Status](https://travis-ci.com/City-of-Helsinki/kaavapino-ui.svg?branch=master)](https://travis-ci.com/City-of-Helsinki/kaavapino-ui)
[![codecov](https://codecov.io/gh/City-of-Helsinki/kaavapino-ui/branch/master/graph/badge.svg)](https://codecov.io/gh/City-of-Helsinki/kaavapino-ui)

UI for editing city planning projects in [Kaavapino API](https://github.com/City-of-Helsinki/kaavapino)

### How to run

Before running, make sure that you have created a .env file to the project root with the following environmental variables:
`REACT_APP_OPENID_CONNECT_CLIENT_ID=X`
`REACT_APP_OPENID_AUDIENCE=X`
`REACT_APP_BASE_URL=X` (only needed in production, locally uses proxy, which is defined in `package.json`)
`REACT_APP_SENTRY_URL=X` (only needed in production)
'REACT_APP_ENVIRONMENT=X' (production, development, testing, staging)
'REACT_APP_OPENID_ENDPOINT=X'

1. `yarn install`
2. `yarn start`


## Developing with fake login (tmporary solution)
To generate token:

- fire up backend
- run in api-directory for your username and email

```
docker-compose -f ./docker-compose.yml exec api ./manage.py createsuperuser
```

If not working try (Windows):

```
docker exec -it kaavapino-api /bin/bash
python ./manage.py createsuperuser
```

- add token for the same username

```
docker-compose -f ./docker-compose.yml exec api ./manage.py create_api_token <username>
```

If not working try (Windows):

```
docker exec -it kaavapino-api /bin/bash
python ./manage.py create_api_token <user>
```

- Add generated token to frontend .env as REACT_APP_API_TOKEN

## Generating api data

- fire up backend
- copy päivittyvä_Kaavaprojektitiedot.xls to api directory (see Teams)
- run in api directory

```
docker-compose -f ./docker-compose.yml exec api ./manage.py import_attributes päivittyvä_Kaavaprojektitiedot.xlsx
```

If not working try (Windows):

```
docker exec -it kaavapino-api /bin/bash
python manage.py import_attributes päivittyvä_Kaavaprojektitiedot.xlsx
```

## Deploy staging

Install kubectl locally. Check version and run:
```
#> pwd
... kaavapino/web/deploy/rancher
#> ./deploy_staging_web.sh web:<version> run
```
 