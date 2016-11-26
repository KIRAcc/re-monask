// Ask Mona用の 処理ルーチン…？な関数群、兼、一時データ置き場。動けばいいのだ
class Site_askMona extends Template_Site {
  init() {
    this._site = "askMona";
    this._siteTitle = 'Ask Mona';
    this.app_id = 6;
    this.app_secretkey = 'Ay07w6NIChrag34dbLi8oqRwxcZABVhmHtfg8EaYQUyk=';
    this._boardList =  {
      all: {board:"all", name:"トピック一覧"},
      fav: {board:"fav", name:"お気に入り"}
    }
  }

  load() {
    this.render();
  }

  newBoardObject(board) {return new Board_askMona(this._boardList[board], this);}

  get authInfo() {return {app_id:this.app_id,app_secretkey:this.app_secretkey, u_id:this.u_id, secretkey:this.secretkey};}
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

  load() { // 板のスレ一覧を取得して画面に表示
    var that = this; // 別スコープ入ってもこのトピックオブジェクトを呼び出すためのおまじない
    that.activate(); // 今、画面はこの板のスレ一覧を表示しているというのを設定
    that.addToHistory(); // 板履歴に追加／既存なら浮上してくれる
    Core.log("（・ω・）Subject list loading..."); // ログ表示

    if(that._board === 'fav') { // 「お気に入り」を取得する場合
      $.askmona.favList(that._siteObj.authInfo, {}, function(data) {
        that._subjects = data.topics;
        that.render();
      });
    } else { // それ以外（＝全トピック）を取得する場合
      $.askmona.topicsAll({}, function(data) {
        that._subjects = data.topics;
        that.render();
      });
    }
  }

  getThreadObject(data, isObj) { // dataに渡された内容から、板内のトピック（thread）のインスタンスを渡す
    var key = (isObj) ? data.t_id : data; // isObjがtrueならdataはAsk Monaのトピックオブジェクト。そうでなければdataはトピックIDの数値（文字列かも？）
    return (key in this.threads) ? this.threads[key] : this.newThreadObject(key); // ↑でトピックIDをkeyに格納したので、トピックIDの指すトピックのインスタンスを返す（無ければ新しく作られる）
  }

  newThreadObject(key) {return new Thread_askMona({thread:key}, this);} // スレのインスタンスを新しく作る
}

class Thread_askMona extends Template_Thread {
  init(args) {
    this._board = 'all'; // Ask Monaには板が存在しないため、ここでallと指定する。そうしないと「お気に入り」（fav）からトピックを開くとallとfavで同じトピでも履歴が２つ記録されてしまう
  }

  load(reload) {
    var that = this;
    if (that._isWorking) return;
    that.activate();
    var html = '<div id="th_title" class="title">' + that._threadTitle + '</div>';
    if (!reload) $(Core.threadPane.dom).html(html);
    Core.log("（ ・～・）Responses loading... : "  + that._threadTitle);
    $.askmona.responses({t_id:that._thread, to:1000, topic_detail:1}, function(data){
      if (!that.isActive) return;
      that._threadInfo = data.topic;
      that._threadTitle = that._threadInfo.title;
      that._responses = data.responses;
      that.render(reload);
    });
  }

  post(data){ // ここだけPromise使ってみるという
    var that = this;
    if(!('u_id' in that._siteObj && 'secretkey' in that._siteObj)){alert('ログインされていません。。。'); return -1;}
    Core.log("（ ＾ω＾）Posting...");
    return new Promise(function(resolve, reject){
      $.askmona.post(that._siteObj.authInfo, {t_id:that._thread, text:data.message, sage:(data.isSage ? 1 : 0)},function(data){
        resolve();
      });
    });
  }
}

new Site_askMona();
