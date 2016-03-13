self.addEventListener('message', function(e) {
  var thread = e.data[0];
  var responses = e.data[1];
  var html = '';

  for(i = 0; i<responses.length; i++) {
    var res = responses[i];

    tipHtml = '<span><input type="button" value="0.114114" onclick="bbs_AM.sendToRes(' + thread.t_id + ', ' + (i+1) + ', 11411400)" /></span>';

    var monaInt = res.receive.slice(0, -8);
    if (monaInt === '') monaInt = '0';
    var mona = parseFloat(monaInt + '.' + res.receive.slice(-8));
    html += '<p id="res_' +(i+1)+ '" style="margin-left:10px;">'; // レスのヘッダのブロック要素
    html += '<span class="rh">' +(i+1)+ '</span> ：'; // レス番
    html += '<a href="#" class="ru" onclick="bbs_AM.showProfile(' + res.u_id + ')">' + res.u_name + res.u_dan + '</a>： '; // 名前
    html += timetostr(res.created) + '</span> ：'; // 時刻
    html += '<span class="rm">+' + mona + 'MONA/' + res.rec_count + '人</span> '; // 投げMONA
    html += '<a class="send" href="javascript:void(0);" onclick="bbs_AM.showSendWin(' + thread.t_id + ', ' + (i+1) + ')" title="' + escapeHtml(tipHtml) + '">←送る</a>'; // 
    html += '</p> <p class="res lv' + res.res_lv + '">';
    html += res.response.replace(/\n/g,"<br />").replace(/(https?:\/\/[^ <]+)/g,'<a target="_blank" rel="nofollow" href="$1">$1</a>').replace(/<a target="_blank" rel="nofollow" href="[^"]+">(http:\/\/i.imgur.com\/[A-Za-z0-9]+)(\.[^<]+)</g,'<a class="thumbnail" href="$1$2" target="_blank"><img src="$1l$2"><');//.replace(/"\/\//g,'"http://')+ '</p>';
  }
  html += '<br />';
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

function escapeHtml(content) {
  var TABLE_FOR_ESCAPE_HTML = {
    "&": "&amp;",
    "\"": "&quot;",
    "<": "&lt;",
    ">": "&gt;"
  };
  return content.replace(/[&"<>]/g, function(match) {
    return TABLE_FOR_ESCAPE_HTML[match];
  });
}
