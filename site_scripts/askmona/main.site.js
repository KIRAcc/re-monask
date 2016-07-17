// Ask Mona用の 処理ルーチン…？な関数群、兼、一時データ置き場。動けばいいのだ
BBS.askmona = {
  app_id: 6,
  app_secretkey: 'Ay07w6NIChrag34dbLi8oqRwxcZABVhmHtfg8EaYQUyk=',

  postWin: {},
  sendWin: {}

  ,open: function(param){
    var f = {
      "listTopics": function(){BBS.askmona.showTopics();}, // トピック一覧を取得・表示
      "listFavs": function(){BBS.askmona.showFavs();}, // お気に入り一覧を取得・表示
      "openTopic": function(){BBS.askmona.openThread(param.thread, param.isObj, true);},
     };
    f[ param.cmd ]();
    //else if ( === "listFavs")
    //else return 'あなた使い方間違えてませんか…';
  }

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
    BTN.subjectWin = {
      reload: function(){BBS.askmona.showTopics();},
    }
    API.status("（・ω・）Thread list loading...");
    var sReqC_then = ++subjectReqCount; // http://stackoverflow.com/a/9999813
    $.askmona.topicsAll({},function(data){
      if (subjectReqCount !== sReqC_then) return;
      window.BBS.askmona.topics = data;
      BBS.askmona.renderTopics(data);

      /* カテゴリを調べてくれるけど正直あまり意味ないかなって
      var worker = new Worker('./site_scripts/askmona/categoryCrawl.worker.js');

      worker.addEventListener('message', function(e) {
        console.log(e.data);
      }, false);

      worker.postMessage(data); // Send data to our worker.
      */
    });
  }

  ,renderTopics: function(topics){
    var columns = [
      {id: "rank", name: "No.", field: "rank", width: 50, sortable: true, cssClass: "cell-textRight"},
      {id: "cat", name: "カテゴリ", field: "category", width: 100, sortable: true, cssClass: ""},
      {id: "title", name: "トピック ", field: "title", width: 450, sortable: true, cssClass: ""},
      {id: "count", name: "ﾚｽ数", field: "count", width: 55, sortable: true, cssClass: "cell-textRight"},
      {id: "created", name: "ﾄﾋﾟ立", field: "created", width: 175, sortable: true, cssClass: "cell-textRight", formatter: unix2date},
      {id: "updated", name: "更新", field: "modified", width: 175, sortable: true, cssClass: "cell-textRight", formatter: unix2date},
      {id: "lead", name: "リード ", field: "lead", width: 650, sortable: true, cssClass: ""}
    ];
    var options = {
      enableCellNavigation: false,
      enableColumnReorder: false,
      multiColumnSort: false
    };
    grid = new Slick.Grid(".subjectWin-view", topics, columns, options);
    API.status("（ ´∀｀）Thread list loaded!");

    grid.onClick.subscribe(function(e, args) {
      var item = args.row;
      BBS.askmona.openThread(window.BBS.askmona.topics[item], true, true);
    });
    grid.onSort.subscribe(function (e, args) {
      console.log(args);
      var field = args.sortCol.field;
      topics.sort(function (a, b) {
        //console.log([a,b]);
        //return -1;
        var result =
          a[field] > b[field] ? 1 :
          (a[field] < b[field] ? -1 : 0);
        return args.sortAsc ? result : -result;
      });
      console.log(topics);
      grid.invalidate();
      grid.setData(topics);
      grid.render();
     });

      $('.subjectWin-view').css('overflow-y','auto');
  }

  ,openThread: function(thread, isObj, eraseView){
    var th_id = (isObj) ? thread.t_id : thread;
    var title = (isObj) ? thread.title : 'ﾄﾋﾟｯｸID: ' + thread;
    API.threadWin.history.add('askmona', {cmd:'openTopic', thread:thread, isObj:isObj}, 'openTopic:' + th_id, title + ' [Ask Mona]');
    var html = '<div id="th_title" class="title">' + title + '</div>';
    if (eraseView) API.threadWin.displayHtml(html);
    API.status("（ ・～・）Responses PREPARING... : "  + title);
    if ('executingQueue' in window) { try{window.executingQueue.terminate();}catch(e){} } // ワーカーで作業中だった場合
    window.executingQueue = 0;
    API.status("（ ・～・）Responses loading... : "  + title);
    var getDetail = (isObj) ? 0 : 1;
    var sReqC_then = ++threadReqCount; // http://stackoverflow.com/a/9999813
    $.askmona.responses({t_id:th_id, to:1000, topic_detail:getDetail},function(data){
      if (threadReqCount !== sReqC_then) return;
      var th_obj = (isObj) ? thread : data.topic;
      BBS.askmona.thread = th_obj;  // スレッドって名前だけど実はトピックオブジェクトを格納している
      BBS.askmona.responses = data.responses;
      BBS.askmona.renderThread(th_obj, data.responses);
    });
  }

  ,renderThread: function(th_obj, responses) {
    API.threadWin.history.add('askmona', {cmd:'openTopic', thread:th_obj, isObj:true}, 'openTopic:' + th_obj.t_id, th_obj.title + ' [Ask Mona]');
    window.executingQueue = new Worker('./site_scripts/askmona/threadRender.worker.js');
    API.status("（ ・～・）Responses RENDERING... : "  + th_obj.title);

    window.executingQueue.addEventListener('message', function(e) {
      delete window.executingQueue;
      API.threadWin.displayHtml('<div id="th_title" class="title">' + th_obj.title + '</div>' + e.data + '<div class="title" style="margin-top: 10px;">' + th_obj.title + '</div>')
      API.threadWin.scrollTop(0);
      API.status("（ ・∀・）Responses loaded! : "  + th_obj.title);
      window.nowWork = 0;

      BTN.threadWin = {
        reload: function(){BBS.askmona.openThread(th_obj.t_id, false, false);},
        openPostWin: function(){BBS.askmona.showPostWin(th_obj.t_id, th_obj.title);}
      }

      // クイック送金ツールチップの準備
      $('.send').qtip({
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

      //安価ポップアップの準備
      $(document).on('mouseover', 'a.anchor', function(event) {
          $(this).qtip({
            content: {
              text: function(event, api) {
                setTimeout(function(){
                  ankaStr = api.elements.target.attr('data-anchor');
                  responses = BBS.askmona.responses;
                  var worker = new Worker('./site_scripts/askmona/ankaRender.worker.js');
                  worker.addEventListener('message', function(e) {
                    api.set('content.text', e.data); // サンプルをコピペしたままなので変数見つからんと怒られた。。。
                  }, false);
                  worker.postMessage([BBS.askmona.thread, responses, ankaStr]); // ワーカーにデータを送信（HTML組立処理開始）
                }, 0);
                return 'Loading...'; // Set some initial text
                 }
            },
            position: {
              my: 'center left',  // Position my top left...
              at: 'center right', // at the bottom right of...
              viewport: $(window),
              effect: false,
              adjust: {
                method: 'shift'
              }
            },
            show: {
               event: event.type,
               ready: true,
               effect: false
            },
            hide: {
              fixed: true,
              delay: 300
            },
            style: { 'classes': 'anchorTooltip' }
          });
      });

      // 書き込みウィンドウの準備
      if(!(th_obj.t_id in BBS.askmona.postWin)) {
        var dlgHtml = '<div id="postWin-AM-' + th_obj.t_id + '" >'
                    + '  <input type="button" value="書き込み" onclick="BBS.askmona.post(' + th_obj.t_id + ', \'' + th_obj.title + '\')" />'
                    + '  <input type="checkbox" class="sage" value="sage">sage'
                    + '  <textarea rows="4" cols="40" class="postText"></textarea><br>'
                    + '</div>';
        BBS.askmona.postWin[th_obj.t_id] = $(dlgHtml)
         .dialog({
            title: '書込: ' + th_obj.title,
            width:600,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});
      }

      // 送金ウィンドウの準備
      if(!(th_obj.t_id in BBS.askmona.sendWin)) {
        var dlgHtml = '<div id="sendWin-AM-' + th_obj.t_id + '" >'
                    + '  <input type="button" value="送金する" onclick="BBS.askmona.sendToRes(' + th_obj.t_id + ', 0, 0)" />'
                    + '  ﾚｽ:<input type="text" class="res-id" value="0" size="6" maxlength="4">　'
                    + '  額:<input type="text" class="amount" value="0">　'
                    + '  <input type="checkbox" class="anonymous" value="anonymous">匿名　'
                    + '  <input type="checkbox" class="sage" value="sage">sage'
                    + '  <textarea rows="4" cols="40" class="postText"></textarea><br>'
                    + '</div>';
        BBS.askmona.sendWin[th_obj.t_id] = $(dlgHtml)
         .dialog({
            title: '送金: ' + th_obj.title,
            width:600,
            height:300,
            autoOpen: false
          })
         .css({"background":"white", "font-size":"14px"});
      }
    }, false);

    window.executingQueue.postMessage([th_obj, responses]); // ワーカーにデータを送信（HTML組立処理開始）
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
