importScripts();  // ここにはなにもないよ

catList = {};

self.addEventListener('message', function(e) {
  for(i = 0; i<e.data.length; i++) {
      catList[ e.data[i].cat_id ] = e.data[i].category;
  }
  self.postMessage(catList);
  close();
}, false);
