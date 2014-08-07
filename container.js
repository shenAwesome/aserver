var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var _ = require("lodash");

var cache = {};
var cacheTime = {};
function getCache(key, timestamp) {
    var value = cache[key];
}

var cache = (function () {
    var _values = {};
    var _prints = {};
    function get(key, fingerPrint) {
        var v = _values[key];
        if (fingerPrint && _prints[key] != fingerPrint) {
            return null;
        }
        return v;
    }
    function put(key, value, fingerPrint) {
        _values[key] = value;
        _prints[key] = fingerPrint;
    }
    return { get: get, put: put };
}())
//get file, return cached if unmodified
function getFile(filename, callback) {
    fs.stat(filename, function (err, stat) {
        if (err) {
            callback(true, null);
        } else {
            var timestamp = stat.mtime;
            var code = cache.get(filename, timestamp);
            if (code) {
                callback('', code);
            } else {
                fs.readFile(filename, 'utf8', function (err, data) {
                    if (!err) cache.put(filename, data, timestamp);
                    callback(err, data);
                });
            }
        }
    });
}

function format(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
    });
};


function split(str, splitter, callback) {
    var list = str.split(splitter);
    callback(list[0], list.length > 1 ? list[1] : '');
}

function start(port, options) {
    var app = express();

    app.use(function (req, res, next) {
        console.log('%s %s', req.method, req.url);
        next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.json({ type: 'application/vnd.api+json' }))
    //route to app
    app.use(function (req, res, next) {
        var path, query, file, extension;
        split(req.url, '?', function (a, b) {
            path = a;
            query = b;
        });
        var paths = _.compact(path.split('/'));
        var file = paths[paths.length - 1];
        paths.splice(paths.length - 1, 1);
        var path = paths.join('/');
        split(file, '.', function (a, b) {
            file = a;
            extension = b;
        });
        console.log(path + '/' + file + '.' + extension + '?' + query);
        //check file  
        var isScript = fs.existsSync('webapp/' + path + '/' + file + '.js');
        var filePath = 'webapp/' + path + '/' + file + '.' + (isScript ? 'js' : extension);
        getFile(filePath, function (err, data) {
            if (err) {
                console.log(">>>" + filePath);
                res.send(404);
            } else {
                if (isScript) {
                    try {
                        var html = eval(data);
                        html = eval(extension);
                        if (typeof html == 'function') {
                            html = html.call(req.query, req, res);
                        }
                        if (html) res.send(html);
                    } catch (e) {
                        res.send(500);
                    };
                } else
                    res.send(data);
            }
        });
    });
    port = port || 8000
    app.listen(port);
    console.log('server started at http://localhost:' + port);
}

module.exports = start;
