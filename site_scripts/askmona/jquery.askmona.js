jQuery.askmona = {
  endpoint:"http://askmona.org/v1",
  topics:function(opts,callback){
    jQuery.getJSON(this.endpoint+'/topics/list?callback=?',opts,callback);
  },
  topicsAll:function(opts,callback){ // Ask Monaは1000レス×10ページの10000トピックが最大数らしい。それを全て取得し連結まで行う
    var list=[], i, finished = 0;
    for (i=0; i<10; i++) { // 1～10ページ全てを並列取得するため、リクエスト送信を10回ループ
      (function(off){
        opts.limit=1000; opts.offset=off;
        jQuery.askmona.topics({limit:1000, offset:1000*i}, function(json){
          Array.prototype.push.apply(list, json.topics);
          if(++finished === 10) { // 全てのページを取得し終えていることを確認し、番号順にソートした一覧をコールバックに渡す
            list = list.sort(function(a,b){ return (a.rank === b.rank ? 0 : (a.rank > b.rank ? 1 : -1)); });
            callback({status:1, topics:list});
          }
        });
      })();
    }
  },
  responses:function(opts,callback){
    //opts.to=1000;
    jQuery.getJSON(this.endpoint+'/responses/list?callback=?', opts, callback);
  },
  profile:function(uid,callback){
    jQuery.getJSON(this.endpoint+'/users/profile?callback=?', {u_id:uid}, callback);
  },
  myprof:function(authInfo, opts, callback){
    jQuery.extend(opts, jQuery.askmona.authKey(authInfo));
    jQuery.post(this.endpoint+'/users/myprofile',
      opts, callback, "json"
    );
  },
  favList:function(authInfo, opts, callback){
    jQuery.extend(opts, jQuery.askmona.authKey(authInfo));
    jQuery.post(this.endpoint+'/favorites/list',
      opts, callback, "json"
    );
  },
  post:function(authInfo, opts, callback){
    jQuery.extend(opts, jQuery.askmona.authKey(authInfo));
    jQuery.post(this.endpoint+'/responses/post',
      opts, callback, "json"
    );
  },
  send:function(authInfo, opts, callback){
    jQuery.extend(opts, jQuery.askmona.authKey(authInfo));
    jQuery.post(this.endpoint+'/account/send',
      opts, callback, "json"
    );
  },
  verify:function(authInfo,callback){
    jQuery.post(this.endpoint+'/auth/verify',
      jQuery.askmona.authKey(authInfo), callback, "json"
    );
  },
  authKey:function(authInfo){
    var nonce = jQuery.askmona.nonce(30);
    var time = jQuery.askmona.time();
    var hashObj = new jsSHA("SHA-256","TEXT",1);
    hashObj.update(authInfo.app_secretkey + nonce + time + authInfo.secretkey);
    return {auth_key:hashObj.getHash("B64"), nonce:nonce, time:time, app_id:authInfo.app_id, u_id:authInfo.u_id};
  },
  unixtime:function(str){
    var objDate = new Date(str * 1000);
    var nowDate = new Date();
    myHour = Math.floor((nowDate.getTime()-objDate.getTime()) / (1000*60*60)) + 1;
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
  },
  nonce:function(length) {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for(var i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
  },

  time:function(){return Math.floor( new Date().getTime() / 1000 )}
};
