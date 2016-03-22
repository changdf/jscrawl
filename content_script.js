//页面加载完毕再执行
$(function(){
	var settings = {
		maxCommentPage:50,
		sleepTime:1000,
		//如果获取不到元素，尝试的次数
		tryCount:2,
		//用于判断是否是所要抓取的域名
		crawlDomain:["taobao","tmall"],
		loginDomain:"login.taobao.com",
		scrollDistance:1000
	}
	function tryAgain(f){
		for(var i=0;i<settings.tryCount;i++){
			//setTimeout(f,settings.sleepTime);
			sleepFor(settings.sleepTime);
			if((f()!=null && !(f() instanceof Array)) || (f() instanceof Array && f().length!=0)){
				break;
			}
		}
	}

	//获取当前要抓取的网址
	var crawlUrl = window.location.href;
	var isCrawlDomain = false;
	for(var i=0;i<settings.crawlDomain.length;i++){
		if(crawlUrl.indexOf(settings.crawlDomain[i])!=-1){
			isCrawlDomain = true;
			break;
		}
	}

	if(!isCrawlDomain){
		return;
	}
	//判断是否需要重新登录
	if(crawlUrl.indexOf(settings.loginDomain)!=-1){
		document.getElementById("TPL_username_1").value = "";
		document.getElementById("TPL_password_1").value = "";
		document.getElementById("J_SubmitStatic").click();
	}
	//检查当前链接是否正常抓取，如果没有，则保存到服务器
	var isException = false;

	//根据url地址解析内容或根据模式匹配解析内容
	if((crawlUrl.indexOf("s.taobao.com/search")!=-1 && crawlUrl.indexOf("search_type")!=-1)
		|| (crawlUrl.indexOf("s.taobao.com/list")!=-1 && crawlUrl.indexOf("app=vproduct")!=-1)
	){
		//滚动到页面底部，保证所有Ajax内容全部加载出来
		var f1 = function(){
			var count = 0;
			for(var i=0;i<5;i++){
				setTimeout("window.scrollTo("+count*settings.scrollDistance+","+(count+1)*settings.scrollDistance+");",settings.sleepTime*(count+1));
				count++;
			}
			//搜索页提取链接
			f2 = function (){
				var allUrl = document.querySelectorAll("div.title-row > a");
				var urlList = [];
				for(var i=0;i<allUrl.length;i++){
					urlList.push(allUrl[i].href);
				}
				if(urlList.length!=0){
					chrome.extension.sendMessage({messageType:"post_url","post_urlList":urlList});
					//获取当前页
					var pageXPath = document.evaluate("//*[contains(text(),'下一页')]/../../..//*[contains(@class,'active')]/span/text()",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
					if(pageXPath==null){
						chrome.extension.sendMessage({messageType:"closeTab"});
						return;
					}
					var currentPageNum = parseInt(pageXPath.textContent);
					var nextPage = document.evaluate("//*[contains(text(),'下一页')]/../../..//*[contains(@class,'next')]/a",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
					if(nextPage==null){
						//所有页数已经抓取完毕
						chrome.extension.sendMessage({messageType:"closeTab"});
						return;
					}
					//点击下一页
					nextPage.click();
					var m = function(){
						//判断是否加载完成
						var tmpXPath = document.evaluate("//span[contains(@class,'current')]/text()",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
						var tmpPageNum = parseInt(tmpXPath.textContent);
						if(tmpXPath!=null && tmpPageNum!=currentPageNum){
							clearInterval(n);
							var event = document.createEvent('HTMLEvents');
							event.initEvent('pageLoad', true, false);
							event.eventType = 'urlList';
							document.dispatchEvent(event);
						}
					}
					//定时检测页面是否加载完成
					var n = setInterval(m, 1000);
				}else{
					isException = true;
					chrome.extension.sendMessage({messageType:"errorUrl","errorUrl":crawlUrl});
				}
			};
			setTimeout("f2()",settings.sleepTime*(count+1));
		}
		//首次执行抓取
		f1();
		document.addEventListener('pageLoad', function (event) {
			if(event.eventType=="urlList"){
				//处理下一页的内容
				f1();
			}
		}, false);
	}else if((crawlUrl.indexOf("s.taobao.com/search")!=-1 && crawlUrl.indexOf("spu_title")!=-1)
	||(crawlUrl.indexOf("s.taobao.com/list")!=-1 && crawlUrl.indexOf("app=detailproduct")!=-1)
	){
		//滚动到页面底部，保证所有Ajax内容全部加载出来
		var f1 = function(){
			var count = 0;
			for(var i=0;i<5;i++){
				setTimeout("window.scrollTo("+count*settings.scrollDistance+","+(count+1)*settings.scrollDistance+");",settings.sleepTime*(count+1));
				count++;
			}
			//搜索页提取链接
			f2 = function (){
				var allUrl = document.querySelectorAll("div.col.col-2 > p > a");
				var urlList = [];
				for(var i=0;i<allUrl.length;i++){
					urlList.push(allUrl[i].href);
				}
				if(urlList.length!=0){
					chrome.extension.sendMessage({messageType:"post_url","post_urlList":urlList});
					//获取当前页
					var	pageXPath = document.evaluate("//*[contains(text(),'下一页')]/../../..//*[contains(@class,'active')]/span/text()",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
					if(pageXPath==null){
						chrome.extension.sendMessage({messageType:"closeTab"});
						return;
					}
					var currentPageNum = parseInt(pageXPath.textContent);
					var nextPage = document.evaluate("//*[contains(text(),'下一页')]/../../..//*[contains(@class,'next')]/a",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
					if(nextPage==null){
						//所有页数已经抓取完毕
						chrome.extension.sendMessage({messageType:"closeTab"});
						return;
					}
					//点击下一页
					nextPage.click();
					var m = function(){
						//判断是否加载完成
						var tmpXPath = document.evaluate("//span[contains(@class,'current')]/text()",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
						var tmpPageNum = parseInt(tmpXPath.textContent);
						if(tmpXPath!=null && tmpPageNum!=currentPageNum){
							clearInterval(n);
							var event = document.createEvent('HTMLEvents');
							event.initEvent('pageLoad', true, false);
							event.eventType = 'urlList';
							document.dispatchEvent(event);
						}
					}
					//定时检测页面是否加载完成
					var n = setInterval(m, 1000);
				}else{
					isException = true;
					chrome.extension.sendMessage({messageType:"errorUrl","errorUrl":crawlUrl});
				}
			};
			setTimeout("f2()",settings.sleepTime*(count+1));
		}
		//首次执行抓取
		f1();
		document.addEventListener('pageLoad', function (event) {
			if(event.eventType=="urlList"){
				//处理下一页的内容
				f1();
			}
		}, false);
	}else if((crawlUrl.indexOf("detail.tmall.com/item.htm")!=-1)
			|| (crawlUrl.indexOf("taobao.com/item")!=-1)
	){
		//详情页（包含评论）
		//获取不到可能是网页没有加载出来，sleep一下
		if(document.querySelector("#J_Title > h3")==null){
			var f = function(){
				return document.querySelector("#J_Title > h3");
			}
			tryAgain(f);
		}
		//获取产品名称
		var productName = null;
		if(document.querySelector("#J_Title > h3")!=null){
			productName = document.querySelector("#J_Title > h3").innerText;
		}
		//获取评论(最多抓取50页)
		var comment_click = document.evaluate("//a[contains(text(),'累计评论')]",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
		if(comment_click!=null){
			comment_click.click();
		}
		//ajax分页
		var pageCount = 0;
		var commentCount = 1;
		var sumCommentCount = parseInt(comment_click.querySelector("em").innerText);
		if(sumCommentCount!=0){
			var f = function(){
				//获取第一页的所有评论数
				var tmpCommentPath = document.evaluate("//span[contains(text(),'有用')]/../../../../div[1]/text()",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
				var length = tmpCommentPath.snapshotLength;
				var postData = [];
				for(var i=0;i<length;i++){
					postData.push(tmpCommentPath.snapshotItem(i).textContent);
				}
				if(postData.length==0){
					isException = true;
					chrome.extension.sendMessage({messageType:"errorUrl","errorUrl":crawlUrl});
				}else{
					//提交评论数据
					chrome.extension.sendMessage({messageType:"post_detail_data","post_detail_data":postData});
				}
			}

			//定时检测页面内容是否加载完毕，如果加载完毕则发送自定义事件pageLoad
			var f1 = function () {
				if(document.evaluate("//span[contains(text(),'有用')]",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0)!=null){
					clearInterval(m);
					var event = document.createEvent('HTMLEvents');
					event.initEvent('pageLoad', true, false);
					event.eventType = 'comment';
					document.dispatchEvent(event);
				}
			};
			var m = setInterval(f1, 1000);

			document.addEventListener('pageLoad', function (event) {
				if(event.eventType=="comment"){
					f();
					//下一页
					var nextPage = document.evaluate("//li[contains(text(),'下一页')]",document,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null).snapshotItem(0);
					if(nextPage==null || nextPage.className.indexOf("disabled")!=-1){
						//所有页数已经抓取完毕
						chrome.extension.sendMessage({messageType:"closeTab"});
						return;
					}else{
						nextPage.click();
						m = setInterval(f1, 1000);
					}
				}
			}, false);
		}
	}

	/*if(isException){
		chrome.extension.sendMessage({messageType:"errorUrl","errorUrl":crawlUrl});
	}*/
	function sleepFor(sleepDuration){
	    var now = new Date().getTime();
	    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
	}

});

function getImageSrc(){
	return document.getElementById("imgFixForLong").src;
}












