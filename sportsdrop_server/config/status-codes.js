function hrMinSec(hr, min, sec) {
    hr = hr * 3600;
    min = min * 60;
    sec = sec * 1;
    return hr + min + sec;
};

module.exports = {
    DATAOK: 1,
    NODATA: -1,
    BADREQ: 400,
    UNAUTHORIZED: 401,
    UNAUTHENTICATED: 403,
    SESSION_EXPIRE_TIME: function () {
        return Math.round(new Date().getTime() / 1000) + hrMinSec(2, 0, 0)
    }
};