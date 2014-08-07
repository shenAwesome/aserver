var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');   

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

function format(format) {
	var args = Array.prototype.slice.call(arguments, 1);
	return format.replace(/{(\d+)}/g, function(match, number) { 
	  return typeof args[number] != 'undefined'
		? args[number] 
		: match
	  ;
	});
};

function start(port,options){ 
	var S = { 
		html:'html',
		service:'service' 
	}
	if (options) for (var k in options){
		S[k] = options[k];
	} 
	
	//create samples if folders don't exist!
	fs.exists(S.html, function(exists){
		if (exists) return;
		var df = S.html+'/index.html'
		var html = format("<h1>This is the sample page at {0} </h1>\n"
		+"A sample service is <a href='service/test/hello?name=Alex'>here</a> ",df); 
		fs.mkdirSync(S.html);
		fs.writeFile(df,html,function(){}); 
		console.log(df+ ' created');
	});
	fs.exists(S.service, function(exists){
		if (exists) return; 
		var df = S.service+'/test.js'
		var code =  "function hello(q){\n"
				 +  "	return {name:q.name,msg:'hello'} ;\n"
				 +  "}";  
		fs.mkdirSync(S.service);
		fs.writeFile(df,code,function(){}); 
		console.log(df + ' created');
	});
	
	var app = express();  
	
	app.use(express.static(S.html));
	
	app.get('/service/*', function(req, res){
		var paths = req.params[0].split('/'), len = paths.length; 
		var module = paths.slice(0,len-1).join('/');
		var method = paths[len-1]; 
		var filename = S.service+'/'+module+'.js'  
		
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

	app.use(bodyParser.json());
	app.use(bodyParser.json({ type: 'application/vnd.api+json' }))  
	
	port = port||8000
	app.listen(port);  
	console.log('server started at http://localhost:'+port);
} 

module.exports = start;
