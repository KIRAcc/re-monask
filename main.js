$(function(){

  window.nowWork = 0;

  // 再ログイン処理
  var u_id = localStorage.getItem("askMona:u_id");
  var secretkey = localStorage.getItem("askMona:secretkey");
  if(u_id !== null && secretkey !== null){ // ２つとも存在した場合
    $.askmona.myprof({app_id:bbs_AM.app_id,app_secretkey:bbs_AM.app_secretkey, u_id:u_id, secretkey:secretkey}, {}, function(result){
      if (result.status === 1) {
        bbs_AM.u_id = u_id;
        bbs_AM.secretkey = secretkey;
        $("#login-status").html(result.u_name + result.u_dan + 'さん');
      }
      else alert("前回までの情報で認証できませんでした。ログインし直してください。\n" + result.error);
    });
  }

  bbs_AM.showTopics(); // トピック一覧を取得・表示

  $("#user-login").click(function(){
    if(window.confirm("すでに認証コードをコピーしていますか？\n初めてこの画面を開いた場合は「キャンセル (いいえ)」をクリックしてください。")) {
      var code = window.prompt('新しいウィンドウで連携画面を開きました。Ask Monaでログインし、認証コードをコピペして下さい。');
      try{
        var user = JSON.parse(code === null ? '' : code);
      }catch(e){
        alert('正しく貼り付けられていません。もう一度やりなおしてください。');
        return -1;
      }
      if(!(typeof user === 'object' && 'u_id' in user && 'secretkey' in user)){alert('内容が正しくありません。もう一度やり直してください。'); return -1;}
      $.askmona.myprof({app_id:bbs_AM.app_id,app_secretkey:bbs_AM.app_secretkey, u_id:user.u_id, secretkey:user.secretkey}, {}, function(result){
        if (result.status === 1) {
          bbs_AM.u_id = user.u_id;
          bbs_AM.secretkey = user.secretkey;
          localStorage.setItem("askMona:u_id", user.u_id);
          localStorage.setItem("askMona:secretkey", user.secretkey);
          $("#login-status").html(result.u_name + result.u_dan + 'さん');
        }
        else alert("ログインできませんでした。もう一度やり直してください。\n" + result.error);
      });
    } else {
      alert("OKが押された後、新しいウィンドウで連携画面を開きます。\nAsk Monaでログインし、認証コードをコピーして下さい。\nその後、もう一度ログイン画面を開き、認証コードを入力してください。");
      window.open('http://askmona.org/auth/?app_id=6', 'mywindow2', 'width=900, height=800, menubar=no, toolbar=no, scrollbars=yes');
    }
  });

  $("#subject-refresh, #brdList-askMona").click(function(){
    bbs_AM.showTopics();
  });

  $("#brdList-AMFav").click(function(){
    bbs_AM.showFavs();
  });

});


// Web Workers に対応しているか
if(!window.Worker) alert("お使いのブラウザは Web Workers に対応していません。ブラウザを更新するか、対応してるﾔｼに乗り換えてください。。。");

// Ask Mona用の 処理ルーチン…？な関数群、兼、一時データ置き場。動けばいいのだ
bbs_AM = {
  app_id: 6,
  app_secretkey: 'Ay07w6NIChrag34dbLi8oqRwxcZABVhmHtfg8EaYQUyk=',

  postWin: {},
  sendWin: {},

  authInfo: function(){return {app_id:this.app_id,app_secretkey:this.app_secretkey, u_id:this.u_id, secretkey:this.secretkey};},

  loginUser: function(u_id){
    var html = '<div id="th_title">プロフィール</div>';
    $('.middle-east').html(html);
    $.askmona.profile(u_id, function(data){
      html = '<div class="title">プロフィール: ' + data.u_name + data.u_dan + '</div>';
      html += '<fieldset><legend>自己紹介</legend>' + ("profile" in data ? data.profile : "") + '</fieldset>';
      $('.middle-east').html(html);
      status("（ ・∀・）User Profile loaded!");
    });
  }

  ,showTopics: function(){
    status("（・ω・）Thread list loading...");
    $.askmona.topicsAll({},function(data){
      window.bbs_AM.topics = data;
      bbs_AM.renderTopics(data);

      var worker = new Worker('./js/_worker.categoryCrawl.js');
  
      worker.addEventListener('message', function(e) {
        console.log(e.data);
      }, false);
  
      worker.postMessage(data); // Send data to our worker.
    });
  }

  ,renderTopics: function(data){
    function formatter(row, cell, value, columnDef, dataContext) {
      return (new Date(dataContext.created*1000)).toNormalString();
    }
  
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
    grid = new Slick.Grid(".subjectWin-view", bbs_AM.topics, columns, options);
    status("（ ´∀｀）Thread list loaded!");
  
    grid.onClick.subscribe(function(e, args) {
      var item = args.row;
      bbs_AM.showResponses(window.bbs_AM.topics[item], true, true);
     });
      $('.subjectWin-view').css('overflow-y','auto');
  }

  ,showResponses: function(thread, isObj, eraseView){
    var title = (isObj) ? thread.title : 'ﾄﾋﾟｯｸID: ' + thread;
    var html = '<div id="th_title" class="title">' + title + '</div>';
    if (eraseView) $('.threadWin-view').html(html);
    status("（ ・～・）Responses PREPARING... : "  + title);
    var th_id = (isObj) ? thread.t_id : thread;
    if (window.nowWork === 1) { // 前の取得タスクがAJaX取得中だった場合
      window.nowWork = -1;
      while (window.nowWork !== 0) {console.log(abort);}
    }
    else if (window.nowWork === 2) {window.rendering.terminate();} // ワーカーで作業中だった場合
    else if (window.nowWork !== 0) {status("（ ；ω；）申し訳ありませんが、しばらく待ってもう一度お試しください : "  + title);} // 三重待機などへの暫定対策
    window.nowWork = 1;
    status("（ ・～・）Responses LOADING... : "  + title);
    var getDetail = (isObj) ? 0 : 1;
    $.askmona.responses({t_id:th_id, to:1000, topic_detail:getDetail},function(data){
      var th_obj = (isObj) ? thread : data.topic;
      bbs_AM.responses = data.responses;
      if(window.nowWork === 1) bbs_AM.renderResponses(th_obj, data.responses);
       else window.nowWork = 0;
    });
  }

  ,renderResponses: function(th_obj, responses) {
    window.nowWork = 2;
    window.rendering = new Worker('./js/_worker.threadRender.js');
    status("（ ・～・）Responses RENDERING... : "  + th_obj.title);

    window.rendering.addEventListener('message', function(e) {
      $('.threadWin-view').html('<div id="th_title" class="title">' + th_obj.title + '</div>' + e.data + '<div class="title" style="margin-top: 10px;">' + th_obj.title + '</div>')
                          .scrollTop(0);
      status("（ ・∀・）Responses loaded! : "  + th_obj.title);
      window.nowWork = 0;

      menuHtml = '<input type="button" value="新" onclick="bbs_AM.showResponses(' + th_obj.t_id + ', false, false)" />'
               + '<input type="button" value="書" onclick="bbs_AM.showPostWin(' + th_obj.t_id + ', \'' + th_obj.title + '\')" />';
      $('#subject-btns').html(menuHtml);

      // 送金ダイアログの表示
      $('.send').smallipop({
          preferredPosition: 'right',
          theme: 'black',
          popupOffset: 0,
          invertAnimation: true
        });

      // 書き込みウィンドウの準備
      if(!(th_obj.t_id in bbs_AM.postWin)) {
        var dlgHtml = '<div id="postWin-AM-' + th_obj.t_id + '" >'
                    + '  <input type="button" value="書き込み" onclick="bbs_AM.post(' + th_obj.t_id + ', \'' + th_obj.title + '\')" />'
                    + '  <input type="checkbox" class="sage" value="sage">sage'
                    + '  <textarea rows="4" cols="40" class="postText"></textarea><br>'
                    + '</div>';
        bbs_AM.postWin[th_obj.t_id] = $(dlgHtml)
         .dialog({
            title: '書込: ' + th_obj.title,
            width:500,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});
      }

      // 送金ウィンドウの準備
      if(!(th_obj.t_id in bbs_AM.sendWin)) {
        var dlgHtml = '<div id="sendWin-AM-' + th_obj.t_id + '" >'
                    + '  <input type="button" value="送金する" onclick="bbs_AM.sendToRes(' + th_obj.t_id + ', 0, 0)" />'
                    + '  ﾚｽ:<input type="text" class="res-id" value="0" size="6" maxlength="4">　'
                    + '  額:<input type="text" class="amount" value="0">　'
                    + '  <input type="checkbox" class="anonymous" value="anonymous">匿名　'
                    + '  <input type="checkbox" class="sage" value="sage">sage'
                    + '  <textarea rows="4" cols="40" class="postText"></textarea><br>'
                    + '</div>';
        bbs_AM.sendWin[th_obj.t_id] = $(dlgHtml)
         .dialog({
            title: '送金: ' + th_obj.title,
            width:500,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});
      }
    }, false);

    window.rendering.postMessage([th_obj, responses]); // ワーカーにデータを送信（HTML組立処理開始）
  }

  ,showFavs: function(){
    if(!('u_id' in bbs_AM && 'secretkey' in bbs_AM)){alert('ログインされていません。。。'); return -1;}
    status("（ ・～・）Fav.list LOADING...");
    $.askmona.favList(bbs_AM.authInfo(), {},function(data){
      bbs_AM.favs = data.topics;
      bbs_AM.renderFavs(data.topics);
    });
  }

  ,renderFavs: function(favs) {
    function formatter(row, cell, value, columnDef, dataContext) {return (new Date(dataContext.created*1000)).toNormalString();}
  
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
    status("（ ・∀・）Fav. list loaded!");
  
    grid.onClick.subscribe(function(e, args) {
      var item = args.row;
      bbs_AM.showResponses(favs[item], true, true);
     });
      $('.subjectWin-view').css('overflow-y','auto');
  }

  ,showProfile: function(u_id){
    var html = '<div id="th_title">プロフィール</div>';
    $('.middle-east').html(html);
    status("（ ・～・）User  No." + u_id + "'s Profile LOADING...");
    $.askmona.profile(u_id, function(data){
      profile = ("profile" in data ? data.profile.replace("\n", "<br />") : "");
      html = '<div class="title">プロフィール: ' + data.u_name + data.u_dan + '</div>';
      html += '<fieldset><legend>自己紹介</legend>' + profile + '</fieldset>';
      $('.middle-east').html(html);
      status("（ ・∀・）User Profile loaded! : No." + u_id + ' : ' + data.u_name + data.u_dan);
    });
  }

  ,showPostWin: function(t_id){
    if(!('u_id' in bbs_AM && 'secretkey' in bbs_AM)){alert('ログインされていません。。。'); return -1;}
    if(!(t_id in bbs_AM.postWin)) return 0;
    bbs_AM.postWin[t_id].dialog('open');
  }

  ,post: function(t_id){
    if(!('u_id' in bbs_AM && 'secretkey' in bbs_AM)){alert('ログインされていません。。。'); return -1;}
    var sage = $('#postWin-AM-' + t_id + ' > .sage').prop('checked');
    var msg = $('#postWin-AM-' + t_id + ' > .postText').val();
    status("（ ＾ω＾）Posting...");
    $.askmona.post(bbs_AM.authInfo(), {t_id:t_id, text:msg, sage:(sage ? 1 : 0)},function(data){
      bbs_AM.showResponses(t_id, false, false);
    });
  }

  ,showSendWin: function(t_id, r_id){
    if(!('u_id' in bbs_AM && 'secretkey' in bbs_AM)){alert('ログインされていません。。。'); return -1;}
    if(!(t_id in bbs_AM.sendWin)) return 0;
    $('#sendWin-AM-' + t_id + ' > .res-id').val(r_id);
    bbs_AM.sendWin[t_id].dialog('open');
  }

  ,sendToRes: function(t_id, r_id, amount){
    if(!('u_id' in bbs_AM && 'secretkey' in bbs_AM)){alert('ログインされていません。。。'); return -1;}
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
    status("（ ＠∀＠）Sending...");
    $.askmona.send(bbs_AM.authInfo(), {t_id:t_id, r_id:r_id, amount:amount, msg_text:msg, anonymous:(anonymous ? 1 : 0), sage:(sage ? 1 : 0)},function(data){
      bbs_AM.showResponses(t_id, false, false);
    });
  }

};

Date.prototype.toNormalString = function(){
    return (
        this.getFullYear() + '/' +
        ( '0' + (this.getMonth() + 1) ).slice( -2 ) + '/' +
        ( '0' + (this.getDate()) ).slice( -2 ) + ' ' +
        ( '0' + this.toLocaleTimeString() ).slice( -8 )
    );
}

function status(str){
  $("#footer").html(str);
}
