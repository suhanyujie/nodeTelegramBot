var cheerio = require('cheerio'),
    http = require('http'),
    https = require('https'),
    botConfig = require('./config/telegramBot')

function get() {
    var options = {
        host: 'www.flw.ph',
        port: 80,
        path: '/',
        agent: false  // 仅为此一个请求创建一个新代理。
    };
    return new Promise(function (resolve, reject) {
        var req = http.get(options,(res)=>{
            resolve(res)
        });
        // console.log(req);
    });
}
get().then(function (res) {
    var newsList = [];
    var chunks = [];
    var size = 0;
    res.on('data',function(chunk){   //监听事件 传输
        chunks.push(chunk);
        size += chunk.length;
    });
    return new Promise((resolve, reject)=>{
        res.on('end',function(){  //数据传输完
            var data = Buffer.concat(chunks,size);
            var html = data.toString();
            newsList = parseHtml(html)
            // console.log(newsList);
            resolve(newsList)
        });
    })
}).then((res)=>{
    return new Promise(function(resolve, reject){
        resolve(renderHtml(res))
    })
}).then((res)=>{
    return sendToTelegramBot(res)
}).then((res)=>{
    console.log(res)
}).then((res)=>{
    console.log(res)
})

function parseHtml(html) {
    var newsList = [];
    var $ = cheerio.load(html); //cheerio模块开始处理 DOM处理
    $("div.viewport ul li").each(function(){
        var oneNews = {};
        oneNews.link = $(this).find("a.latest_item").eq(0).attr('href');
        oneNews.title = $(this).find("a.latest_item").eq(0).find('p.latest_title').text();
        // console.log(oneNews);  //控制台输出
        newsList.push(oneNews);
    });
    return newsList
}

function renderHtml(newsList) {
    if (newsList.length<1) return '';
    let baseUrl = "http://www.flw.ph"
    var html = "<strong>菲华网今日要闻：</strong>\n"
    var contentArr = new Array()
    newsList.forEach(function (value,key) {
        value.link = baseUrl+"/"+value.link
        contentArr.push('<b>'+(key+1)+'. </b><a href="'+value.link+'">'+value.title+'</a>'+"\n")
    })
    html += contentArr.join("")
    return html
}

function sendToTelegramBot(content) {
    let botConfigData = botConfig
    console.log(botConfigData.apiToken)
    var postData = {
        chat_id:botConfigData.chatRoomId1,
        parse_mode:"HTML",
        text:content
    }
    content = JSON.stringify(postData);
    var options = {
        hostname: botConfigData.apiUrl,
        port: 443,
        path: '/bot'+botConfigData.apiToken+"/sendMessage",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;'
        }
    };
    return new Promise((resolve, reject)=>{
        var resChunk = [],
            size = 0
        var req = https.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                console.log(chunk)
                resChunk.push(chunk)
                size += chunk.length
            });
            res.on('end',()=>{
                console.log(resChunk)
                resolve(resChunk)
            })
        });
        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });
        req.write(content)
        req.end()
    })
}
