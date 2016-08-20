self.addEventListener('message', function(e) {
  var thread = e.data.threadDesc
  ,   responses = e.data.responses
  ,   isAnchor = ("anchors" in e.data)
  ,   html = ''
  ,   tree = []
  ,   treeR = []
  ,   loop;

  if (isAnchor) {
    var anchors = e.data.anchors;
    loop = anchors.length;
  } else {
    loop = responses.length;
  }

  for(i = 0; i<loop; i++) {
    var n = (isAnchor) ? parseInt(anchors[i]) : i
    ,   res = responses[n]
    ,   text = res.response;

    tree[n] = [];

    tipHtml = '<span><input type="button" value="0.114114" onclick="BBS.askmona.sendToRes(' + thread.t_id + ', ' + (n+1) + ', 11411400)" /></span>';

    var monaInt = res.receive.slice(0, -8);
    if (monaInt === '') monaInt = '0';
    var mona = parseFloat(monaInt + '.' + res.receive.slice(-8));
    html += '<p id="res_' + (n+1) + '" style="margin-left:10px;" data-num="' + n + '">'; // レスのヘッダ（ブロック要素）
    html += '<span class="rh"><a href="#res_' + (n+1) + '" class="anchor anchor-reverse" data-anchors="' + n + '">' +(n+1)+ '</a><span class="reverse"></span></span> ：'; // レス番
    html += '<a href="#" class="ru" onclick="BBS.askmona.showProfile(' + res.u_id + ')">' + res.u_name + res.u_dan + '</a>： '; // 名前
    html += timetostr(res.created) + '</span> ：'; // 時刻
    html += '<span class="rm">+' + mona + 'MONA/' + res.rec_count + '人</span> '; // 投げMONA
    html += '<a class="send" href="javascript:void(0);" onclick="BBS.askmona.showSendWin(' + thread.t_id + ', ' + (n+1) + ')" title="' + escapeHtml(tipHtml) + '">←送る</a>'; //
    html += '</p> <p class="res lv' + res.res_lv + '">';
    html += text.replace(/\n/g,"<br />")
                .replace(/(https?:\/\/[^ <]+)/g, '<a target="_blank" rel="nofollow" href="$1">$1</a>')
                .replace(/<a target="_blank" rel="nofollow" href="[^"]+">(http:\/\/n.imgur.com\/[A-Za-z0-9]+)(\.[^<]+)</g,'<a class="thumbnail" href="$1$2" target="_blank"><img src="$1l$2"><')// URLをサムネに置き換える例。
                .replace(/>>([-0-9,\,]+)/g, function(matchText, ankaStr, pos, self) {
                  var ankaArr = ankaStr.split(',')
                  ,   anchors = [];
                  for(var s=0; s<ankaArr.length; s++) {
                    var arr = ankaArr[s].split('-'); //ankaArr[s].match(/([0-9]{1,4})(-([0-9]{1,4}))?/)
                    var low = parseInt(arr[0]), high = parseInt(arr[1]); // +をつけるだけで型変換までやってくれるんですよ！すごくないですか！？って言おうとしたけど小数弾きたいのでやめました。
                    if(1 <= low && low <= 1001) { // ,で区切った安価が正常なレス番か
                      if(!(1 <= high && high <= 1001)) high = low; // ,で区切られたレス指定が範囲指定で、かつ始、終ともにも正常なレス番か。でなければ、ここで調整
                      if(low > high) low = [high, high = low][0]; // 変数の入れ替えだって一文でできるんです！
                      for (var a=low; a<=high; a++) {
                        anchors.push(a-1);
                        if (!isAnchor) {
                          if (!(a-1 in treeR)) treeR[a-1] = [];
                          treeR[a-1].push(n);
                          treeR[a-1] = treeR[a-1].filter(function (x, n, self) { return self.indexOf(x) === n; }); // 重複している番号はここで消され…うわなにをするやめｒ
                        }
                      }
                    }
                  }
                  anchors = anchors.filter(function (x, n, self) { return self.indexOf(x) === n; }); // 重複している番号はここで消され…うわなにをするやめｒ
                  tree[n] = anchors;
                  return '<a href="javascript:void(0);" class="anchor" data-anchors="' + anchors.join(',') + '">' + matchText + '</a>';
                })
                ;
    if (!(n in treeR)) treeR[n] = [];
  }

  if (isAnchor && treeR.length <= 0) html = '参照レスなし';

  self.postMessage({html:html, tree:tree, treeReverse:treeR});
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
