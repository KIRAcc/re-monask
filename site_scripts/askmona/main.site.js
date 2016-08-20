// Ask Mona用の 処理ルーチン…？な関数群、兼、一時データ置き場。動けばいいのだ
class Site_askMona extends Template_Site {
  init() {
    this._site = "askMona";
    this._siteTitle = 'Ask Mona';
    this.app_id = 6;
    this.app_secretkey = 'Ay07w6NIChrag34dbLi8oqRwxcZABVhmHtfg8EaYQUyk=';
    this._boardList =  {
      all: {board:"all", name:"トピック一覧"}
      ,fav: {board:"fav", name:"お気に入り"}
    }
  }

  load() {
    this.render();
  }

  newBoardObject(board) {return new Board_askMona(this._boardList[board], this);}

}

class Board_askMona extends Template_Board {
  init(args) {
    this._subjects = [];
    this._columns = [
      {id: "rank", name: "No.", field: "rank", width: 50, sortable: true, cssClass: "cell-textRight", defaultSortAsc:false},
      {id: "cat", name: "カテゴリ", field: "category", width: 100, sortable: true, cssClass: ""},
      {id: "title", name: "トピック ", field: "title", width: 450, sortable: true, cssClass: ""},
      {id: "count", name: "ﾚｽ数", field: "count", width: 55, sortable: true, cssClass: "cell-textRight"},
      {id: "created", name: "ﾄﾋﾟ立", field: "created", width: 175, sortable: true, cssClass: "cell-textRight", formatter: unix2date},
      {id: "updated", name: "更新", field: "modified", width: 175, sortable: true, cssClass: "cell-textRight", formatter: unix2date},
      {id: "lead", name: "リード ", field: "lead", width: 650, sortable: true, cssClass: ""}
    ];
  }

  load() {
    var that = this;
    that.activate();
    that.addToHistory();
    /*BTN.subjectWin = {
      reload: function(){BBS.askmona.showTopics();},
    }*/
    Core.log("（・ω・）Thread list loading...");
    //var sReqC_then = ++subjectReqCount; // http://stackoverflow.com/a/9999813
    $.askmona.topicsAll({}, function(data) {
      //if (subjectReqCount !== sReqC_then) return;
      that._subjects = data;
      that.render();
    });
  }

  getThreadObject(data, isSubjectObj) {
    var key = (isSubjectObj) ? data.t_id : data;
    return (key in this.threads) ? this.threads[key] : this.newThreadObject(key);
  }
  newThreadObject(key) {return new Thread_askMona({thread:key}, this);}
}

class Thread_askMona extends Template_Thread {
  init(args) {
  }

  load(reload) {
    var that = this;
    if (that._isWorking) return;
    that.activate();
    var html = '<div id="th_title" class="title">' + that._threadTitle + '</div>';
    if (!reload) $(Core.threadPane.dom).html(html);
    Core.log("（ ・～・）Responses loading... : "  + that._threadTitle);
    $.askmona.responses({t_id:that._thread, to:1000, topic_detail:1}, function(data){
      console.log(data);
      if (!that.isActive) return;
      that._threadInfo = data.topic;
      that._threadTitle = that._threadInfo.title;
      that._responses = data.responses;
      that.render(reload);
    });
  }
}

new Site_askMona();


BBS.askmona = {

  postWin: {},
  sendWin: {}

  /*,open: function(param){
    var f = {
      "listTopics": function(){BBS.askmona.showTopics();}, // トピック一覧を取得・表示
      "listFavs": function(){BBS.askmona.showFavs();}, // お気に入り一覧を取得・表示
      "openTopic": function(){BBS.askmona.openThread(param.thread, param.isObj, true);},
     };
    f[ param.cmd ]();
    //else if ( === "listFavs")
    //else return 'あなた使い方間違えてませんか…';
  }*/

  ,authInfo: function(){return {app_id:this.app_id,app_secretkey:this.app_secretkey, u_id:this.u_id, secretkey:this.secretkey};}

  ,loginUser: function(u_id){
    var html = '<div id="th_title">プロフィール</div>';
    $('.middle-east').html(html);
    $.askmona.profile(u_id, function(data){
      html = '<div class="title">プロフィール: ' + data.u_name + data.u_dan + '</div>';
      html += '<fieldset><legend>自己紹介</legend>' + ("profile" in data ? data.profile : "") + '</fieldset>';
      $('.middle-east').html(html);
      API.status("（ ・∀・）User Profile loaded!");
    });
  }

  ,showTopics: function(){
    API.subjectWin.history.add('askmona', {cmd:'listTopics'}, 'listAll', 'トピック一覧 [Ask Mona]');
  }

  ,openThread: function(thread, isObj, eraseView){
    var th_id = (isObj) ? thread.t_id : thread;
    var title = (isObj) ? thread.title : 'ﾄﾋﾟｯｸID: ' + thread;
    API.threadWin.history.add('askmona', {cmd:'openTopic', thread:thread, isObj:isObj}, 'openTopic:' + th_id, title + ' [Ask Mona]');
  }

  ,showFavs: function(){
    API.subjectWin.history.add('askmona', {cmd:'listFavs'}, 'listFavs', 'お気に入り [Ask Mona]');
    BTN.subjectWin = {
      reload: function(){BBS.askmona.showFavs();},
    }
    if(!('u_id' in BBS.askmona && 'secretkey' in BBS.askmona)){alert('ログインされていません。。。'); return -1;}
    API.status("（ ・～・）Fav.list loading...");
    var sReqC_then = ++subjectReqCount; // http://stackoverflow.com/a/9999813
    if (subjectReqCount !== sReqC_then) return;
    $.askmona.favList(BBS.askmona.authInfo(), {},function(data){
      BBS.askmona.favs = data.topics;
      BBS.askmona.renderFavs(data.topics);
    });
  }

  ,renderFavs: function(favs) {
    var formatter = function (row, cell, value, columnDef, dataContext) {return (new Date(dataContext.created*1000)).toNormalString();}

    var columns = [
      {id: "rank", name: "No.", field: "rank", width: 50, sortable: true, cssClass: "cell-textRight"},
      {id: "cat", name: "カテゴリ", field: "category", width: 100, sortable: true, cssClass: ""},
      {id: "title", name: "トピック ", field: "title", width: 450, sortable: true, cssClass: ""},
      {id: "count", name: "ﾚｽ数", field: "count", width: 55, sortable: true, cssClass: "cell-textRight"},
      {id: "created", name: "ﾄﾋﾟ立", field: "created", width: 175, sortable: true, cssClass: "cell-textRight", formatter: formatter},
      {id: "updated", name: "更新", field: "updated", width: 175, sortable: true, cssClass: "cell-textRight", formatter: formatter},
      {id: "lead", name: "リード ", field: "lead", width: 650, sortable: true, cssClass: ""}
    ];
    var options = {
      enableCellNavigation: false,
    };
    grid = new Slick.Grid(".subjectWin-view", favs, columns, options);
    API.status("（ ・∀・）Fav. list loaded!");

    grid.onClick.subscribe(function(e, args) {
      var item = args.row;
      BBS.askmona.openThread(favs[item], true, true);
     });
      $('.subjectWin-view').css('overflow-y','auto');
  }

  ,showProfile: function(u_id){
    var html = '<div id="th_title">プロフィール</div>';
    $('.middle-east').html(html);
    API.status("（ ・～・）User  No." + u_id + "'s Profile loading...");
    $.askmona.profile(u_id, function(data){
      profile = ("profile" in data ? data.profile.replace("\n", "<br />") : "");
      html = '<div class="title">プロフィール: ' + data.u_name + data.u_dan + '</div>';
      html += '<fieldset><legend>自己紹介</legend>' + profile + '</fieldset>';
      $('.middle-east').html(html);
      API.status("（ ・∀・）User Profile loaded! : No." + u_id + ' : ' + data.u_name + data.u_dan);
    });
  }

  ,showPostWin: function(t_id){
    if(!('u_id' in BBS.askmona && 'secretkey' in BBS.askmona)){alert('ログインされていません。。。'); return -1;}
    if(!(t_id in BBS.askmona.postWin)) return 0;
    BBS.askmona.postWin[t_id].dialog('open');
  }

  ,post: function(t_id){
    if(!('u_id' in BBS.askmona && 'secretkey' in BBS.askmona)){alert('ログインされていません。。。'); return -1;}
    var sage = $('#postWin-AM-' + t_id + ' > .sage').prop('checked');
    var msg = $('#postWin-AM-' + t_id + ' > .postText').val();
    API.status("（ ＾ω＾）Posting...");
    $.askmona.post(BBS.askmona.authInfo(), {t_id:t_id, text:msg, sage:(sage ? 1 : 0)},function(data){
      BBS.askmona.openThread(t_id, false, false);
    });
  }

  ,showSendWin: function(t_id, r_id){
    if(!('u_id' in BBS.askmona && 'secretkey' in BBS.askmona)){alert('ログインされていません。。。'); return -1;}
    if(!(t_id in BBS.askmona.sendWin)) return 0;
    $('#sendWin-AM-' + t_id + ' > .res-id').val(r_id);
    BBS.askmona.sendWin[t_id].dialog('open');
  }

  ,sendToRes: function(t_id, r_id, amount){
    if(!('u_id' in BBS.askmona && 'secretkey' in BBS.askmona)){alert('ログインされていません。。。'); return -1;}
    var anonymous = true, sage = false, msg = '';
    if(r_id === 0){
      r_id = parseInt( $('#sendWin-AM-' + t_id + ' > .res-id').val() );
      amount = parseFloat( $('#sendWin-AM-' + t_id + ' > .amount').val() );
      sage = $('#sendWin-AM-' + t_id + ' > .sage').prop('checked');
      anonymous = $('#sendWin-AM-' + t_id + ' > .anonymous').prop('checked');
      msg = $('#sendWin-AM-' + t_id + ' > .postText').val();
      if( 0 > r_id || r_id > 1001) {alert('指定されたレス番号が不正です。'); return -1;}
      if( 0 > amount || amount > 1000000) {alert('指定された送金額が不正です。'); return -1;}
      var arr = (amount + '.').split('.');
      var dec = (arr[1] + '00000000').substr(0, 8);
      amount = parseInt(arr[0] + dec);
      console.log({t_id:t_id, r_id:r_id, amount:amount, anonymous:(anonymous ? 1 : 0), sage:(sage ? 1 : 0)});
    }
    API.status("（ ＠∀＠）Sending...");
    $.askmona.send(BBS.askmona.authInfo(), {t_id:t_id, r_id:r_id, amount:amount, msg_text:msg, anonymous:(anonymous ? 1 : 0), sage:(sage ? 1 : 0)},function(data){
      BBS.askmona.openThread(t_id, false, false);
    });
  }

};
