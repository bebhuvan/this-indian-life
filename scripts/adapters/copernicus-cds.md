# Copernicus CDS Adapter Notes

Copernicus CDS uses the Python `cdsapi` client and a personal access token, not a normal JSON endpoint.

Local setup:

```bash
pip install "cdsapi>=0.7.7"
```

Then configure either `$HOME/.cdsapirc`:

```yaml
url: https://cds.climate.copernicus.eu/api
key: <PERSONAL-ACCESS-TOKEN>
```

or keep the token in `.env` as `CDSAPI_KEY` and have a future Python/R ingest job pass it to `cdsapi.Client`.

Important: each CDS dataset's terms must be accepted manually in the CDS portal before the API can download it.

