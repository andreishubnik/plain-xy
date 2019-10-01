log = console.log;

var TG_TARGET_PROTOCOL = "http";
var TG_TARGET_IP = "149.154.167.51";
var TG_TARGET_PORT = 80;
var TG_TARGET_PATH = "/api";
var EXPECTED_INCOMING_URL = TG_TARGET_PROTOCOL + "://" + TG_TARGET_IP + ":" + TG_TARGET_PORT + TG_TARGET_PATH;

var PORT = process.env.PORT || 8080;
var SELECTED_CONNECTION_STRATEGY = process.env.CONNECTION || 'close';

var queryOptions = {
	"host" : TG_TARGET_IP,
	"port" : TG_TARGET_PORT,
	"method" : "POST",
	"path" : TG_TARGET_PATH
};

var http = require('http');

var httpServer = http.createServer((req,clientRes)=>{
	if(req.url=='/' || !req.headers.host){
		clientRes.end("418 I'm a teapot");
		return;
	}
	var errorOccured = false;
	var rejectRequest = e=>{
		errorOccured = true;
		log(e);
		clientRes.statusCode = 503;
		clientRes.end();
	};
	var tgReq = http.request({
		...queryOptions,"host":req.headers.host,
		"headers":{...req.headers,"host":null,"Connection":SELECTED_CONNECTION_STRATEGY}
	},tgRes=>{
		if(tgRes.statusCode==200){
			clientRes.writeHead(200,{...tgRes.headers,"Connection":SELECTED_CONNECTION_STRATEGY});
			tgRes.on('data',data=>errorOccured || clientRes.write(data));
			tgRes.on('end',$=>clientRes.end());
			tgRes.on('error',rejectRequest);
		}else{
			rejectRequest('target responded with ' + tgRes.statusCode + ' url: ' + req.headers.host);
		}
	}).on('error',rejectRequest);
	req.on('data',data=>errorOccured || tgReq.write(data));
	req.on('end',$=>tgReq.end());
	req.on('error',rejectRequest);
});

httpServer.listen(PORT,$=>log(`plain-xy up on ${PORT}`));

process.on('uncaughtException', function (err) {
	log('uncaught', err);
});
process.on('uncaughtRejection', function (err) {
	log('uncaughtRejection', err);
});
