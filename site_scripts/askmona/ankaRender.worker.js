self.addEventListener('message', function(e) {
  var thread = e.data[0];
  var responses = e.data[1];
  var anchors = e.data[2].split(',');
  var html = '';
  var tree = [];

  for(i = 0; i<anchors.length; i++) {
    var anchor = anchors[i] - 1;
    var res = responses[ anchor ];

    var text = res.response.replace(/>>([-0-9,\,]+)/g, function(matchText, ankaStr, pos, self){ //
      var anka = ankaStr.split(','), anchors = [];
      for(var i=0; i<anka.length; i++) {
        var arr = anka[i].split('-'); //ankaStr.match(/([0-9]{1,4})(-([0-9]{1,4}))?/)
        var low = parseInt(arr[0]), high = parseInt(arr[1]); // +をつけるだけで型変換までやってくれるんですよ！すごくないですか！？って言おうとしたけど小数弾きたいのでやめました。
        if(1 <= low && low <= 1001) { // ,で区切った安価が正常なレス番か
          if(!(1 <= high && high <= 1001)) high = low; // ,で区切られたレス指定が範囲指定で、かつ始、終ともにも正常なレス番か。でなければ、ここで調整
          if(low > high) low = [high, high = low][0]; // 変数の入れ替えだって一文でできるんです！
          for (var n=low; n<=high; n++) anchors.push(n);
        }
      }
      anchors = anchors.filter(function (x, i, self) { return self.indexOf(x) === i; }); // 重複している番号はここで消され…うわなにをするやめｒ
      return '<a href="javascript:void(0);" class="anchor" data-anchor="' + anchors.join(',') + '">' + matchText + '</a>';
    });

    tipHtml = '<span><input type="button" value="0.114114" onclick="BBS.askmona.sendToRes(' + thread.t_id + ', ' + (i+1) + ', 11411400)" /></span>';

    var monaInt = res.receive.slice(0, -8);
    if (monaInt === '') monaInt = '0';
    var mona = parseFloat(monaInt + '.' + res.receive.slice(-8));
    html += '<p style="margin-left:10px;">'; // レスのヘッダ（ブロック要素）
    html += '<span class="rh"><a href="#res_' +(anchor+1)+ '">' +(anchor+1)+ '</a></span> ：'; // レス番
    html += '<a href="#" class="ru" onclick="BBS.askmona.showProfile(' + res.u_id + ')">' + res.u_name + res.u_dan + '</a>： '; // 名前
    html += timetostr(res.created) + '</span> ：'; // 時刻
    html += '<span class="rm">+' + mona + 'MONA/' + res.rec_count + '人</span> '; // 投げMONA
    //html += '<a class="send" href="javascript:void(0);" onclick="BBS.askmona.showSendWin(' + thread.t_id + ', ' + (anchor+1) + ')" title="' + escapeHtml(tipHtml) + '">←送る</a>'; // 安価表示では未実装
    html += '</p> <p class="res lv' + res.res_lv + '">';
    html += text.replace(/\n/g,"<br />")
                        .replace(/(https?:\/\/[^ <]+)/g, '<a target="_blank" rel="nofollow" href="$1">$1</a>')
                        .replace(/<a target="_blank" rel="nofollow" href="[^"]+">(http:\/\/i.imgur.com\/[A-Za-z0-9]+)(\.[^<]+)</g,'<a class="thumbnail" href="$1$2" target="_blank"><img src="$1l$2"><')// URLをサムネに置き換える例。
                        ;
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
