// Web Workers に対応しているか
if(!window.Worker) alert("お使いのブラウザは Web Workers に対応していません。ブラウザを更新するか、対応してるﾔｼに乗り換えてください。。。");

var Core = {
  bbsList: {},

  history: {
    board: [],
    thread: [],
    reload: function(){
      var that = this;
      (function(){
        var dom = $('#bbs-history');
        arr = that.board;
        dom.empty();
        for(i=0;i<arr.length;i++){
          dom.append('<option value="' + i + '">□' + arr[i].title + '</option>');
        }
      })();
      (function(){
        var dom = $('#thread-history');
        arr = that.thread;
        dom.empty();
        for(i=0;i<arr.length;i++){
          dom.append('<option value="' + i + '">' + arr[i].title + '</option>');
        }      })();
    }
  },

  bbsMenu: {
    render: function() {
      bbsmenu = $("#bbsmenu");

      var insert = $("<dl>");
      $.each(Core.bbsList, function(site, obj){
        var list = obj._boardList;
        var name = obj._siteTitle;
        var closerElem = $('<dt><a href="javascript:void(0)" class="closer">&nbsp;' + name + '</a></dt>');
        closerElem.appendTo(insert);
        var openerElem = $('<dd class="opener" style="display:none;"></dd>');
        console.log(obj);
        $.each(list, function(board, obj){
          var name = obj.name;
          var elem = $('<a href="javascript:void(0)" class="link" data-site="' + site + '" data-board="' + board + '">' + name + '</a>');
          elem.appendTo(openerElem);
        });
        openerElem.appendTo(insert);
      });

      bbsmenu.empty();
      insert.appendTo(bbsmenu);

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

      $("#bbsmenu a.link").click(function(){
        Core.bbsList[this.dataset.site].getBoardObject(this.dataset.board).load();
      });
    }
  },

  boardPane: {
    active: {}
  },

  threadPane: {
    active: {},
    anchorTooltips: [],
    displayHtml: function (html) {
      $('.threadWin-view').html(html);
    },
    scrollTop: function (top) {
      $('.threadWin-view').scrollTop(top);
    },
  },

  log: function (str) {
    $("#logView").prepend('<div class="elem">' + str + '</div>');
    $('#logView').animate({scrollTop:0}, 'fast');
  },

  gridClickFunc: function(e, args) {
    that = Core.boardPane.active;
    var item = dataView.getItem(args.row).rank - 1;
    that.getThreadObject(that._subjects[item], true).load();
  }
}

class Template_Site {
  constructor(args) {
    this._args = args;
    this.boards = {};
    this.init(args);
    this.homeDir = get_homedir( this._site + '/main.site.js', this._site );
    Core.bbsList[this._site] = this;
  }

  get forBoard() {return {site:this._site, siteTitle:this._siteTitle} }

  init(args) {
    this._site = "site4ex";
    this._siteTitle = 'Example Site';
  }

  render() {
    Core.bbsMenu.render();
  }

  getBoardObject(board) {
    return (board in this.boards) ? this.boards[board] : this.newBoardObject(board);
  }
  newBoardObject(board) {}
}

class Template_Board {
  constructor(args, siteObj) {
    console.log(args);
    this._args = args;
    this._siteObj = siteObj;
    this._siteDesc = this._siteObj.forBoard;
    this._site = this._siteDesc.site;
    this._siteTitle = this._siteDesc.siteTitle;
    this._board = this._args.board;
    this._boardTitle = this._args.name;
    siteObj.boards[this._board] = this;
    this.threads = [];
    this.init(args);
  }

  init(args) {
    this._columns = {};
  }

  get forThread() {return {site:this._site, siteTitle:this._siteTitle, siteObj:this._siteObj, board:this._board, boardTitle:this._boardTitle} }

  load(reload) {}

  render() {
    var that = this;
    if (that._subjects.length === 0) that.load();
    var subjects = that._subjects;
    var columns = that._columns;
    Core.log("（ ´∀｀）Thread list loaded!");

    grid.onClick.unsubscribe(Core.gridClickFunc); // すでに登録されているクリックイベントを削除
    grid.onClick.subscribe(Core.gridClickFunc); // クリックするとスレを開くイベントを登録

    grid.onSort.subscribe(function (e, args) {
      var cols = args.sortCols;
      dataView.sort(function (dataRow1, dataRow2) {
        for (var i = 0, l = cols.length; i < l; i++) {
          var field = cols[i].sortCol.field;
          var sign = cols[i].sortAsc ? 1 : -1;
          var value1 = dataRow1[field], value2 = dataRow2[field];
          var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
          if (result != 0) {
            return result;
          }
        }
        return 0;
      });
    });

    dataView.onRowCountChanged.subscribe(function (e, args) {
      grid.updateRowCount();
      grid.render();
    });

    dataView.onRowsChanged.subscribe(function (e, args) {
      grid.invalidateRows(args.rows);
      grid.render();
    });

    var filterStr = '';
    var filter = function(item) {
      if ('title' !== undefined && filterStr !== "") {
        //var c = grid.getColumns()[grid.getColumnIndex(columnId)];
        var val = item['title'];
        if (val === undefined || val.indexOf(filterStr) === -1) {
          return false;
        }
      }
      return true;
    };

    $("input#subject-filter").japaneseInputChange(function(){
      filterStr = $.trim($(this).val());
      dataView.refresh();
    });

    grid.setColumns(columns);
    dataView.beginUpdate();
    dataView.setItems(subjects.concat(), 'rank');
    dataView.refresh();
    dataView.setFilter(filter);
    dataView.endUpdate();
    grid.invalidate();
    grid.render();
    grid.invalidateAllRows();
    setTimeout(grid.resizeCanvas, 0);
    $(".slick-viewport").scrollTop(0);
  }

  addToHistory(remove) { // 履歴に追加／既存なら浮上し、画面に反映。removeは文字通りtrueを渡すと履歴から消える
    var site = this._site;
    var board = this._board;
    var title = this._boardTitle;
    var opts = {};
    Core.history.board = Core.history.board.filter(function(v){ //一旦該当項目を削除（それ以外を抽出）
      return !(v.site == site && v.board === board);
    });
    if (!remove) Core.history.board.unshift({site:site, board:board, title:title, opts:opts}); // そしてここで追加する。もともと存在していたのなら↑で削除されるし、remove==trueなら追加されないので事実上の削除となるのだ
    localStorage.setItem('monask:history:board', JSON.stringify(Core.history.board)); // そしてlocalStorageに保存する
    Core.history.reload(); // 画面上に反映
    if (!remove) $('#bbs-history').val("0"); // 画面上で先頭要素にフォーカスする
    return Core.history.board;
  }

  deleteFromHistory() { // addToHistoryの引数removeをtrue固定にしただけの実質エイリアス
    return this.addToHistory(true);
  }

  activate() { // 今開いている板として登録
    Core.boardPane.active = this;
    return this.addToHistory();
  }
  get isActive() {
    return Core.boardPane.active === this;
  }

  getThreadObject(data, isSubjectObj) {}
  newThreadObject(key) {}
}

class Template_Thread {
  constructor(args, boardObj) {
    this._args = args;
    this._boardObj = boardObj;
    this._boardDesc = this._boardObj.forThread;
    this._siteObj = this._boardDesc.siteObj;
    this._site = this._boardDesc.site;
    this._siteTitle = this._boardDesc.siteTitle;
    this._board = this._boardDesc.board;
    this._boardTitle = this._boardDesc.boardTitle;
    this._thread = this._args.thread;
    this._threadTitle = this._args.name || "unknown";
    this._responses = [];
    boardObj.threads[this._thread] = this;
    this.init(args);
  }

  init(args) {
  }

  get forRenderer() {return {site:this._site, siteTitle:this._siteTitle, board:this._boardTitle, boardTitle:this._boardTitle, thread:this._thread, threadTitle:this._threadTitle} }

  load(reload) {
    var that = this;
    if (that._isLoading) return;
    that.activate();
    that._isLoading = true;
    var html = '<div id="th_responses"></div><div id="th_title" class="title">' + that._threadTitle + '</div>';
    if (!reload) $(Core.threadPane.dom).html(html);
    Core.log("（ ・～・）Responses loading... : "  + that._threadTitle);
    that.get().then(function(){
      $(Core.threadPane.dom).children('div#th_title').text(that._threadTitle); // スレッド名がthis.get()で判明することを考慮し、スレッド名を再度投入
      that.addToHistory(); // 同上。履歴を更新
      that.render(reload);
    });
  }

  render(reload) {
    var that = this;
    if (!that.isActive) return;
    if (this._responses.length === 0) that.load();

    var responses = that._responses.concat();

    Core.log("（ ・～・）Responses RENDERING... : "  + that._threadTitle);

    this.buildThreadHtml(this).then(function(elem, resTree, resTreeR) {
      $(Core.threadPane.dom).children('div#th_responses').replaceWith(elem);
      if (!reload) Core.threadPane.scrollTop(0);
      Core.log("（ ・∀・）Responses loaded! : "  + that._threadTitle);

      // 書き込みウィンドウの準備
      if(!("postWindow" in that)) {
        var dlgHtml = '<div id="postWin-' + that._site + '-' + that._board + '-' + that._thread + '" >'
                    +   '<input type="button" class="window-submit" value="書き込み" />'
                    +   '<input type="checkbox" class="window-isSage" value="sage">sage'
                    +   '<textarea rows="4" cols="40" class="window-message"></textarea><br>'
                    + '</div>';
        that.postWindow = $(dlgHtml)
         .dialog({
            title: '書込: ' + that._threadTitle,
            width:600,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});

         $('#postWin-' + that._site + '-' + that._board + '-' + that._thread + ' > .window-submit').click(function(){
           var button = this
           ,   postWin = $(button).parent();
           $(button).prop("disabled", true); // $(this) は $(baseStr + ' > .window-submit') と同義
           var data = {
             isSage: postWin.find('.window-isSage').prop('checked'),
             message: postWin.find('.window-message').val()
           };
           that.post(data).then(function(){
             $(button).prop("disabled", false);
             that.load(true);
           });
         });
      }

      // 送金ウィンドウの準備
      if(!("sendWindow" in that)) {
        var dlgHtml = '<div id="sendWin-' + that._board + '-' + that._thread + '" >'
                    +   '<input type="button" value="送金する" class="window-submit" />' //BBS.askmona.sendToRes(' + th_obj.t_id + ', 0, 0)
                    +   'ﾚｽ:<input type="text" class="window-target" value="0" size="6" maxlength="4">　'
                    +   '額:<input type="text" class="window-amount" value="0">　'
                    +   '<input type="checkbox" class="window-isAnon" value="anonymous">匿名　'
                    +   '<input type="checkbox" class="window-isSage" value="sage">sage'
                    +   '<textarea rows="4" cols="40" class="window-message"></textarea><br>'
                    + '</div>';
        that.sendWindow = $(dlgHtml)
         .dialog({
            title: '送金: ' + that._threadTitle,
            width:600,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});

         var baseStr = '#sendWin-' + that._board + '-' + that._thread;
         $(baseStr + ' > .window-submit').click(function(){
           $(this).prop("disabled", true); // $(this) は $(baseStr + ' > .window-submit') と同義
           var data = {
             target: $(baseStr + ' > .window-target').val(),
             amount: $(baseStr + ' > .window-amount').val(),
             isAnon: $(baseStr + ' > .window-isAnon').prop('checked'),
             isSage: $(baseStr + ' > .window-isSage').prop('checked'),
             message: $(baseStr + ' > .window-message').val()
           };
           that.send(data).then(function(){
             $(baseStr + ' > .window-submit').prop("disabled", false);
             that.load(true);
           });
         });
      }
      that._isLoading = false;
    });
  }

  buildThreadHtml(){
    var that = this;
    return new Promise(function(resolve, reject){
      var worker = new Worker('./threadRender.worker.js');
      worker.addEventListener('message', function(e) {
        that.resTree = e.data.tree;
        that.resTreeR = e.data.treeReverse;
        var elem = $('<div id="th_responses"></div>');
        elem.append(e.data.html);
        Core.log("（ ・∀・）Responses loaded! : "  + that._threadTitle);

        //参照レスが存在するかで表示を変更
        elem.find('a.anchor-reverse').each(function(){
          var num = $(this).attr('data-anchors');
          var len = that.resTreeR[num].length;
          if (len > 0) $(this).parent().children('span.reverse').text('+' + len);
          else $(this).css('text-decoration', 'none');
        });

        // クイック送金ツールチップの準備
        elem.find('.send').qtip({
          content: {
            text: '<span><input type="button" value="0.114114" /></span>'
          },
          position: {
            my: 'left center',  // Position my top left...
            at: 'center right', // at the bottom right of...
            viewport: $(window),
          },
          hide: {
              fixed: true,
              delay: 300
          }
        });

        if (that._isWorking || !that.isActive) reject();
        else resolve(elem);
      }, false);
      worker.postMessage({responses:that._responses, threadInfo:that.forRenderer}); // ワーカーにデータを送信（HTML組立処理開始）
    });
  }

  addToHistory(remove) { // 履歴に追加／既存なら浮上
    var site = this._site;
    var board = this._board;
    var thread = this._thread;
    var title = this._threadTitle;
    var opts = {};
    Core.history.thread = Core.history.thread.filter(function(v){ //一旦該当項目を削除（それ以外を抽出）
      return !(v.site === site && v.board === board && v.thread === thread);
    });
    if (!remove) Core.history.thread.unshift({site:site, board:board, thread:thread, title:title, opts:opts});
    localStorage.setItem('monask:history:thread', JSON.stringify(Core.history.thread));
    Core.history.reload();
    $('#thread-history').val("0");
    return Core.history.thread;
  }

  deleteFromHistory() {
    return this.addToHistory(true);
  }

  activate() {
    Core.threadPane.active = this;
    return this.addToHistory();
  }
  isActive() {
    return Core.threadPane.active === this;
  }
}

$(function(){
  var columns = [
    {id: "rank", name: "No.", field: "rank", width: 50, sortable: true, cssClass: "cell-textRight", defaultSortAsc:false},
    {id: "cat", name: "カテゴリ", field: "category", width: 100, sortable: true, cssClass: ""},
    {id: "title", name: "トピック ", field: "title", width: 450, sortable: true, cssClass: ""},
    {id: "count", name: "レス", field: "count", width: 55, sortable: true, cssClass: "cell-textRight"},
    {id: "created", name: "スレ立", field: "created", width: 175, sortable: true, cssClass: "cell-textRight", formatter: unix2date},
  ];
  var options = {
    enableCellNavigation: false,
    enableColumnReorder: false,
    multiColumnSort: true
  };
  window.dataView = new Slick.Data.DataView();
  window.grid = new Slick.Grid(".subjectWin-view", dataView, columns, options);
  grid.init();

  Core.boardPane.dom = $('.subjectWin-view').get(0);
  Core.threadPane.dom = $('.threadWin-view').get(0);

  Core.bbsMenu.render();

  // 板履歴の読み込み、設定
  $('#bbs-history').change(function(undefined){ // 板履歴で選択された際の処理
    var selected = $('#bbs-history').val();
    var arr = Core.history.board[selected];
    if (arr !== undefined) Core.bbsList[arr.site].getBoardObject(arr.board).load();
  });
  var subjectHistory = localStorage.getItem('monask:history:board');
  if(subjectHistory !== null) {
    Core.history.board = JSON.parse(subjectHistory);
    Core.history.reload();
    $('#bbs-history').change();
  }
  // スレ履歴の読み込み、設定
  $('#thread-history').change(function(undefined){ // 板履歴で選択された際の処理
    var selected = $('#thread-history').val();
    var arr = Core.history.thread[selected];
    if (arr !== undefined) Core.bbsList[arr.site].getBoardObject(arr.board).getThreadObject(arr.thread).load();
  });
  var threadHistory = localStorage.getItem('monask:history:thread');
  if(threadHistory !== null) {
    Core.history.thread = JSON.parse(threadHistory);
    Core.history.reload();
    $('#thread-history').change();
  }

  // Ask Mona再ログイン処理
  var u_id = localStorage.getItem("askMona:u_id");
  var secretkey = localStorage.getItem("askMona:secretkey");
  if(u_id !== null && secretkey !== null){ // ２つとも存在した場合
    var askMona = Core.bbsList['askMona'];
    console.log(window.aI={app_id:askMona.app_id,app_secretkey:askMona.app_secretkey, u_id:u_id, secretkey:secretkey});
    $.askmona.myprof({app_id:askMona.app_id,app_secretkey:askMona.app_secretkey, u_id:u_id, secretkey:secretkey}, {}, function(result){
      if (result.status === 1) {
        askMona.u_id = u_id;
        askMona.secretkey = secretkey;
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
      var askMona = Core.bbsList['askMona'];
      $.askmona.myprof({app_id:askMona.app_id,app_secretkey:askMona.app_secretkey, u_id:user.u_id, secretkey:user.secretkey}, {}, function(result){
        if (result.status === 1) {
          askMona.u_id = user.u_id;
          askMona.secretkey = user.secretkey;
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

  // 右ペインのタブの準備
  $('#tab-container').easytabs();

  //レス表示ペインの安価ポップアップの準備
  $(document).on('mouseenter', 'a.anchor', function(event) {
      $(this).qtip({
        content: {
          text: function(event, api) {
            (function(){
              var container = api.tooltip;
              var anchorStr = api.elements.target.attr('data-anchors');
              var anchors = ( $(api.elements.target.hasClass('anchor-reverse'))[0] ) ? Core.threadPane.active.resTreeR[anchorStr] : anchorStr.split(',');
              var responses = Core.threadPane.active._responses;
              var worker = new Worker('./threadRender.worker.js');
              worker.addEventListener('message', function(e) {
                api.set('content.text', e.data.html); // サンプルをコピペしたままなので変数見つからんと怒られた。。。
                Core.threadPane.anchorTooltips.push(api);
              }, false);
              worker.postMessage({responses:responses, threadDesc:Core.threadPane.active.forRenderer, anchors:anchors}); // ワーカーにデータを送信（HTML組立処理開始）
            })();
            return 'Loading...'; // Set some initial text
             }
        },
        position: {
          my: 'center left',  // Position my top left...
          at: 'center right', // at the bottom right of...
          viewport: $(window),
          //container: $(".threadWin-view"), //(typeof api === "undefined") ? $("body") : api.tooltip,
          effect: false,
          adjust: {
            x: -10,
            method: 'shift'
          }
        },
        show: {
           event: event.type,
           ready: true,
        },
        hide: {
          delay: 50,
          fixed: true
        },
        events: {
            hide: function(event, api) {
              api.cache.focus = false;
              var arrAlias = Core.threadPane.anchorTooltips;
              if(arrAlias.length < 1) return;
              console.log(arrAlias);

              var lastElem_api = arrAlias[arrAlias.length-1];
              if (lastElem_api.get('id') !== api.get('id')) {
                event.preventDefault();
                return;
              }else{
                setTimeout(function(){
                  //var arrAlias = Core.threadPane.anchorTooltips;
                  api.destroy();
                  var pop = arrAlias.pop();
                  console.log(pop);
                  while (true) {
                    if(arrAlias.length <= 0) break;
                    var i = arrAlias.length-1;
                    if(arrAlias[i].cache.focus !== false) break;
                    arrAlias[i].destroy();
                    arrAlias.pop();
                  }
                }, 50);
                event.preventDefault();
              }
            },
            focus: function(event, api) {
              api.cache.focus = true;
              //console.log(Core.threadPane.anchorTooltips);
            }
        },
        style: { 'classes': 'anchorTooltip' }
      });
  });

});


Date.prototype.toNormalString = function(){
    return (
        this.getFullYear() + '/' +
        ( '0' + (this.getMonth() + 1) ).slice( -2 ) + '/' +
        ( '0' + (this.getDate()) ).slice( -2 ) + ' ' +
        ( '0' + this.toLocaleTimeString() ).slice( -8 )
    );
}

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

function get_homedir(sThis_filename, sPath_to_the_home) {
  // --- 自分自身に関する情報の設定(自分の位置を検出するために必要) --
  //var sThis_filename    = 'relocatable.js'; // 自分が置かれているファイルの名前(*1)
  //var sPath_to_the_home = '..';             // ↑自身からホームdirへの相対パス
     // (*1) 同名ファイルが他に存在するなどして、ファイル名だけでは一意
     //      に絞り込めない場合、「<script src="~">で必ず含めると保証さ
     //      れている」のであれば、親ディレクトリーなどを含めてもよい。
     //      例えば、1つのサイトの中の
     //        あるHTMLでは<script src="myjs/script.js">
     //        またあるHTMLでは<script src="../myjs/script.js">
     //      というように、全てのHTMLで "myjs/script.js" 部分を必ず指定
     //      しているなら、他の "otherjs/script.js" と間違わないように、
     //        sThis_filename = 'myjs/script.js' としてもよい。
     //      ただしこの時 sLocation_from_home は、"myjs" の場所から見た
     //      ホームディレクトリーへの相対パスを意味するので注意。

  // --- その他変数定義 ----------------------------------------------
  var i, s, le; // 汎用変数
  var sUrl = null; // 戻り文字列格納用

  // --- 自JavaScriptを読んでいるタグを探し、homedir(相対の場合あり)を生成
  le = document.getElementsByTagName('script');
  for (i=0; i<le.length; i++) {
    s = le[i].getAttribute('src');
    if (s.length < sThis_filename.length) {continue;}
    if (s.substr(s.length-sThis_filename.length) !== sThis_filename) {continue;}
    s = s.substr(0,s.length-sThis_filename.length);
    if ((s.length>0) && s.match(/[^\/]$/)) {continue;}
    sUrl = s + sPath_to_the_home;
    sUrl = (sUrl.match(/\/$/)) ? sUrl : sUrl+'/';
    break;
  }
  if (i >= le.length) {
    return null;             // タグが見つからなかったらnullを返して終了
  }

  // --- 絶対パス化(.や..は含む) -------------------------------------
  if (     sUrl.match(/^http/i)) {
    // httpから始まるURLになっていたらそのままでよい
  }
  else if (sUrl.match(/^\//)   ) {
    // httpから始まらないが絶対パスになっている場合はhttp～ドメイン名までを先頭に付ける
    if (! location.href.match(/^(https?:\/\/[a-z0-9.-]+)/i)) {return null;}
    sUrl = RegExp.$1 + sUrl;
  }
  else                           {
    // 相対パスになっている場合は呼び出し元URLのディレクトリまでの部分を先頭に付ける
    sUrl = location.href.replace(/\/[^\/]*$/, '/') + sUrl;
  }

  // --- カレントディレクトリ表記(.)を除去 ---------------------------
  while (sUrl.match(/\/\.\//)) {
    sUrl = sUrl.replace(/\/\.\//g, '/');
  }

  // --- 親ディレクトリ表記(..)を除去 --------------------------------
  while (sUrl.match(/\/\.\.\//)) {
    while (sUrl.match(/^\/\.\.\//)) {
      sUrl = sUrl.replace(/^\/\.\.\//, '/');
    }
    sUrl = sUrl.replace(/^\/\.\.$/, '/');
    while (sUrl.match(/\/[^\/]+\/\.\.\//)) {
      sUrl = sUrl.replace(/\/[^\/]+\/\.\.\//, '/');
    }
  }

  // --- 正常終了 ----------------------------------------------------
  return sUrl;
}
