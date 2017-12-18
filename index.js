/**
* SignMaker v2.0.2
* https://github.com/Slevinski/signmaker
* Copyright (c) 2007-2017, Stephen E Slevinski Jr
* SignMaker is released under the MIT License.
*/
var isApp = false;

function setChars(chars){
  chars = (chars=='fsw')?'fsw':'swu';
  localStorage['chars'] = chars;
  signmaker.vm.chars = chars;
}

function setColoring(name){
  document.body.className=name;
  localStorage['colorPref']=name;
}
setColoring(localStorage['colorPref']?localStorage['colorPref']:'colorful');
//translations
var t;
var allSignLang = {};
allSignLang['alphabet']=Object.keys(defmessages).filter(function(key){return (key.slice(0,4)=="sgn_");});  
allSignLang['dictionary']=Object.keys(defmessages).filter(function(key){return (key.slice(0,4)=="sgn_");});  
var signLang={};
signLang['alphabet'] = allSignLang['alphabet'].slice(0);
signLang['dictionary'] = allSignLang['dictionary'].slice(0);
function checkSignLang(type) {
  //type=alphabet or dictionary
  if (!allSignLang[type].length) return;
  var key = allSignLang[type].shift();
  var url = 'config/' + type + "/" + type + '-' + key.slice(4) + '.js';
  var xhr = new XMLHttpRequest();
  xhr.open('HEAD', url, true);
  xhr.onload = function (e) {
    if (xhr.status == 404) {
      var index = signLang[type].indexOf(key);
      if (index > -1) {
        signLang[type].splice(index, 1);
      }
    }
    checkSignLang(type);
  };
  xhr.onerror = function (e) {
    var index = signLang[type].indexOf(key);
    if (index > -1) {
      signLang[type].splice(index, 1);
    }
    checkSignLang(type);
  };
  xhr.send(null);
}

function setUI(lang){
  if(t && lang==localStorage['langUI']) return;
  var msg = messages[lang];
  if (!msg) {
    lang='en';
    msg = messages[lang];
  }
  localStorage['langUI']=lang;
  for (var attr in defmessages) { if(!msg[attr]) msg[attr]=defmessages[attr];}
  t = libTranslate.getTranslationFunction(msg);
  m.redraw();
}
function tt(args){
  text = t.apply(this,arguments);
  text = text.replace(/@@/g,'');
  return m.trust(ssw.svg(text) || '<p>' + text + '</p>');
}

window.onresize = function (){
  m.redraw();
}

window.onhashchange = hashChange;

var langAlphabet,langDictionary;
function setAlphabet(lang){
  if(lang==langAlphabet) return;
  langAlphabet=lang;
  classie.addClass(document.body,"waiting");
  var js = document.createElement("script");
  js.type = "text/javascript";
  delete window.alphabet;
  if (langAlphabet){
    js.src = "config/alphabet/alphabet-" + langAlphabet + ".js?" + Date.now();
  } else {
    js.src = "config/alphabet.js?" + Date.now();
  }
  document.getElementsByTagName('head')[0].appendChild(js);  
  var jsCheck = setInterval(function(){
    if (window.alphabet && palette){
      classie.removeClass(document.body,"waiting");
      palette.vm.init();
      palette.vm.select();
      m.redraw();
      clearInterval(jsCheck);
    }
  },100);
}

function hashSet(){
  var hash = '?ui=' + localStorage['langUI'];
  if (langAlphabet) hash+= '&alphabet=' + langAlphabet;
  if (langDictionary) hash+= '&dictionary=' + langDictionary;
  window.location.hash = hash
}
function hashChange(event){
  var vars={};
  var hash;
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  for(var i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars[hash[0]] = hash[1];
  }
  setUI(vars['ui']?vars['ui']:localStorage['langUI']?localStorage['langUI']:'en');
  setAlphabet(vars['alphabet']?vars['alphabet']:'');
  setDictionary(vars['dictionary']?vars['dictionary']:'');
}
 
var url = window.location.protocol.replace(/\:/g,'') + "://" + window.location.host + window.location.pathname;
var fname = window.location.pathname.split('/').slice(-1)[0];
if (fname) url = url.replace(fname,'');
url += "config/dictionary.js";

// HEADER
//////////
var header = {};
header.controller = function(){};
header.view = function(ctrl){
  return [m("p",tt("signmaker"), m.trust("&nbsp;"),m("p","2017"))];
};


// DICTIONARY
/////////////
var dlFile = null;
var dictionary = {};
dictionary.controller = function(){};
dictionary.vm = {
  setpagesize: function(size){
    if (size<1 || size>5) return;
    var first = dictionary.vm.page()*dictionary.vm.subset;
    dictionary.vm.pagesize = size;
    dictionary.vm.subset = (size+1) * size * 2;
    dictionary.vm.setpage(parseInt(first/dictionary.vm.subset));
    m.redraw();
  },
  pagesize: 4,
  subset: 40,
  refresh: function(){
    classie.addClass(document.body,"waiting");
    var js = document.createElement("script");
    js.type = "text/javascript";
    js.src = "config/dictionary.js?" + Date.now();
    document.getElementsByTagName('head')[0].appendChild(js);
    setTimeout(function(){classie.removeClass(document.body,"waiting");localStorage['dict']=window.dict;dictionary.vm.search();m.redraw();},500);
  },
  empty: function(){
    localStorage['dict']='';
    dictionary.vm.search();
  },
  localCopy: function(){
    localStorage['dict']=window.dict;
    setDictionary('');
    hashSet();
    dictionary.vm.search();
  },
  import: function(){
    var dictText = document.getElementById("dictText").value;
    var lines = dictText.split("\n");
    dictText = '';
    var fsw,start,end;
    for (var i=0; i<lines.length; i++){
      fsw = ssw.sign(lines[i]);
      if (fsw){
        start = lines[i].indexOf(fsw);
        end = lines[i].indexOf('\\n"');
        if (end==-1){
          end = lines[i].length;
        }
        dictText += lines[i].slice(start,end) + "\n";
      }
    }
    localStorage['dict']=dictText;
    setDictionary('');
    hashSet();
    dictionary.vm.search();
    
  },
  export: function(){
    var lines;
    if (langDictionary){
      lines = window.dict.split("\n");
    } else {
      lines = localStorage['dict'].split("\n");
    }
    var raw = 'window.dict = "' + lines.shift() + '\\n";\n';
    for (var i=0; i < lines.length; i++) {
      raw += 'dict += "' + lines[i] + '\\n";\n';
    }
    
    var data = new Blob([raw], {type: 'text/javascript'});
    if (dlFile !== null) {
      window.URL.revokeObjectURL(dlFile);
    }
    dlFile = window.URL.createObjectURL(data);
    var link = document.getElementById('downloadlink');
    link.href = dlFile;
    link.download="dictionary.js" ;
    link.click();    
  },
  search: function(){
    var search = document.getElementById("search");
    search = search?search.value:'';
    var pattern,matched,matches;
    var query = ssw.query(search);
    var queryu = ssw.queryu(search);
    if (ssw.query(search)){
      if (queryu > query) {
        query = ssw.query2fsw(queryu);
      }
      if (langDictionary){
        dictionary.vm.matches = ssw.lines(query,window.dict).sort();
      } else {
        dictionary.vm.matches = ssw.lines(query,localStorage['dict']).sort();
      }
    } else {
      search = ssw.swu2fsw(search);
      search=search?search:".+";
      pattern = '^.*' + search + '.*';
      if (langDictionary){
        matched = window.dict.match(RegExp(pattern,'mgi'));
      } else {
        matched = localStorage['dict']?localStorage['dict'].match(RegExp(pattern,'mgi')):'';
      }
      if (matched){

        dictionary.vm.matches = matched.sort();
      } else {
        dictionary.vm.matches = [];
      }
    }
    dictionary.vm.page(0);
    dictionary.vm.setgrid();
    if (palette && palette.vm.dialing) palette.vm.select();
  },
  page: m.prop(0),
  setpage: function(page){
    dictionary.vm.page(page);
    dictionary.vm.setgrid();
  },
  matches: [],
  grid: [[],[],[],[],[],[],[],[],[],[]],
  setgrid: function(){
    dictionary.vm.grid=[[],[],[],[],[],[],[],[],[],[]];
    var cnt=0;
    for (var i=dictionary.vm.page()*dictionary.vm.subset; i < dictionary.vm.matches.length; i++) {
      dictionary.vm.grid[(cnt++%(dictionary.vm.pagesize*2))].push(dictionary.vm.matches[i]);
      if ((cnt+1)>dictionary.vm.subset) break;
    }
    dictionary.vm.temp = dictionary.vm.matches;

    m.redraw();
  },
};
function setDictionary(lang){
  if(lang===langDictionary) return;
  langDictionary=lang;
  if (langDictionary){
    classie.addClass(document.body,"waiting");
    var js = document.createElement("script");
    js.type = "text/javascript";
    delete window.dict;
    js.src = "config/dictionary/dictionary-" + langDictionary + ".js?" + Date.now();
    document.getElementsByTagName('head')[0].appendChild(js);  
    var jsCheck = setInterval(function(){
      if (window.dict){
        classie.removeClass(document.body,"waiting");
        dictionary.vm.search();
        m.redraw();
        clearInterval(jsCheck);
      }
    },100);
  } else {
    dictionary.vm.search();
  }
}

hashChange();

dictionary.view = function(ctrl){
  var page = dictionary.vm.page();
  var maxpage = parseInt((dictionary.vm.matches.length-1)/dictionary.vm.subset);
  return [m("input",{class:"ssw-one-d", id:"search",oninput: dictionary.vm.search}),
    m("div.btn.clickable",{onclick:dictionary.vm.setpagesize.bind(dictionary.vm,dictionary.vm.pagesize-1)},tt('M508x508S37b16492x498S37b10498x492')),
    m("div.btn.clickable",{onclick:dictionary.vm.setpagesize.bind(dictionary.vm,dictionary.vm.pagesize+1)},tt('M508x502S37b16492x498')),
    dictionary.vm.grid.map(function(row){
      return m("div.row.s" + dictionary.vm.pagesize,row.map(function(fsw){
        var terms = fsw.split('\t');
        terms.shift();
        return m("div", {title: terms.join(', '), key: fsw.id,onclick: signmaker.vm.load.bind(signmaker.vm,fsw)}
          ,m.trust(ssw.svg(ssw.sign(fsw),(signmaker.vm.chars == "swu")?{"copy":"opt"}:'')));
      }));
    }),
    m("div.bottom",[
      (maxpage>0)?[
        m("div.btn.paging.clickable",{onclick:dictionary.vm.setpage.bind(dictionary.vm,maxpage)},tt('lastPage')),
        (page>=maxpage)?m("div.btn.paging"):m("div.btn.paging.clickable",{onclick:dictionary.vm.setpage.bind(dictionary.vm,page+1)},tt('nextPage')),
        (page<=0)?m("div.btn.paging"):m("div.btn.paging.clickable",{onclick:dictionary.vm.setpage.bind(dictionary.vm,page-1)},tt('prevPage')),
        m("div.btn.paging.clickable",{onclick:dictionary.vm.setpage.bind(dictionary.vm,0)},tt('firstPage')),
        m("div.pageinfo",m.trust("&nbsp;&nbsp;" + (1+dictionary.vm.page()) + " / " + (1+maxpage)))
      ]:'',
    ]),
  ];
};
// SIGNMAKER
////////////

var spatials = {};

spatials.Symbol = function(data) {
    this.key = m.prop(data.key);
    this.x = m.prop(data.x);
    this.y = m.prop(data.y);
    this.selected = m.prop(true);
};

spatials.List = Array;


var signmaker = {};

// vm
signmaker.vm = {
  midWidth: 125,
  midHeight: 125,
  grid: m.prop(localStorage['gridPref']?parseInt(localStorage['gridPref']):1),
  chars: localStorage['chars']?localStorage['chars']:'swu',
  dictView: m.prop(localStorage['dictView']?parseInt(localStorage['dictView']):'text'),
  entry: m.prop(""),
  new: function(){
    signmaker.vm.entry('');
    signmaker.vm.list=new spatials.List();
    signmaker.vm.sort=[];
    signmaker.vm.terms=['','','','','','','',''];
    signmaker.vm.history = ['{"list":[],"sort":[],"terms":[]},"entry":""'];
    signmaker.vm.cursor = 0;
  },
  update: function(){
    if (signmaker.vm.entry().trim()){
      var temp = localStorage['dict'].replace(signmaker.vm.entry() + '\n',signmaker.vm.newentry() + '\n');
      if (temp == localStorage['dict']){
        console.log('update entry failed');
      } else {
        localStorage['dict']=temp;
        signmaker.vm.load(signmaker.vm.newentry());
        var page = dictionary.vm.page();
        dictionary.vm.search();
        dictionary.vm.setpage(page);
      }
    }
  },
  insert: function(){
    if (signmaker.vm.newentry().trim()){
      if (!localStorage['dict']) localStorage['dict']='';
      if (localStorage['dict'].slice(-1)!="\n"){
        localStorage['dict'] += "\n";
      }
      localStorage['dict'] += signmaker.vm.newentry();
      signmaker.vm.load(signmaker.vm.newentry());
      var page = dictionary.vm.page();
      dictionary.vm.search();
      dictionary.vm.setpage(page);
    }
  },
  delentry: function(){
    if (signmaker.vm.entry().trim()){
      var temp = localStorage['dict'].replace(signmaker.vm.entry() + '\n','');
      if (temp == localStorage['dict']){
        temp = localStorage['dict'].replace(signmaker.vm.entry(),'');
      }
      if (temp == localStorage['dict']){
        console.log('delentry failed');
      } else {
        localStorage['dict']=temp;
        signmaker.vm.new();
        var page = dictionary.vm.page();
        dictionary.vm.search();
        dictionary.vm.setpage(page);
      }
    }
  },
  load: function(entry){
    signmaker.vm.entry(entry);
    signmaker.vm.terms = entry.split('\t');
    var fsw = signmaker.vm.terms.shift();
    while (signmaker.vm.terms.length<8){
      signmaker.vm.terms.push('');
    }
    signmaker.vm.fsw(fsw);
    m.redraw();
  },
  fswlive: function(){
    var fsw = 'M500x500';
    if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
    if (signmaker.vm.list.length){
      for (var i=0; i < signmaker.vm.list.length; i++) {
        fsw += signmaker.vm.list[i].key() + signmaker.vm.list[i].x() + 'x' + signmaker.vm.list[i].y();
      }
      var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
      fsw = fsw.replace("M500x500","M" + bbox[1] + 'x' + bbox[3]);
    }
    return fsw=="M500x500"?'':fsw;
  },
  swulive: function(){
    return ssw.fsw2swu(signmaker.vm.fswlive());
  },
  swunorm: function(){
    return ssw.fsw2swu(signmaker.vm.fswnorm());
  },
  fswnorm: function(){
    var fsw = 'M500x500';
    if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
    if (signmaker.vm.list.length){
      for (var i=0; i < signmaker.vm.list.length; i++) {
        fsw += signmaker.vm.list[i].key() + signmaker.vm.list[i].x() + 'x' + signmaker.vm.list[i].y();
      }
      var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
        fsw = fsw.replace("M500x500",bbox[1] + 'x' + bbox[3]);
    }
    return ssw.norm(fsw);
  },
  fsw: function(fsw,silent){
    if (typeof(fsw)!='undefined') {
      
      fsw = ssw.sign(fsw);
      var syms = fsw.match(/S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) || [];
      signmaker.vm.list = new spatials.List();
      for (var i=0; i < syms.length; i++) {
        signmaker.vm.list.push(new spatials.Symbol({key:syms[i].slice(0,6),x:parseInt(syms[i].slice(6,9)),y:parseInt(syms[i].slice(10,13))}))
      }
      syms = fsw.match(/A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/) || [];
      if (syms.length) {
        signmaker.vm.sort= syms[0].slice(1).match(/.{6}/g);
      } else {
        signmaker.vm.sort = [];
      }
      signmaker.vm.addhistory(silent);
      signmaker.vm.selnone();

    }
    return signmaker.vm.fswlive();
  },
  fswraw: '',
  fswview: function(fsw){
    if (typeof(fsw)!='undefined') {
      signmaker.vm.fswraw = fsw;
      signmaker.vm.swuraw = '';
      fsw = ssw.parse(fsw,"fsw")["fsw"];
      signmaker.vm.fsw(fsw,true);
      if (fsw==signmaker.vm.fswraw) {
        signmaker.vm.fswraw = '';
      } else {
        fsw = signmaker.vm.fswraw;
      }
    } else {
      fsw = signmaker.vm.fswraw || signmaker.vm.fswlive();
    }
    return fsw;
  },
  swu: function(swu,silent){
    if (swu!='undefined') {
      signmaker.vm.fsw(ssw.swu2fsw(swu),silent);
    } else {
      fsw = 'M500x500';
      if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
      for (var i=0; i < signmaker.vm.list.length; i++) {
        fsw += signmaker.vm.list[i].key() + signmaker.vm.list[i].x() + 'x' + signmaker.vm.list[i].y();
      }
    }
  },
  swuraw: '',
  swuview: function(swu){
    if (typeof(swu)!='undefined') {
      signmaker.vm.swuraw = swu;
      signmaker.vm.fswraw = '';
      swu = ssw.parse(swu,"swu")["swu"];
      signmaker.vm.swu(swu,true);
      if (swu==signmaker.vm.swuraw) {
        signmaker.vm.swuraw = '';
      } else {
        swu = signmaker.vm.swuraw;
      }
    } else {
      swu = signmaker.vm.swuraw || signmaker.vm.swulive();
    }
    return swu;
  },
  styling: m.prop(''),
  newentry: function(){
    return (ssw.norm(signmaker.vm.fsw()) + '\t' + signmaker.vm.terms.join('\t')).replace(/\t\t/g, '').trim();	
  },
  dlpng: function(){
    var canvas = ssw.canvas(signmaker.vm.fswnorm()+signmaker.vm.styling(),{size: signmaker.vm.size(), pad: signmaker.vm.pad(), line: signmaker.vm.linecolor(), fill: signmaker.vm.fillcolor(), back: signmaker.vm.backcolor(), colorize: signmaker.vm.colorize()});
    var data = canvas.toDataURL("image/png");
    var link = document.getElementById('downloadlink');
    link.href = data;
    link.download=(signmaker.vm.terms[0]?signmaker.vm.terms[0]:"sign") + ".png" ;
    link.click();    
  },
  dlsvg: function(){
    var svg = ssw.svg(signmaker.vm.fswnorm()+signmaker.vm.styling(),{
      size: signmaker.vm.size(),
      pad: signmaker.vm.pad(),
      line: signmaker.vm.linecolor(), 
      fill: signmaker.vm.fillcolor(), 
      back: signmaker.vm.backcolor(), 
      colorize: signmaker.vm.colorize(),
      copy: (signmaker.vm.chars == "swu")?"opt":''
    });

    var data = new Blob([svg], {type: 'image/svg+xml'});
    if (dlFile !== null) {
      window.URL.revokeObjectURL(dlFile);
    }
    dlFile = window.URL.createObjectURL(data);
    var link = document.getElementById('downloadlink');
    link.href = dlFile;
    link.download=(signmaker.vm.terms[0]?signmaker.vm.terms[0]:"sign") + ".svg" ;
    link.click();    
  },
  size: m.prop('1'),
  pad: m.prop('0'),
  linecolor: m.prop('black'),
  fillcolor: m.prop('white'),
  backcolor: m.prop(''),
  colorize: m.prop(''),
  center: function(){
    signmaker.vm.fsw(ssw.norm(signmaker.vm.fsw()));
  },
  search: function(flags){
    var query = ssw.convert(signmaker.vm.fsw(),flags);
    if (query) {
      document.getElementById("search").value = query;
      dictionary.vm.search();
    }
  },
  list: new spatials.List(),
  sort: [],
  terms: ["","","","","","","",""],
  history: ['{"list":[],"sort":[],"terms":["","","","","","","",""],"entry":""}'],
  cursor: 0,
  addhistory: function(silent){
    if (!silent) {
      signmaker.vm.fswraw = '';
      signmaker.vm.swuraw = '';
    }
    var history ={list:signmaker.vm.list,sort:signmaker.vm.sort,terms:signmaker.vm.terms,entry:signmaker.vm.entry()};
    var newhist = JSON.stringify(history).replace(/true/g,'false');
    if (newhist != signmaker.vm.history[signmaker.vm.cursor]){
      signmaker.vm.cursor++;
      signmaker.vm.history = signmaker.vm.history.slice(0,signmaker.vm.cursor);
      signmaker.vm.history.push(newhist);
    } 
  },
  undo: function(){
    if (signmaker.vm.cursor<=0) return;
    signmaker.vm.cursor--;
    var history = JSON.parse(signmaker.vm.history[signmaker.vm.cursor]);
    var syms = history['list'];
    signmaker.vm.list = new spatials.List();
    for (var i=0; i < syms.length; i++) {
      signmaker.vm.list.push(new spatials.Symbol({key:syms[i]['key'],x:syms[i]['x'],y:syms[i]['y']}))
    }
    signmaker.vm.selnone();
    signmaker.vm.sort = history['sort'];
    signmaker.vm.terms = history['terms'];
    signmaker.vm.entry(history['entry']);
    m.redraw();
  },
  redo: function(){
    if ((signmaker.vm.cursor+1)>=signmaker.vm.history.length) return;
    signmaker.vm.cursor++;
    var history = JSON.parse(signmaker.vm.history[signmaker.vm.cursor]);
    var syms = history['list'];
    signmaker.vm.list = new spatials.List();
    for (var i=0; i < syms.length; i++) {
      signmaker.vm.list.push(new spatials.Symbol({key:syms[i]['key'],x:syms[i]['x'],y:syms[i]['y']}))
    }
    signmaker.vm.selnone();
    signmaker.vm.sort = history['sort'];
    signmaker.vm.terms = history['terms'];
    signmaker.vm.entry(history['entry']);
    m.redraw();
  },
  current: m.prop(0),
  tab: function(index){
    signmaker.vm.current(index);
    m.redraw();
  },
  add: function(symbol) {
    signmaker.vm.selnone();
    if (symbol) {
      signmaker.vm.list.push(new spatials.Symbol(symbol));
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  addSeq: function(key,position) {
    signmaker.vm.sort.splice(position, 0, key);
    signmaker.vm.addhistory();
    m.redraw();
  },
  selnone: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      signmaker.vm.list[i].selected(false);
    }
  },
  copy: function() {
    var len = signmaker.vm.list.length;
    for (var i=0; i < len; i++) {
      if (signmaker.vm.list[i].selected()){
        var symbol = signmaker.vm.list[i];
        signmaker.vm.add({key:symbol.key(),x:symbol.x()+10,y:symbol.y()+10});
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  delete: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list.splice(i,1);
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  clear: function() {
    signmaker.vm.list = new spatials.List();
    signmaker.vm.sort=[];
    signmaker.vm.addhistory();
    m.redraw();
  },
  variation: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.scroll(signmaker.vm.list[i].key(),step));
      }
     }
    signmaker.vm.addhistory();
    m.redraw();
  },
  mirror: function() {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.mirror(signmaker.vm.list[i].key()));
       }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  fill: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.fill(signmaker.vm.list[i].key(),step));
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  over: function() {
    var len = signmaker.vm.list.length;
    for (var i=0; i < len; i++) {
      if (signmaker.vm.list[i].selected()){
        var symbol = signmaker.vm.list[i];
        signmaker.vm.add({key:symbol.key(),x:symbol.x(),y:symbol.y()});
        signmaker.vm.list.splice(i,1);
        len--;
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  rotate: function(step) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].key(ssw.rotate(signmaker.vm.list[i].key(),step));
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  },
  select: function(step) {
    if (!signmaker.vm.list.length) return;
    var sel = 0;
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        sel = i;
      }
    }
    sel += step;
    if (sel<0) sel = signmaker.vm.list.length-1;
    if (sel>=signmaker.vm.list.length) sel = 0;
    signmaker.vm.selnone();
    signmaker.vm.list[sel].selected(true);
    m.redraw();
  },
  move: function(x,y) {
    for (var i=0; i < signmaker.vm.list.length; i++) {
      if (signmaker.vm.list[i].selected()){
        signmaker.vm.list[i].x(signmaker.vm.list[i].x()+x);
        signmaker.vm.list[i].y(signmaker.vm.list[i].y()+y);
      }
    }
    signmaker.vm.addhistory();
    m.redraw();
  }
};
signmaker.controller = function(){
//  signmaker.vm.init();
};

function sbDragEnd( draggie,e,p ) {
  var sb = document.getElementById("signbox");
  var drag = draggie.dragPoint;
  if (overlap(draggie.element,sb)){
    signmaker.vm.list[draggie.element.index].x(signmaker.vm.list[draggie.element.index].x() + drag.x);
    signmaker.vm.list[draggie.element.index].y(signmaker.vm.list[draggie.element.index].y() + drag.y);
    signmaker.vm.addhistory();
    m.redraw();
  } else {
    var seq = document.getElementById("sequence");
    if (overlap(draggie.element,seq)){
      var position = parseInt(draggie.position.y / (window.innerHeight/20));
      var key = signmaker.vm.list[draggie.element.index].key();
      signmaker.vm.addSeq(key,position);
    }
    draggie.element.style.left = (parseInt(draggie.element.style.left) - drag.x) + 'px';
    draggie.element.style.top = (parseInt(draggie.element.style.top) - drag.y) + 'px';
  }
}

function sbDragStart( draggie ){
  signmaker.vm.selnone();
  signmaker.vm.list[draggie.element.index].selected(true);
}

function seqDragEnd( draggie,e,p ) {
  var position1 = parseInt(draggie.startPoint.y / (window.innerHeight/20));
  var position2 = parseInt((draggie.startPoint.y+draggie.dragPoint.y) / (window.innerHeight/20));
  draggie.element.style.left = (parseInt(draggie.element.style.left) - draggie.dragPoint.x) + 'px';
  draggie.element.style.top = (parseInt(draggie.element.style.top) - draggie.dragPoint.y) + 'px';
  if (position1<signmaker.vm.sort.length){
    if (position1!=position2){
      signmaker.vm.sort.splice(position2, 0, signmaker.vm.sort.splice(position1, 1)[0]);
    } else {
      signmaker.vm.sort.splice(position1,1);
    }
    signmaker.vm.addhistory();
    m.redraw();
  }
}

signmaker.view = function(ctrl){
  var clientWidth = document.getElementById('signmaker').clientWidth*.90
  var clientHeight = document.getElementById('signmaker').clientHeight*.5;
  signmaker.vm.midWidth = parseInt(clientWidth/2);
  signmaker.vm.midHeight = parseInt(clientHeight/2);
  var bbox = ssw.bbox(ssw.max(signmaker.vm.fsw())).split(" ");
  //check if bbox is outside of display
  if (bbox.length==4){
    if (bbox[0]<510-signmaker.vm.midWidth || bbox[1]>490+signmaker.vm.midWidth) { // left or right
      signmaker.vm.midWidth = signmaker.vm.midWidth + 500 - parseInt((parseInt(bbox[0])+parseInt(bbox[1]))/2);
    }
    if (bbox[2]<510-signmaker.vm.midHeight || bbox[3]>490+signmaker.vm.midHeight) { // top or bottom
      signmaker.vm.midHeight = signmaker.vm.midHeight + 500 - parseInt((parseInt(bbox[2])+parseInt(bbox[3]))/2);
    }
  }
  var grid = '';
  switch (signmaker.vm.grid()) {
    case 0:
      break;
    case 1:
      grid = '<svg width="' + clientWidth + '" height="' + clientHeight + '" viewBox="0 0 ' + clientWidth + ' ' + clientHeight + '" xmlns="http://www.w3.org/2000/svg" version="1.1">';
      grid += '<g stroke="gray" >';
      grid += '<line x1="0" y1="' + signmaker.vm.midHeight + '" x2="' + clientWidth + '" y2="' + signmaker.vm.midHeight + '" stroke-width="1"  />';
      grid += '<line y1="0" x1="' + signmaker.vm.midWidth + '" y2="' + clientHeight + '" x2="' + signmaker.vm.midWidth + '" stroke-width="1"  />';
      grid += '</g>';
      grid += '</svg>';
      break;
    case 2:
      grid = '<svg width="' + clientWidth + '" height="' + clientHeight + '" viewBox="0 0 ' + clientWidth + ' ' + clientHeight + '" xmlns="http://www.w3.org/2000/svg" version="1.1">';
      grid += '<g stroke="lightgray" >';
      var startH = signmaker.vm.midHeight % 10;
      var startW = signmaker.vm.midWidth % 10;
      for (var w=startW;w<clientWidth;w+=10){
        grid += '<line y1="0" x1="' + w + '" y2="' + clientHeight + '" x2="' + w + '" stroke-width="1"  />';
      }
      for (var h=startH;h<clientHeight;h+=10){
        grid += '<line x1="0" y1="' + h + '" x2="' + clientWidth + '" y2="' + h + '" stroke-width="1"  />';
      }
      grid += '</g>';
      grid += '<g stroke="gray" >';
      grid += '<line x1="0" y1="' + signmaker.vm.midHeight + '" x2="' + clientWidth + '" y2="' + signmaker.vm.midHeight + '" stroke-width="1"  />';
      grid += '<line y1="0" x1="' + signmaker.vm.midWidth + '" y2="' + clientHeight + '" x2="' + signmaker.vm.midWidth + '" stroke-width="1"  />';
      grid += '</g>';
      grid += '</svg>';
      break;
  }
  var editor = [m('div',{id:"signbox"},[
    m("div",m.trust(grid)),
    signmaker.vm.list.map(function(symbol, index) {
      return m("div"
      , {
        "class": symbol.selected() ? "selected" : "",
        style:{
          left: (parseInt(symbol.x())-500+signmaker.vm.midWidth).toString() + 'px',
          top: (parseInt(symbol.y())-500+signmaker.vm.midHeight).toString() + 'px'
        },
        config: function(element, isInitialized) {
          element.index=index;
          if (!isInitialized) {
            var draggie = new Draggabilly(element,{containment:"#signmaker"});
            draggie.on( 'dragStart', sbDragStart );
            draggie.on( 'dragEnd', sbDragEnd );
          }
        }
      },m.trust(ssw.svg(symbol.key())));
    })
  ]),
  m('div',{id:"sequence"},
    signmaker.vm.sort.concat('').map(function(key) {
      return m("div.sort"
      , {
        config: function(element, isInitialized) {
          element.key=key;
          if (!isInitialized) {
            var draggie = new Draggabilly(element,{containment:"#sequence"});
            draggie.on( 'dragEnd', seqDragEnd );
          }
        }
      },m.trust(ssw.svg(key)));
    }))
  ];

  var currentTab;
  switch (signmaker.vm.current()) {
    case 0:
      currentTab = [
        m("div.cmdslim.clickable.",{onclick: signmaker.vm.move.bind(signmaker.vm,-1,0)},tt('moveLeft')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,0,-1)},tt('moveUp')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,0,1)},tt('moveDown')),
        m('div.cmdslim.clickable',{onclick: signmaker.vm.move.bind(signmaker.vm,1,0)},tt('moveRight')),
        (signmaker.vm.chars=="fsw")?
          m('div.cmdrow',
            m("p.fsw","FSW:"),
            m("input",{"class": (signmaker.vm.fswraw && (signmaker.vm.fswraw != signmaker.vm.fswlive()))?'warning':'', id:"fsw",value:signmaker.vm.fswview(),oninput:m.withAttr("value",signmaker.vm.fswview)})
          )
          :m('div.cmdrow',
            m("p.swu","SWU:"),
            m("input",{"class": (signmaker.vm.swuraw && (signmaker.vm.swuraw != signmaker.vm.swulive()))?'warning':'',id:"swu",value:signmaker.vm.swuview(),oninput:m.withAttr("value",signmaker.vm.swuview)})
          ),
        m('div.cmd.clickable',{onclick: signmaker.vm.copy},tt("copy")),
        m('div.cmd.clickable',{onclick: signmaker.vm.mirror},tt('mirror')),
        m('div.cmd.clickable',{onclick: signmaker.vm.center},tt('center')),
        m('div.cmd.clickable',{onclick: signmaker.vm.delete},tt('delete')),
        m('div.cmd.clickable',{onclick: signmaker.vm.rotate.bind(signmaker.vm,-1)},tt('rotateCCW')),
        m('div.cmd.clickable',{onclick: signmaker.vm.rotate.bind(signmaker.vm,1)},tt('rotateCW')),
        m('div.cmd.clickable',{onclick: signmaker.vm.select.bind(signmaker.vm,1)},tt('selectNext')),
        m('div.cmd',{"class": (signmaker.vm.cursor<=0)?"disabled":"clickable",onclick: signmaker.vm.undo}, tt('undo')),
        m('div.cmd.clickable',{onclick: signmaker.vm.fill.bind(signmaker.vm,-1)},tt('fillPrev')),
        m('div.cmd.clickable',{onclick: signmaker.vm.fill.bind(signmaker.vm,1)},tt('fillNext')),
        m('div.cmd.clickable',{onclick: signmaker.vm.select.bind(signmaker.vm,-1)},tt('selectPrev')),
        m('div.cmd',{"class": ((signmaker.vm.cursor+1)>=signmaker.vm.history.length)?"disabled":"clickable",onclick: signmaker.vm.redo},tt('redo')),
        m('div.cmd.clickable',{onclick: signmaker.vm.variation.bind(signmaker.vm,-1)},tt('variationPrev')),
        m('div.cmd.clickable',{onclick: signmaker.vm.variation.bind(signmaker.vm,1)},tt('variationNext')),
        m('div.cmd.clickable',{onclick: signmaker.vm.over},tt('placeOver')),
        m('div.cmd.clickable',{onclick: signmaker.vm.clear},tt('clearAll'))
      ];
      break;
    case 1:
      currentTab = [
        (!langDictionary)?[
          m('div.cmd',{"class": (!signmaker.vm.newentry().trim())?"disabled":"clickable",onclick: signmaker.vm.new},tt('clearEntry')),
          m('div.cmd',{"class": (!signmaker.vm.entry().trim() || signmaker.vm.entry()==signmaker.vm.newentry())?"disabled":"clickable",onclick: signmaker.vm.update},tt('updateEntry')),
          m('div.cmd',{"class": (!signmaker.vm.newentry().trim() || signmaker.vm.entry()==signmaker.vm.newentry())?"disabled":"clickable",onclick: signmaker.vm.insert},tt('saveNewEntry')),
          m('div.cmd',{"class": (!signmaker.vm.entry().trim())?"disabled":"clickable",onclick: signmaker.vm.delentry},tt('deleteEntry')),
        ]: m('div.cmdfull.clickable',{onclick: dictionary.vm.localCopy},m.trust(tt('localCopy')+tt('inBrowser'))),
        (signmaker.vm.chars=="fsw")?m('div.cmdrow',
          m("p.fsw","FSW:"),
          m("input",{"class": (signmaker.vm.fswraw && (signmaker.vm.fswraw != signmaker.vm.fswlive()))?'warning':'',id:"fsw",value:signmaker.vm.fswview(),oninput:m.withAttr("value",signmaker.vm.fswview)})
        ):'',
        m('div', {"class":(signmaker.vm.chars=="fsw")?'cmdrow':'cmdfull'},
          m("p.swu","SWU:"),
          m("input",{"class": (signmaker.vm.swuraw && (signmaker.vm.swuraw != signmaker.vm.swulive()))?'warning':'',id:"swu",value:signmaker.vm.swuview(),oninput:m.withAttr("value",signmaker.vm.swuview)})
        ),
        m('div.cmdrow.info',tt('spokenLanguage')),
        signmaker.vm.terms.map(function(term, index) {
          return m('div.cmdhalf',
            m("input.terms",{readOnly: !!langDictionary,value: term,oninput:m.withAttr("value",function(value) {
              signmaker.vm.terms[index] = value;
              signmaker.vm.addhistory();
            })})
          );
        }),
      ];
      break;
    case 2:
      currentTab = [
        m('div.cmdrow.info',tt('signLanguage')),
        m('div.cmd',{"class": (signmaker.vm.list.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"S")},tt('sameSymbols')),
        m('div.cmd',{"class": (signmaker.vm.list.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"SL")},tt('sameSymbolsLocation')),
        m('div.cmd',{"class": (signmaker.vm.sort.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"A")},tt('sameSymbolsSorted')),
        m('div.cmd.clickable',{"class": (palette.vm.dialing)?"checked":"unchecked",onclick: palette.vm.dial.bind(palette.vm,palette.vm.dialing?0:2)},[
          tt('dial')
        ]),
        m('div.cmd',{"class": (signmaker.vm.list.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"s")},tt('baseSymbols')),
        m('div.cmd',{"class": (signmaker.vm.list.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"sL")},tt('baseSymbolsLocation')),
        m('div.cmd',{"class": (signmaker.vm.sort.length==0)?"disabled":"clickable",onclick: signmaker.vm.search.bind(signmaker.vm,"a")},tt('baseSymbolsSorted')),
        m('div.cmd'),
        m('div.cmdrow.info',tt('spokenLanguage')),
        m('div.cmdrow',
          m("input",{oninput:m.withAttr("value",function(value) {document.getElementById("search").value=value;dictionary.vm.search();})})
        )
      ]
      break;
    case 3:
      currentTab = [
        m('div.cmd',{"class": (signmaker.vm.current()==4) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,4)},tt("pngImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==5) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,5)},tt("svgImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==6) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,6)},tt("preferences")),
        m('div.cmd',{"class": (signmaker.vm.current()==7) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,7)},tt("system")),
      ];
      break;
    case 4:
      currentTab = [
        m('div.cmd',{"class": (signmaker.vm.current()==4) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,4)},tt("pngImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==5) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,5)},tt("svgImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==6) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,6)},tt("preferences")),
        m('div.cmd',{"class": (signmaker.vm.current()==7) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,7)},tt("system")),
        m('div.cmdslim',tt('size')
        ),
        m('div.cmdslim',
          m("input",{id:"size",value:signmaker.vm.size(),oninput:m.withAttr('value',signmaker.vm.size)})
        ),
        m('div.cmdslim',tt('pad')
        ),
        m('div.cmdslim',
          m("input",{id:"pad",value:signmaker.vm.pad(),oninput:m.withAttr('value',signmaker.vm.pad)})
        ),
        m('div.cmdslim',tt('line')
        ),
        m('div.cmdslim',
          m("input",{id:"line",value:signmaker.vm.linecolor(),oninput:m.withAttr('value',signmaker.vm.linecolor)})
        ),
        m('div.cmdslim',tt('fill')
        ),
        m('div.cmdslim',
          m("input",{id:"fill",value:signmaker.vm.fillcolor(),oninput:m.withAttr('value',signmaker.vm.fillcolor)})
        ),
        m('div.cmdslim',tt('background')
        ),
        m('div.cmdslim',
          m("input",{id:"back",value:signmaker.vm.backcolor(),oninput:m.withAttr('value',signmaker.vm.backcolor)})
        ),
        m('div.cmdslim',tt('colorize')
        ),
        m('div.cmdslim',
          m("input",{id:"colorize",type:"checkbox",checked:signmaker.vm.colorize(),onclick:m.withAttr('checked',signmaker.vm.colorize)})
        ),
        m('div.cmdrow',
          m("p.fsw","Styling: "),
          m("input",{id:"styling",value:signmaker.vm.styling(),oninput:m.withAttr("value",signmaker.vm.styling)})
        ),
        isApp?'':m('div.cmd.clickable',{onclick: signmaker.vm.dlpng},tt('download')),
      ];
      var canvas = ssw.canvas(signmaker.vm.fswnorm()+signmaker.vm.styling(),{size: signmaker.vm.size(), pad: signmaker.vm.pad(), line: signmaker.vm.linecolor(), fill: signmaker.vm.fillcolor(), back: signmaker.vm.backcolor(), colorize: signmaker.vm.colorize()});
      var data = canvas?canvas.toDataURL("image/png"):"";
      editor = m('div',{id:"signbox"},
        m('div.mid',
          m('img',{src:data,value:(signmaker.vm.terms[0]?signmaker.vm.terms[0]:"sign") + ".png"})
        )
      );
      break;
    case 5:
      currentTab = [
        m('div.cmd',{"class": (signmaker.vm.current()==4) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,4)},tt("pngImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==5) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,5)},tt("svgImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==6) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,6)},tt("preferences")),
        m('div.cmd',{"class": (signmaker.vm.current()==7) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,7)},tt("system")),
        m('div.cmdslim',tt('size')
        ),
        m('div.cmdslim',
          m("input",{id:"size",value:signmaker.vm.size(),oninput:m.withAttr('value',signmaker.vm.size)})
        ),
        m('div.cmdslim',tt('pad')
        ),
        m('div.cmdslim',
          m("input",{id:"pad",value:signmaker.vm.pad(),oninput:m.withAttr('value',signmaker.vm.pad)})
        ),
        m('div.cmdslim',tt('line')
        ),
        m('div.cmdslim',
          m("input",{id:"line",value:signmaker.vm.linecolor(),oninput:m.withAttr('value',signmaker.vm.linecolor)})
        ),
        m('div.cmdslim',tt('fill')
        ),
        m('div.cmdslim',
          m("input",{id:"fill",value:signmaker.vm.fillcolor(),oninput:m.withAttr('value',signmaker.vm.fillcolor)})
        ),
        m('div.cmdslim',tt('background')
        ),
        m('div.cmdslim',
          m("input",{id:"back",value:signmaker.vm.backcolor(),oninput:m.withAttr('value',signmaker.vm.backcolor)})
        ),
        m('div.cmdslim',tt('colorize')
        ),
        m('div.cmdslim',
          m("input",{id:"colorize",type:"checkbox",checked:signmaker.vm.colorize(),onclick:m.withAttr('checked',signmaker.vm.colorize)})
        ),
        m('div.cmdrow',
          m("p.fsw","Styling: "),
          m("input",{id:"styling",value:signmaker.vm.styling(),oninput:m.withAttr("value",signmaker.vm.styling)})
        ),
        isApp?'':m('div.cmd.clickable',{onclick: signmaker.vm.dlsvg},tt('download')),
      ];
      var svg = ssw.svg(signmaker.vm.fswnorm()+signmaker.vm.styling(),{
        size: signmaker.vm.size(),
        pad: signmaker.vm.pad(),
        line: signmaker.vm.linecolor(),
        fill: signmaker.vm.fillcolor(),
        back: signmaker.vm.backcolor(),
        colorize: signmaker.vm.colorize(),
        copy: (signmaker.vm.chars == "swu")?"opt":''
      });
      editor = m('div',{id:"signbox"},
        m('div.mid',
          m.trust(svg)
        )
      );
      break;
    case 6:
      currentTab = [
        m('div.cmd',{"class": (signmaker.vm.current()==4) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,4)},tt("pngImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==5) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,5)},tt("svgImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==6) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,6)},tt("preferences")),
        m('div.cmd',{"class": (signmaker.vm.current()==7) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,7)},tt("system")),
        m('div.cmd.clickable',{onclick: function(){signmaker.vm.grid(0);localStorage['gridPref']=0;}},tt('grid0')),
        m('div.cmd.clickable',{onclick: function(){signmaker.vm.grid(1);localStorage['gridPref']=1;}},tt('grid1')),
        m('div.cmd.clickable',{onclick: function(){signmaker.vm.grid(2);localStorage['gridPref']=2;}},tt('grid2')),
        m('div.cmd.clickable',{"class": (signmaker.vm.chars!="fsw")?'disabled':'', onclick: function(){setChars('fsw');}},tt('FSW')),
        m('div.cmd.clickable',{onclick: function(){setColoring('')}},tt('blackOnWhite')),
        m('div.cmd.clickable',{onclick: function(){setColoring('inverse')}},tt('whiteOnBlack')),
        m('div.cmd.clickable',{onclick: function(){setColoring('colorful')}},tt('colorful')),
        m('div.cmd.clickable',{"class": (signmaker.vm.chars!="swu")?'disabled':'', onclick: function(){setChars('swu');}},tt('SWU')),
      ];
      break;
    case 7:
      var alphaSignLang = signLang['alphabet'].map(function(key){
        return t(key) + '\t' + key.slice(4);
      });
      alphaSignLang.sort();
      var dictSignLang = signLang['dictionary'].map(function(key){
        return t(key) + '\t' + key.slice(4);
      });
      dictSignLang.sort();
      currentTab = [
        m('div.cmd',{"class": (signmaker.vm.current()==4) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,4)},tt("pngImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==5) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,5)},tt("svgImage")),
        m('div.cmd',{"class": (signmaker.vm.current()==6) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,6)},tt("preferences")),
        m('div.cmd',{"class": (signmaker.vm.current()==7) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,7)},tt("system")),
        m('div.cmdslim',tt('userInterface')
        ),
        m('div.cmdlong',
          m('select', {id: 'language',onchange:function(e){setUI(e.target.value);hashSet();}},
            m('optgroup',
              Object.keys(messages).map(function(key){
                return m('option',{value: key,selected:(key==localStorage['langUI'])},messages[key]['language']);
              })
            )
          )
        ),
        m('div.cmdslim',tt('alphabet')
        ),
        m('div.cmdlong',
          m('select', {id: 'alphaLang',onchange:function(e){setAlphabet(e.target.value);hashSet();}},
            m('optgroup',
              m('option',{value:''},t('iswa2010')),
              alphaSignLang.map(function(val){
                var vals = val.split('\t');
                return m('option',{value: vals[1],selected:(vals[1]==langAlphabet)},vals[0]);
              })
            )
          )
        ),
        m('div.cmdslim',tt('dictionary')
        ),
        m('div.cmdlong',
          m('select', {id: 'dictLang',onchange:function(e){setDictionary(e.target.value);hashSet();}},
            m('optgroup',
              m('option',{value:'',selected:(langDictionary=='')},t('localDictionary')),
              dictSignLang.map(function(val){
                var vals = val.split('\t');
                return m('option',{value: vals[1],selected:(vals[1]==langDictionary)},vals[0]);
              })
            )
          )
        ),
        m('div.cmd',{"class": (!langDictionary)?"disabled":"clickable",onclick: (!!langDictionary)?dictionary.vm.localCopy:null},tt('localCopy')),
        isApp?m('div.cmd'):m('div.cmd',{"class": (!!langDictionary)?"disabled":"clickable",onclick: (!langDictionary)?dictionary.vm.refresh:null},tt('reloadDictionary')),
        isApp?m('div.cmd'):m('div.cmd.clickable',{onclick: dictionary.vm.export},tt('exportDictionary')),
        m('div.cmd.clickable',{onclick: signmaker.vm.tab.bind(signmaker.vm,8)},tt("sourceDictionary")),
        m('div.cmd',{"class": (!!langDictionary)?"disabled":"clickable",onclick: (!langDictionary)?dictionary.vm.empty:null},tt('emptyDictionary')),
      ]
      break;
    case 8:
      var dictText;
      if (langDictionary){
        dictText = window.dict;
      } else {
        dictText = localStorage['dict'];
      } 
      if (signmaker.vm.dictView()=='js'){
        lines = dictText.split("\n");
        dictText = 'window.dict = "' + lines.shift() + '\\n";\n';
        for (var i=0; i < lines.length; i++) {
          dictText += 'dict += "' + lines[i] + '\\n";\n';
        }
      }

      currentTab = [
        m("textarea",{id:'dictText'},dictText),
        m('div.cmd.clickable',{onclick: function(){signmaker.vm.dictView('text');localStorage['dictView']='text';}},tt('plaintext')),
        m('div.cmd.clickable',{onclick: function(){signmaker.vm.dictView('js');localStorage['dictView']='js';}},tt('jstext')),
        m('div.cmd'),
        m('div.cmd.clickable',{onclick: dictionary.vm.import},tt('importDictionary')),
      ]
      break;
  }

  return [
    editor,
    m('div',{id:"command"},[
      m('div.cmd.edit',{"class": (signmaker.vm.current()==0) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,0)},tt("editTab")),
      m('div.cmd.dictionary',{"class": (signmaker.vm.current()==1) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,1)},tt("dictionaryTab")),
      m('div.cmd.search',{"class": (signmaker.vm.current()==2) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,2)},tt("searchTab")),
      m('div.cmd',{"class": (signmaker.vm.current()>=3) ? "selected" : "unselected",onclick: signmaker.vm.tab.bind(signmaker.vm,3)},tt("moreTab")),
      currentTab
      ])
    ]
};


// PALETTE
//////////
var palette = {}; //app namespace
//model
palette.structure = function(){
  return window.alphabet;
};

palette.vm = {dialing: 0,dialhist:[]};

palette.vm.init = function(){
  this.source = palette.structure();
}
palette.vm.dial = function(level){
  if (!palette.vm.dialing){
    palette.vm.dialhist=[];
  }
  var index = "0123".indexOf(level);
  palette.vm.dialing = index==-1?0:index;
}


palette.vm.select = function(group,base,lower){
  var key;
  this.group = group || '';
  this.base = base || '';
  this.lower = !!lower;
  var search = document.getElementById("search");
  search = search?search.value:'';
  var query = ssw.query(search);
  query = query?query:"Q";
  var text = '';
  if (palette.vm.dialing){
    text = langDictionary?window.dict:localStorage['dict'];
  }
  
  if (this.base && !this.lower){
    var key1 = this.base.slice(0,4) + "08";
    var key2 = this.base.slice(0,4) + "18";
    this.mirror = (ssw.size(key1) || ssw.size(key2))
    this.grid=[[],[],[],[],[],[],[],[]];
    for (var f=0;f<6;f++){
      for (var r=0;r<8;r++){
        key=this.base.slice(0,4) + f + r;
        if (palette.vm.dialing && !ssw.results(query+key,text).length) {
          key='';
        }
        this.grid[r].push(key);
      }
    }
  } else if (this.base && this.lower){
    this.mirror = true;
    this.grid=[[],[],[],[],[],[],[],[]];
    for (var f=0;f<6;f++){
      for (var r=8;r<16;r++){
        key=this.base.slice(0,4) + f + r.toString(16);
        if (palette.vm.dialing && !ssw.results(query+key,text).length) {
          key='';
        }
        this.grid[(r-8)].push(key);
      }
    }
  } else if (this.group){
    this.mirror = false;
    this.grid=[[],[],[],[],[],[],[],[],[],[]];
    var cnt=0;
    for (var i=0; i<this.source[this.group].length;i++){
      key = this.source[this.group][i];
      if (palette.vm.dialing && !ssw.results(query+key.slice(0,4)+'uu',text).length) {
        key='';
      }
      this.grid[(cnt++%10)].push(key);
    }
    for (var i=cnt; i<60;i++){
      this.grid[(i%10)].push('');
    }
  } else {
    this.mirror=false;
    this.grid=[[],[],[],[],[],[],[],[],[],[]];
    var cnt=0;
    for (key in this.source){
      if (palette.vm.dialing){
        var start = window.alphabet[key][0];
        var end = window.alphabet[key].slice(-1)[0]
        if (!ssw.results(query+"R" + start.slice(1,4) + 't' + end.slice(1,4),text).length) {
          key='';
        }
      }
      this.grid[(cnt++%10)].push(key);
    }
    for (var i=cnt; i<60;i++){
      this.grid[(i%10)].push('');
    }
  }
}

palette.controller = function(){
  palette.vm.init();
  palette.vm.select();
}

palette.click = function(key){
  if (palette.vm.base){
    if (palette.vm.dialing){
      palette.setdial(key);
    }
    return;
  } else if (palette.vm.group){
    if(palette.vm.dialing==2){
      palette.setdial(key.slice(0,4)+'uu');
    } else {
      palette.vm.select(palette.vm.group,key);
    }
  } else {
    if(palette.vm.dialing==1){
      var start = window.alphabet[key][0];
      var end = window.alphabet[key].slice(-1)[0]
      palette.setdial("R" + start.slice(1,4) + 't' + end.slice(1,4));
    } else {
      palette.vm.select(key);
    }
  }
};
palette.dial = function(level){
  var index = "0123".indexOf(level);
  level = index==-1?0:index;
  var classes;
  if (level==0) {
    if (palette.vm.dialing){
      classes = "checked";
    } else {
      classes = "unchecked";
    }
  } else {
    if(palette.vm.dialing==level){
      classes = "checked";
    } else {
      classes = "unchecked";
    }
  }
  if (palette.vm.dialing) classes += ' smaller';
  return {
    "class": classes, 
    onclick: function(){
      palette.vm.dial(level);
      palette.vm.select()
    }
  };
};
palette.setdial = function(query){
  var q = ssw.query(document.getElementById("search").value);
  palette.vm.dialhist.push(q);
  q = q?q+query:"Q"+query;
  document.getElementById("search").value=ssw.query(q);
  dictionary.vm.search();
//  palette.vm.select();
}
palette.clear = function(){
  return {
    onclick: function(){
      document.getElementById("search").value='';
      dictionary.vm.search();
//      palette.vm.select();
    }
  }
}
palette.undo = function(){
  return {
    "class": palette.vm.dialhist.length || palette.vm.group?"clickable":"disabled",
    onclick: function(){
      if (palette.vm.base){
        palette.vm.select(palette.vm.group);
      } else if (palette.vm.group){
        palette.vm.select();
      } else if (palette.vm.dialhist.length){
        document.getElementById("search").value=palette.vm.dialhist.pop();
        dictionary.vm.search();
        //palette.vm.select();
      }
    }
  }
}
palette.top = function(){
  return {
    onclick: function(){
      palette.vm.select();
    }
  };
};
palette.previous = function(){
  return {
    onclick: function(){
      if (palette.vm.base){
        palette.vm.select(palette.vm.group);
      } else {
        palette.vm.select();
      }
    }
  };
};
palette.mirror = function(){
  return {
    "class": palette.vm.dialing==3?"smaller":'',
    onclick: function(){
      palette.vm.select(palette.vm.group,palette.vm.base,!palette.vm.lower);
    }
  };
};

//view

// gets the offset of an element relative to the document
function getOffset( el ) {
  var offset = el?el.getBoundingClientRect():{top:0,left:0};
  return { top : offset.top + (window.pageYOffset || window.document.documentElement.scrollTop), left : offset.left + (window.pageXOffset || window.document.documentElement.scrollLeft) }
}

function overlap(el1, el2){
  if (!el2) return false;
  var offset1 = getOffset( el1 ), width1 = el1.offsetWidth, height1 = el1.offsetHeight,
    offset2 = getOffset( el2 ), width2 = el2.offsetWidth, height2 = el2.offsetHeight;
  if (!(offset2.left > offset1.left + width1 - width1/2 || offset2.left + width2 < offset1.left + width1/2 || offset2.top > offset1.top + height1 - height1/2 || offset2.top + height2 < offset1.top + height1/2 )){
    return true;
  } else {
    return false;
  }
}

function palDragEnd( draggie,e,p ) {
  var sb = document.getElementById("signbox");
  if (overlap(draggie.element,sb)){
    var offset1 = getOffset( draggie.element ),
      offset2 = getOffset( sb );
    var symbol = {key:draggie.element.key,x: parseInt(500-signmaker.vm.midWidth+1+offset1.left-offset2.left),y: parseInt(500-signmaker.vm.midHeight+offset1.top-offset2.top)};
    signmaker.vm.add(symbol);
  } else {
    var seq = document.getElementById("sequence");
    if (overlap(draggie.element,seq)){
      var position = parseInt((draggie.startPoint.y+draggie.dragPoint.y) / (window.innerHeight/20));
      var key = draggie.element.key;
      signmaker.vm.addSeq(key,position);
    }
  }
    
  draggie.element.style.top=0;
  draggie.element.style.left=0;
  draggie.element.topleft=false;
  classie.remove(draggie.element,"topleft");
  var drag = draggie.dragPoint;
  if ( drag.x === 0 && drag.y === 0 ) {
    palette.click(draggie.element.key);
    m.redraw();
  }
}

function palDragMove( draggie ){
  if (!draggie.element.topleft){
    draggie.element.topleft=true;
    classie.add(draggie.element,"topleft");
  }
}

palette.view = function(ctrl){
  var tooltip = palette.vm.base?'':palette.vm.group?'base_':'group_';
  return [
    m("div.btn.clickable",palette.dial(palette.vm.dialing?0:2),tt("dial")),
    palette.vm.dialing?[
      m("div.btn",palette.dial(1),tt("dial1")),
      m("div.btn",palette.dial(2),tt("dial2")),
      m("div.btn",palette.dial(3),tt("dial3")),
      m("div.btn.smaller.clickable",palette.clear(),tt("clearAll")),
      m("div.btn.smaller",palette.undo(),tt("undo")),
      m("div.btn.smaller.clickable",palette.top(),tt("top")),
    ]:[
      m("div.btn.clickable",palette.top(),tt("top")),
      m("div.btn.clickable",palette.previous(),tt("previous"))
    ],
    palette.vm.mirror?m("div.btn",palette.mirror(),tt("mirror")):'',
    palette.vm.grid.map(function(row){
      return m("div.row",{"class":palette.vm.dialing?"smaller":''},row.map(function(key){
        return m("div"
        , {
          title: tooltip?t(tooltip + key.slice(0,4)):'',
          config: function(element, isInitialized) {
            element.key=key;
            if (!isInitialized) {
              var draggie = new Draggabilly(element);
              draggie.on( 'dragMove', palDragMove );
              draggie.on( 'dragEnd', palDragEnd );
            }
          }
        },m.trust(ssw.svg(key)));
      }));
    })
  ];
};


addEventListener("keydown", function(event){
  if (event.target==document.body){
    var code = event.charCode || event.keyCode;
    for (var i=0; i<keyboard['prevent'].length; i++){
      if (code === keyboard['prevent'][i]){
        event.preventDefault();
      }
    }
    return false;
  }
});

checkKeyboard = function (event,name){
  if (event.target==document.body){
    var code = event.charCode || event.keyCode;
    var checks = keyboard[name];
    var checking;
    var act;
    if (!(checks[0] instanceof Array)){
      checks = [checks];
    }
    for (var i=0; i < checks.length; i++) {
      checking = checks[i]
      if (checking[0] == code){
        act = true;
        checking = checking.slice(1);
        for (check in checking){
          if (!event[checking[check]]){
            act = false;
            break;
          }
        }
        if (act) return true;
      }
    }
    return false;
  }
}

//font installation check
function initPage(){
  initApp();
  hashSet();
  checkSignLang('alphabet');
  checkSignLang('dictionary');
}

function initApp(){
  m.mount(document.getElementById("palette"), palette);
  m.mount(document.getElementById("header"), header);
  m.mount(document.getElementById("dictionary"), dictionary);
  m.mount(document.getElementById("signmaker"), signmaker);
}
var cssCheck;
window.onload = function () {
  var cnt = 0;
  if (!ssw.size("S10000")){
    classie.addClass(document.body,"waiting");
    var page = document.body.innerHTML;
    cssCheck = setInterval(function(){
      if (ssw.size("S10000")){
        classie.removeClass(document.body,"waiting");
        document.body.innerHTML = page;
        clearInterval(cssCheck);
        initPage();
        //secondary call for Android default browser
        //setTimeout(function(){ initApp(); }, 100);
      } else {
        document.getElementById('dots').innerHTML=Array(1+parseInt(((cnt++)%40)/10)).join('.');      
      }
    },100);
      document.body.innerHTML = '<h2>' + tt('fontNotInstalled') + '</h2>' +
            '<p><b>' + t('loadFont') + '</b><span id="dots"></span></p>' +
            '<button onclick="clearInterval(cssCheck);">' + t('cancelFont') + '</button>' +
            '<hr><hr>' +
            '<h2>' + tt('installFont') + '</h2><hr>' +
            '<p>' + tt('windowsMacLinux') + '</p><ul><li><a href="https://slevinski.github.io/SuttonSignWriting/assets/SuttonSignWritingLine.ttf">Sutton SignWriting Line TrueType Font</a></li>' +
            '<li><a href="https://slevinski.github.io/SuttonSignWriting/assets/SuttonSignWritingFill.ttf">Sutton SignWriting Fill TrueType Font</a></li></ul><hr>' +
            '<p>' + tt('iOS') + '</p><ul><li><a href="https://slevinski.github.io/SuttonSignWriting/assets/SuttonSignWritingPlus.mobileconfig">Sutton SignWriting Configuration Profile</a></li></ul>' +
            '<p>' + tt('iOSWait') + '</p>' +
            '<p>' + tt('iOSError') + '</p>' +
            '<p>' + tt('iOSAfter') + '</p><hr>' +
            '<p>' + t('androidApp') + ': <a href="http://signbank.org/downloads/SignMakerApp.arm.apk">ARM</a> or <a href="http://signbank.org/downloads/SignMakerApp.x86.apk">x86</a></p>' +
            '<p>' + tt('androidRemote') + '</p>' +
            '<p>' + t('android') + ' ' + t('androidHelp') + ' <a href="https://github.com/Slevinski/SuttonSignWriting">Sutton SignWriting Fonts</a></p>';
    } else {
        initPage();
    }

  addEventListener("keyup", function(event) {
    var x = event.charCode || event.keyCode;
    if (checkKeyboard(event,"left10")){ signmaker.vm.move(-10,0);} else
    if (checkKeyboard(event,"up10")){ signmaker.vm.move(0,-10);} else
    if (checkKeyboard(event,"right10")){ signmaker.vm.move(10,0);} else
    if (checkKeyboard(event,"down10")){ signmaker.vm.move(0,10);} else
    if (checkKeyboard(event,"left")){ signmaker.vm.move(-1,0);} else
    if (checkKeyboard(event,"up")){ signmaker.vm.move(0,-1);} else
    if (checkKeyboard(event,"right")){ signmaker.vm.move(1,0);} else
    if (checkKeyboard(event,"down")){ signmaker.vm.move(0,1);} else
    if (checkKeyboard(event,"selectBack")){ signmaker.vm.select(-1);} else 
    if (checkKeyboard(event,"selectNext")){ signmaker.vm.select(1);} else 
    if (checkKeyboard(event,"escape")){ if (signmaker.vm.current()==3) {signmaker.vm.tab(0);} else {signmaker.vm.tab(signmaker.vm.current()+1);} }else 
    if (checkKeyboard(event,"delete")){ signmaker.vm.delete();} else 
    if (checkKeyboard(event,"redo")){ signmaker.vm.redo();} else 
    if (checkKeyboard(event,"undo")){ signmaker.vm.undo();} else 
    if (checkKeyboard(event,"rotateBack")){ signmaker.vm.rotate(-1);} else 
    if (checkKeyboard(event,"rotateNext")){ signmaker.vm.rotate(1);} else 
    if (checkKeyboard(event,"variationBack")){ signmaker.vm.variation(-1);} else 
    if (checkKeyboard(event,"variationNext")){ signmaker.vm.variation(1);} else 
    if (checkKeyboard(event,"mirror")){ signmaker.vm.mirror();} else 
    if (checkKeyboard(event,"fillBack")){ signmaker.vm.fill(-1);} else 
    if (checkKeyboard(event,"fillNext")){ signmaker.vm.fill(1);} else 
    if (checkKeyboard(event,"recenter")){ signmaker.vm.center();}
     
    if (event.preventDefault) event.preventDefault();
    return false;
  });
}
