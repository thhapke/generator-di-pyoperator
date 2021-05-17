//var dots = require("dot");
//var fs = require('fs');
//console.log("Hello World");

var store = memFs.create();
var mfs = editor.create(store);

console.log(__dirname)
var scriptf = mfs.read('../templates/script.py')
dots.templateSettings['strip'] = false
var scriptt = dots.template(scriptf)
var result = scriptt({'input':'msg','port':'output'})
//console.log(result)

fs.writeFile('../out/script.py',result,function (err) {
  if (err) return console.log(err);
  console.log('Result > ../out/script.py');
});