'use strict';

var path = require('path'),
	fs = require('fs'),
	_existsSync = fs.existsSync || path.existsSync,
	formidable = require('formidable'),
	nodeStatic = require('node-static'),
	imageMagick = require('imagemagick'),
	auth = require('./auth.js'),
	Settings = require('mongoose').model('Settings'),
	User = require('mongoose').model('User'),
	Step = require('step'),
	
	qwert = 'hello',
	options = {
		rootpath: process.cwd(),
		tmpDir: process.cwd() + '/uploads/tmp',
		publicDir: process.cwd() + '/uploads/photos',
		uploadDir: process.cwd() + '/uploads/photos',
		uploadUrl: '/pup',
		maxPostSize: 500000000, // 500 MB
		minFileSize: 10,
		maxFileSize: 100000000, // 100 MB
		acceptFileTypes: /.+/i,
		// Files not matched by this regular expression force a download dialog,
		// to prevent executing any scripts in the context of the service domain:
		safeFileTypes: /\.(gif|jpe?g|png)$/i,
		imageTypes: /\.(gif|jpe?g|png)$/i,
		imageVersions: {
			'thumbnail': {
				width: 120,
				height: 120
			}
		},
		accessControl: {
			allowOrigin: '*',
			allowMethods: 'OPTIONS, HEAD, GET, POST, PUT, DELETE'
		},
		/* Uncomment and edit this section to provide the service via HTTPS:
		ssl: {
			key: fs.readFileSync('/Applications/XAMPP/etc/ssl.key/server.key'),
			cert: fs.readFileSync('/Applications/XAMPP/etc/ssl.crt/server.crt')
		},
		*/
		nodeStatic: {
			cache: 3600 // seconds to cache served files
		}
	},
	utf8encode = function (str) {
		return unescape(encodeURIComponent(str));
	},
	nameCountRegexp = /(?:(?: \(([\d]+)\))?(\.[^.]+))?$/,
	nameCountFunc = function (s, index, ext) {
		return ' (' + ((parseInt(index, 10) || 0) + 1) + ')' + (ext || '');
	};

module.exports.loadController = function (app, io) {
	
	app.get('/photoUpload', function(req, res){
		res.render('photoUpload.jade', {prettyprint:true, pageTitle: 'Upload photo', appHash: app.hash});
	});

	io.sockets.on('connection', function (socket) {
		var hs = socket.handshake,
			session = hs.session;
	});
	
	app.post('/pup', function(req, res){
		// TODO: move and rename the file using req.files.path & .name)
		setHeader(res);
		
		var handler = this,
			form = new formidable.IncomingForm(),
			tmpFiles = [],
			files = [],
			map = {},
			counter = 1,
			redirect,
			finish = function () {
				counter -= 1;
				if (!counter) {
					files.forEach(function (fileInfo) {
						fileInfo.initUrls(req);
					});
					handler.callback(files, redirect);
				}
			};
		
        form.uploadDir = options.tmpDir;
        form.on('fileBegin', function (name, file) {
            tmpFiles.push(file.path);
            var fileInfo = new FileInfo(file, req, true);
            fileInfo.safeName();
            map[path.basename(file.path)] = fileInfo;
            files.push(fileInfo);
        }).on('field', function (name, value) {
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file', function (name, file) {
            var fileInfo = map[path.basename(file.path)];
            fileInfo.size = file.size;
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }
            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    counter += 1;
                    var opts = options.imageVersions[version];
                    imageMagick.resize({
                        width: opts.width,
                        height: opts.height,
                        srcPath: options.uploadDir + '/' + fileInfo.name,
                        dstPath: options.uploadDir + '/' + version + '/' +
                            fileInfo.name
                    }, finish);
                });
            }
        }).on('aborted', function () {
            tmpFiles.forEach(function (file) {
                fs.unlink(file);
            });
        }).on('progress', function (bytesReceived, bytesExpected) {
            if (bytesReceived > options.maxPostSize) {
                req.connection.destroy();
            }
        }).on('end', finish).parse(req);
	});
	
	app.get('/pup', function(req, res){
		setHeader(res);
		
        var handler = this,
            files = [];
        fs.readdir(options.uploadDir, function (err, list) {
            list.forEach(function (name) {
                var stats = fs.statSync(options.uploadDir + '/' + name),
                    fileInfo;
                if (stats.isFile()) {
                    fileInfo = new FileInfo({
                        name: name,
                        size: stats.size
                    });
                    fileInfo.initUrls(req);
                    files.push(fileInfo);
                }
            });
            handler.callback(files);
        });
	});
	
	
	function setHeader(res){
            res.setHeader('Access-Control-Allow-Origin', options.accessControl.allowOrigin);
            res.setHeader('Access-Control-Allow-Methods', options.accessControl.allowMethods);
			res.setHeader('Pragma', 'no-cache');
			res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
			res.setHeader('Content-Disposition', 'inline; filename="files.json"');
	}

	var fileServer = new nodeStatic.Server(options.publicDir, options.nodeStatic),
		FileInfo = function (file) {
			this.name = file.name;
			this.size = file.size;
			this.type = file.type;
			this.delete_type = 'DELETE';
		},
		UploadHandler = function (req, res, callback) {
			this.req = req;
			this.res = res;
			this.callback = callback;
		};
		
	
	var serve = function (req, res) {
            res.setHeader(
                'Access-Control-Allow-Origin',
                options.accessControl.allowOrigin
            );
            res.setHeader(
                'Access-Control-Allow-Methods',
                options.accessControl.allowMethods
            );
            var handleResult = function (result, redirect) {
                    if (redirect) {
                        res.writeHead(302, {
                            'Location': redirect.replace(
                                /%s/,
                                encodeURIComponent(JSON.stringify(result))
                            )
                        });
                        res.end();
                    } else {
                        res.writeHead(200, {
                            'Content-Type': req.headers.accept
                                .indexOf('application/json') !== -1 ?
                                        'application/json' : 'text/plain'
                        });
                        res.end(JSON.stringify(result));
                    }
                },
                setNoCacheHeaders = function () {
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
                    res.setHeader('Content-Disposition', 'inline; filename="files.json"');
                },
                handler = new UploadHandler(req, res, handleResult);
            switch (req.method) {
            case 'OPTIONS':
                res.end();
                break;
            case 'HEAD':
            case 'GET':
                if (req.url === '/') {
                    setNoCacheHeaders();
                    if (req.method === 'GET') {
                        handler.get();
                    } else {
                        res.end();
                    }
                } else {
                    fileServer.serve(req, res);
                }
                break;
            case 'POST':
                setNoCacheHeaders();
                handler.post();
                break;
            case 'DELETE':
                handler.destroy();
                break;
            default:
                res.statusCode = 405;
                res.end();
            }
        };
    fileServer.respond = function (pathname, status, _headers, files, stat, req, res, finish) {
        if (!options.safeFileTypes.test(files[0])) {
            // Force a download dialog for unsafe file extensions:
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="' + utf8encode(path.basename(files[0])) + '"'
            );
        } else {
            // Prevent Internet Explorer from MIME-sniffing the content-type:
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        nodeStatic.Server.prototype.respond
            .call(this, pathname, status, _headers, files, stat, req, res, finish);
    };
    FileInfo.prototype.validate = function () {
        if (options.minFileSize && options.minFileSize > this.size) {
            this.error = 'minFileSize';
        } else if (options.maxFileSize && options.maxFileSize < this.size) {
            this.error = 'maxFileSize';
        } else if (!options.acceptFileTypes.test(this.name)) {
            this.error = 'acceptFileTypes';
        }
        return !this.error;
    };
    FileInfo.prototype.safeName = function () {
        // Prevent directory traversal and creating hidden system files:
        this.name = path.basename(this.name).replace(/^\.+/, '');
        // Prevent overwriting existing files:
        while (_existsSync(options.uploadDir + '/' + this.name)) {
            this.name = this.name.replace(nameCountRegexp, nameCountFunc);
        }
    };
    FileInfo.prototype.initUrls = function (req) {
        if (!this.error) {
            var that = this,
                baseUrl = (options.ssl ? 'https:' : 'http:') +
                    '//' + req.headers.host + options.uploadUrl;
            this.url = this.delete_url = baseUrl + encodeURIComponent(this.name);
            Object.keys(options.imageVersions).forEach(function (version) {
                if (_existsSync(
                        options.uploadDir + '/' + version + '/' + that.name
                    )) {
                    that[version + '_url'] = baseUrl + version + '/' +
                        encodeURIComponent(that.name);
                }
            });
        }
    };
    UploadHandler.prototype.get = function () {
        var handler = this,
            files = [];
        fs.readdir(options.uploadDir, function (err, list) {
            list.forEach(function (name) {
                var stats = fs.statSync(options.uploadDir + '/' + name),
                    fileInfo;
                if (stats.isFile()) {
                    fileInfo = new FileInfo({
                        name: name,
                        size: stats.size
                    });
                    fileInfo.initUrls(handler.req);
                    files.push(fileInfo);
                }
            });
            handler.callback(files);
        });
    };
    UploadHandler.prototype.post = function () {
        var handler = this,
            form = new formidable.IncomingForm(),
            tmpFiles = [],
            files = [],
            map = {},
            counter = 1,
            redirect,
            finish = function () {
                counter -= 1;
                if (!counter) {
                    files.forEach(function (fileInfo) {
                        fileInfo.initUrls(handler.req);
                    });
                    handler.callback(files, redirect);
                }
            };
        form.uploadDir = options.tmpDir;
        form.on('fileBegin', function (name, file) {
            tmpFiles.push(file.path);
            var fileInfo = new FileInfo(file, handler.req, true);
            fileInfo.safeName();
            map[path.basename(file.path)] = fileInfo;
            files.push(fileInfo);
        }).on('field', function (name, value) {
            if (name === 'redirect') {
                redirect = value;
            }
        }).on('file', function (name, file) {
            var fileInfo = map[path.basename(file.path)];
            fileInfo.size = file.size;
            if (!fileInfo.validate()) {
                fs.unlink(file.path);
                return;
            }
            fs.renameSync(file.path, options.uploadDir + '/' + fileInfo.name);
            if (options.imageTypes.test(fileInfo.name)) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    counter += 1;
                    var opts = options.imageVersions[version];
                    imageMagick.resize({
                        width: opts.width,
                        height: opts.height,
                        srcPath: options.uploadDir + '/' + fileInfo.name,
                        dstPath: options.uploadDir + '/' + version + '/' +
                            fileInfo.name
                    }, finish);
                });
            }
        }).on('aborted', function () {
            tmpFiles.forEach(function (file) {
                fs.unlink(file);
            });
        }).on('progress', function (bytesReceived, bytesExpected) {
            if (bytesReceived > options.maxPostSize) {
                handler.req.connection.destroy();
            }
        }).on('end', finish).parse(handler.req);
    };
    UploadHandler.prototype.destroy = function () {
        var handler = this,
            fileName;
        if (handler.req.url.slice(0, options.uploadUrl.length) === options.uploadUrl) {
            fileName = path.basename(decodeURIComponent(handler.req.url));
            fs.unlink(options.uploadDir + '/' + fileName, function (ex) {
                Object.keys(options.imageVersions).forEach(function (version) {
                    fs.unlink(options.uploadDir + '/' + version + '/' + fileName);
                });
                handler.callback(!ex);
            });
        } else {
            handler.callback(false);
        }
    };
    
	/*if (options.ssl) {
        require('https').createServer(options.ssl, serve).listen(8459);
    } else {
        require('http').createServer(serve).listen(8459);
    }*/
		 
};