var cheerio = require('cheerio'),
    http = require('http')


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
            // console.log(html);
            newsList = parseHtml(html)
            // console.log(newsList);
            resolve(newsList)
        });
    })
}).then((res)=>{
    console.log(res);
})

function parseHtml(html) {
    var newsList = [];
    var $ = cheerio.load(html); //cheerio模块开始处理 DOM处理
    $("div.viewport ul li").each(function(){
        var oneNews = {};
        oneNews.link = $(this).find("a.latest_item").eq(0).attr('href');
        oneNews.title = $(this).find("a.latest_item").eq(0).find('p.latest_title').text();
        console.log(oneNews);  //控制台输出
        newsList.push(oneNews);
    });
    return newsList
}


