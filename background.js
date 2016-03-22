//background.js仅在加载插件时执行一次
var settings = {
	crawlName:'cdf',
	interval:0.05,
	//Webpage Screenshot扩展ID
	externalId:"haofdcifapgaogjhhnmaelbcbbemmakc",
	//截图扩展的tab地址
	externalUrl:"editor.html"
}
var crawlLevel = 1;
//建立websocket连接
//var ws = new WebSocket("ws://localhost");//http使用
//var ws = new WebSocket("wss://localhost");//https使用
var socket = io.connect('http://localhost');
//定时请求CrawlUrl
function getCrawlUrl(){
	//获取TabCount
	chrome.tabs.query({}, function(tabs) {
		var tabCount = tabs.length;
		var tmpSocket = socket.emit('getCrawlUrl', {crawlName: settings.crawlName,tabCount:tabCount});
		tmpSocket.sendBuffer = [];
	});
}
chrome.alarms.create('getCrawlUrl', { periodInMinutes: settings.interval});
//setInterval("getCrawlUrl()",settings.interval);
socket.on('getCrawlUrl', function (data) {
	if(data.crawingUrl!=null){
		chrome.tabs.create({url:data.crawingUrl})
	}
});
//如果socket可以连通，则将storage的内容发送到后端保存
if(socket.connected){
	chrome.storage.local.get("post_url",function(data){
		if(data.post_url!=null){
			socket.emit("post_url",{crawlName:settings.crawlName,post_urlList:data.post_url});
		}
	})
	chrome.storage.local.get("post_detail_data",function(data){
		if(data.post_detail_data!=null){
			socket.emit("post_detail_data",{crawlName:settings.crawlName,post_detail_data:data.post_detail_data});
		}
	})
}

//接收content_script发送的消息提交到服务器
chrome.extension.onMessage.addListener(function(request, sender, sendRequest){
	request.crawlName = settings.crawlName;
	//判断消息类型
	if(request.messageType=='post_url'){
		var tmpSocket = socket.emit("post_url",{crawlName:settings.crawlName,post_urlList:request.post_urlList});
		tmpSocket.send();
		if(!tmpSocket.connected){
			//清空sendBuffer
			tmpSocket.sendBuffer = [];
		}
		//如果网络中断则保存在storage
		checkSocket(tmpSocket,"post_url",request.post_urlList);
		//截图
		chrome.extension.sendRequest(settings.externalId,{},function(response){
			//关闭Tab释放资源
			if(response!=null){
				//chrome.tabs.remove(sender.tab.id);
			}
		});
	}else if(request.messageType=='post_detail_data'){
		var tmpSocket = socket.emit('post_detail_data',{crawlName:settings.crawlName,'post_detail_data':request.post_detail_data});
		tmpSocket.send();
		if(!tmpSocket.connected){
			//清空sendBuffer
			tmpSocket.sendBuffer = [];
		}
		//如果网络中断则保存在storage
		checkSocket(tmpSocket,"post_detail_data",request.post_detail_data);
	}else if(request.messageType=='errorUrl'){
		socket.emit('errorUrl', request);
	}else if(request.messageType=='closeTab'){
		//截图
		chrome.extension.sendRequest(settings.externalId,{url:sender.tab.url},function(response){
			//关闭Tab释放资源
			chrome.tabs.remove(sender.tab.id);
		});
	}
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm && alarm.name == 'getCrawlUrl') {
        getCrawlUrl();
    }else if(alarm && alarm.name == 'downloadImage'){
	    downloadImage();
    }else if(alarm && alarm.name == 'clickCommentPage'){
	    
    }
});

//定时将截取的图片下载到本地保存
chrome.alarms.create('downloadImage', {periodInMinutes: settings.interval});
function downloadImage(){
	chrome.tabs.query({}, function(tabs) {
		for(var i=0;i<tabs.length;i++){
			if(tabs[i].url.indexOf(settings.externalUrl)!=-1){
				//保存图片
				chrome.tabs.executeScript(tabs[i],{code:"getImageSrc();", allFrames: true},function(imageSrc){
					if(imageSrc.length!=0){
						chrome.downloads.download({url: imageSrc[0]});
						chrome.tabs.remove(tabs[i].id);
					}
				});
			}
		}
	});
}

//判断websocket是否连通，如果不通，保存到本地
function checkSocket(socket,key,value){
	if(!tmpSocket.connected){
			chrome.storage.local.get(key,function(data){
				if(data[key]==null){
					chrome.storage.local.set({key:value}, function(){
					});
				}else{
					var tmpArray = data[key].concat(value);
					chrome.storage.local.set({key:tmpArray}, function(){
					});
				}
			})
	}
}

//定时点击某个评论页面
/*chrome.alarms.create('clickCommentPage', { periodInMinutes: settings.interval});
function clickCommentPage(){
	chrome.tabs.query({}, function(tabs) {
		for(var i=0;i<tabs.length;i++){
			if((tabs[i].url.indexOf("detail.tmall.com/item.htm")!=-1)
			|| (tabs[i].url.indexOf("taobao.com/item")!=-1)){
				//获取下一页的评论
				chrome.tabs.executeScript(tabs[i],{code:"nextPage();", allFrames: true},function(postData){
					if(postData=="exception"){
						//将异常URL地址保存到服务器
						socket.emit('errorUrl', {crawlName:settings.crawlName,errorUrl:tabs[i].url});
					}else if(postData!=null && postData.length!=0){
						//保存数据到服务器（注：此处和之前的代码基本重复，为了测试方便，暂且不提取出来）
						socket.emit('post_detail_data',{crawlName:settings.crawlName,'post_detail_data':postData});
					}else if(postData==null){
						chrome.tabs.remove(tabs[i].id);
					}
				});
			}
		}
	});
}*/

