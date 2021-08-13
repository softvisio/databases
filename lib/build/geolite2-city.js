import Build from "#lib/build";

const ID = "GeoLite2-City";

export default class extends Build {

    // protected
    async _getUpdated () {
        return this._checkMaxmind( ID );
    }

    async _build ( path ) {
        return this._downloadMaxmind( ID );
    }
}