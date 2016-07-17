// Web Workers に対応しているか
if(!window.Worker) alert("お使いのブラウザは Web Workers に対応していません。ブラウザを更新するか、対応してるﾔｼに乗り換えてください。。。");


//初期値
window.subjectReqCount = 0;
window.threadReqCount = 0;
window.BBS = {}; // 掲示板スクリプト用
window.BTN = {}; // ボタンonclick

$(function(){

  window.nowWork = 0;

  // 板一覧ツリー処理。 http://phpjavascriptroom.com/?t=js&p=tips_node をカスタマイズ
  /* 子メニューの表示・非表示切替 */
  $("#bbsmenu > dl > dt > a.closer").click(function(){
      var parent=$(this);
      var index = $("#bbsmenu > dl > dt > a.closer").index(this);
      var child=$("#bbsmenu > dl > dd").eq(index);
      if (child.css('display') == "none") {
        child.css({
          display:"block",
          backgroundColor:"white"
        });
        parent.css({
          backgroundColor:"orange",
          color:"white"
        });
      } else {
          child.css('display', "none");
          parent.css({
            backgroundColor:"#eeeeee",
            color:"black"
          });
      }
  });

  /* 子メニューの表示・非表示切替 */
  $("#bbsmenu > dl > dd > a.closer").click(function(){
      var parent=$(this);
      var index = $("#bbsmenu > dl > dd > a.closer").index(this);
      var child=$("#bbsmenu > dl > dd > ul").eq(index);
      if (child.css('display') == "none") {
        child.css({
          display:"block",
          backgroundColor:"white"
        });
        parent.css({
          backgroundColor:"orange",
          color:"white"
        });
      } else {
          child.css('display', "none");
          parent.css({
            backgroundColor:"white",
            color:"black"
          });
      }
  });
  // 以上、板一覧ツリー処理でした。

  // モジュール化の一環、板一覧からのopenコマンド
  $("#bbsmenu a.link").click(function(){
    var param = JSON.parse(this.dataset.param);
    BBS[ this.dataset.bbs ].open(param);
  });

  // 板履歴の読み込み、設定
  $('#bbs-history').change(function(){ // 板履歴で選択された際の処理
    var selected = $('#bbs-history').val();
    var arr = API.subjectWin.history.listArr[selected];
    BBS[ arr.bbs ].open(arr.param);
  });
  var subjectHistory = localStorage.getItem('monask:history:bbs');
  if(subjectHistory !== null) {
    API.subjectWin.history.listArr = JSON.parse(subjectHistory);
    API.subjectWin.history.update();
    $('#bbs-history').change();
  }
  // スレ履歴の読み込み、設定
  $('#thread-history').change(function(){ // 板履歴で選択された際の処理
    var selected = $('#thread-history').val();
    var arr = API.threadWin.history.listArr[selected];
    BBS[ arr.bbs ].open(arr.param);
  });
  var threadHistory = localStorage.getItem('monask:history:thread');
  if(threadHistory !== null) {
    API.threadWin.history.listArr = JSON.parse(threadHistory);
    API.threadWin.history.update();
    $('#thread-history').change();
  }
  // Ask Mona再ログイン処理
  var u_id = localStorage.getItem("askMona:u_id");
  var secretkey = localStorage.getItem("askMona:secretkey");
  if(u_id !== null && secretkey !== null){ // ２つとも存在した場合
    $.askmona.myprof({app_id:BBS.askmona.app_id,app_secretkey:BBS.askmona.app_secretkey, u_id:u_id, secretkey:secretkey}, {}, function(result){
      if (result.status === 1) {
        BBS.askmona.u_id = u_id;
        BBS.askmona.secretkey = secretkey;
        $("#login-status").html(result.u_name + result.u_dan + 'さん');
      }
      else alert("前回までの情報で認証できませんでした。ログインし直してください。\n" + result.error);
    });
  }

  //BBS.askmona.showTopics(); // トピック一覧を取得・表示

  $("#user-login").click(function(){
    if(window.confirm("すでに認証コードをコピーしていますか？\n初めてこの画面を開いた場合は「キャンセル (いいえ)」をクリックしてください。")) {
      var code = window.prompt('コピーされている認証コードをコピペして下さい。');
      try{
        var user = JSON.parse(code === null ? '' : code);
      }catch(e){
        alert('正しく貼り付けられていません。もう一度やりなおしてください。');
        return -1;
      }
      if(!(typeof user === 'object' && 'u_id' in user && 'secretkey' in user)){alert('内容が正しくありません。もう一度やり直してください。'); return -1;}
      $.askmona.myprof({app_id:BBS.askmona.app_id,app_secretkey:BBS.askmona.app_secretkey, u_id:user.u_id, secretkey:user.secretkey}, {}, function(result){
        if (result.status === 1) {
          BBS.askmona.u_id = user.u_id;
          BBS.askmona.secretkey = user.secretkey;
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

});


function unix2date(row, cell, value, columnDef, dataContext) {
  return new Date(value*1000).toNormalString();
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

Date.prototype.toNormalString = function(){
    return (
        this.getFullYear() + '/' +
        ( '0' + (this.getMonth() + 1) ).slice( -2 ) + '/' +
        ( '0' + (this.getDate()) ).slice( -2 ) + ' ' +
        ( '0' + this.toLocaleTimeString() ).slice( -8 )
    );
}

API = {
  subjectWin: {
    history: {
      listArr: [],
      add: function(bbs, param, unique, title) { // 履歴に追加／既存なら浮上
        this.listArr = this.listArr.filter(function(v){
          return !(v.bbs == bbs && v.unique === unique);
        });
        if (typeof(title) !== "undefined") this.listArr.unshift({bbs:bbs, param:param, unique:unique, title:title});
        localStorage.setItem('monask:history:bbs', JSON.stringify(this.listArr));
        this.update();
        $('#bbs-history').val("0");
        return this.listArr;
      },
      delete: function(bbs, unique) {
        this.add(bbs, {}, unique);
      },
      update: function(){        var dom = $('#bbs-history');
        arr = this.listArr;
        dom.empty();
        for(i=0;i<arr.length;i++){
          dom.append('<option value="' + i + '">□' + arr[i].title + '</option>');
        }
      }
    }
  },
  threadWin: {
    displayHtml: function (html) {
      $('.threadWin-view').html(html);
    },
    scrollTop: function (top) {
      $('.threadWin-view').scrollTop(top);
    },
    history: {
      listArr: [],
      add: function(bbs, param, unique, title) { // 履歴に追加／既存なら浮上
        this.listArr = this.listArr.filter(function(v){
          return !(v.bbs == bbs && v.unique === unique);
        });
        if (typeof(title) !== "undefined") this.listArr.unshift({bbs:bbs, param:param, unique:unique, title:title});
        localStorage.setItem('monask:history:thread', JSON.stringify(this.listArr));
        this.update();
        $('#thread-history').val("0");
        return this.listArr;
      },
      delete: function(bbs, unique) {
        this.add(bbs, {}, unique);
      },
      update: function(){
        var dom = $('#thread-history');
        arr = this.listArr;
        dom.empty();
        for(i=0;i<arr.length;i++){
          dom.append('<option value="' + i + '">□' + arr[i].title + '</option>');
        }
      }
    }
  },
  status: function (str) {
    $("#footer").html(str);
  }
}
