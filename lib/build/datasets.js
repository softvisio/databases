import Build from "#lib/build";
import sql from "#core/sql";
import fs from "fs";
import * as config from "#core/config";
import url from "url";

const SOURCES = ["continent", "country", "currency", "language", "timezone"];

export default class extends Build {

    // protected
    async _getUpdated () {
        for ( const source of SOURCES ) {
            const sourcePath = this.sourcesDir + "/" + source + ".json";

            if ( !fs.existsSync( sourcePath ) ) return result( [404, `Source "${source}" not found`] );

            const json = config.read( sourcePath );

            this.hash.update( JSON.stringify( json ) );
        }

        return result( 200, { "hash": this.digest } );
    }

    async _build ( path ) {
        const dbh = await sql.new( url.pathToFileURL( path ) );

        await dbh.exec( sql`

-- continent
CREATE TABLE "continent" (
    "id" text PRiMARY KEY NOT NULL, -- iso2
    "iso2" text NOT NULL,
    "name" text NOT NULL
);

CREATE UNIQUE INDEX idx_continent_name ON "continent" ("name");

-- currency
CREATE TABLE "currency" (
    "id" text PRIMARY KEY NOT NULL, -- iso3
    "iso3" text NOT NULL,
    "name" text NOT NULL,
    "symbol" text NOT NULL
);

CREATE UNIQUE INDEX idx_currency_name ON "currency" ("name");
CREATE INDEX idx_currency_symbol ON "currency" ("symbol");

-- country
CREATE TABLE "country" (
    "id" text PRIMARY KEY NOT NULL, -- iso2
    "iso2" text NOT NULL,
    "iso3" text NOT NULL,
    "ison" text NOT NULL,
    "name" text NOT NULL,
    "official_name" text NOT NULL,
    "flag" text NOT NULL,
    "flag_unicode" text NOT NULL,
    "continent" text NOT NULL,
    "timezones" json,
    "tld" text,
    "postal_code_format" text,
    "postal_code_regexp" text,
    "calling_code" text,
    "locales" json,
    "languages" json NOT NULL,
    "region" text NOT NULL,
    "subregion" text NOT NULL,
    "currencies" json NOT NULL,
    "currency" text,
    "coordinates" json
);

CREATE UNIQUE INDEX idx_country_iso3 ON "country" ("iso3");
CREATE UNIQUE INDEX idx_country_name ON "country" ("name");

-- language
CREATE TABLE "language" (
    "id" text PRIMARY KEY NOT NULL, -- iso3
    "iso3" text NOT NULL,
    "iso2" text,
    "name" text NOT NULL,
    "bibliographic" text
);

CREATE UNIQUE INDEX idx_language_iso2 ON "language" ("iso2");
CREATE UNIQUE INDEX idx_language_name ON "language" ("name");

-- timezone
CREATE TABLE "timezone" (
    "id" text PRIMARY KEY NOT NULL, -- name
    "name" text NOT NULL,
    "abbr" text NOT NULL
);

CREATE INDEX idx_timezone_abbr ON "timezone" ("abbr");

    ` );

        for ( const source of SOURCES ) {
            const sourcePath = this.sourcesDir + "/" + source + ".json";

            const json = config.read( sourcePath );

            const res = await dbh.do( dbh.queryToString( sql`INSERT INTO "__name__"`.VALUES( json ) ).replace( "__name__", source ) );

            if ( !res.ok ) return res;
        }

        dbh.db.close();

        return result( 200 );
    }
}