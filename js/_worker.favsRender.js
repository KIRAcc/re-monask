self.addEventListener('message', function(e) {
  var html = '';

  for(i = 0; i<e.data.length; i++) {
    var thread = e.data[i];

    //var monaInt = thread.receive.slice(0, -8);
    //if (monaInt === '') monaInt = '0';
    //var mona = parseFloat(monaInt + '.' + thread.receive.slice(-8));
    //html += '<p id="res_' +(i+1)+ '" style="margin-left:10px;">'; // レスのヘッダのブロック要素
    //html += '<span class="rh">' +(i+1)+ '</span> ：'; // レス番
    html += '<li><a href="#" class="ru" onclick="bbs_AM.showResponses(' + thread.t_id + ', false, true)">' + thread.title + '</a></li>'; // 名前
    //html += timetostr(thread.created) + '</span> ：'; // 時刻
    //html += '<span class="rm">+' + mona + 'MONA/' + thread.rec_count + '人</span>'; // 投げMONA
    //html += '</p> <p class="res lv' + thread.res_lv + '">';
    //html += thread.response.replace(/\n/g,"<br />").replace(/(https?:\/\/[^ <]+)/g,'<a target="_blank" rel="nofollow" href="$1">$1</a>').replace(/<a target="_blank" rel="nofollow" href="[^"]+">(http:\/\/i.imgur.com\/[A-Za-z0-9]+)(\.[^<]+)</g,'<a class="thumbnail" href="$1$2" target="_blank"><img src="$1l$2"><');//.replace(/"\/\//g,'"http://')+ '</p>';
  }
  //html += '<br />';
  self.postMessage(html);
  close();
}, false);

function timetostr(time){
  var objDate = new Date(time * 1000);
  var nowDate = new Date();
  var year = objDate.getFullYear();
  var month = objDate.getMonth() + 1;
  var date = objDate.getDate();
  var hours = objDate.getHours();
  var minutes = objDate.getMinutes();
  var seconds = objDate.getSeconds();
  if ( month < 10 ) { month = "0" + month; }
  if ( date < 10 ) { date = "0" + date; }
  if ( hours < 10 ) { hours = "0" + hours; }
  if ( minutes < 10 ) { minutes = "0" + minutes; }
  if ( seconds < 10 ) { seconds = "0" + seconds; }
  rtnValue = year + '/' + month + '/' + date + ' ' + hours + ':' + minutes + ':' + seconds;
  return rtnValue;
}
