var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser'); 

var app = express();  

app.get('/', function(req, res){
  res.send('OK');
}); 

app.use(express.static('app/html'));

app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' })) 

var cache = {};
var cacheTime = {};
function getCache(key,timestamp){
	var value = cache[key];
}

var cache = (function(){
	var _values = {};
	var _prints = {};
	function get(key,fingerPrint){
		var v = _values[key];
		if (fingerPrint&&_prints[key]!=fingerPrint){
			return null;
		}
		return v;	
	} 
	function put(key,value,fingerPrint){
		_values[key]=value;
		_prints[key]=fingerPrint;
	}
	return {get:get,put:put};
}())
//get file, return cached if unmodified
function getFile(filename,callback){
	fs.stat(filename, function(err, stat) {
		if (err){
			callback(true,null); 
		}else{
			var timestamp = stat.mtime; 
			var code = cache.get(filename,timestamp);
			if (code){
				callback('',code);
			}else{
				fs.readFile(filename, 'utf8', function(err,data){
					if (!err) cache.put(filename,data,timestamp);
					callback(err,data); 
				}); 
			} 
		} 
	}); 
}

app.get('/service/*', function(req, res){
	var paths = req.params[0].split('/'), len = paths.length; 
	var module = paths.slice(0,len-1).join('/');
	var method = paths[len-1]; 
	var filename = 'app/service/'+module+'.js'  
	
	getFile(filename,function(err, data) { //'utf8', 
		var html = filename +' is not existing' ;
		if (!err) try{
			html = eval(data); 
			if (method) html = eval(method); 
			if (typeof html == 'function'){
				html = html(req.query,req,res);
			}
		}catch(e){
			html = e+'';
		} 
		res.send(html);
	});
});

function start(port){
	port = port||8000;
	app.listen(port); 
} 

