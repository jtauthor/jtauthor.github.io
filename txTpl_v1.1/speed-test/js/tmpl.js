
(function(){
  var cache = {};

  this.tmpl =  function (str, data){
	var fn = !/\W/.test(str) ?
	  cache[str] = cache[str] ||
		tmpl(document.getElementById(str).innerHTML) :

	  new Function("obj",
		"var p=[];"+
		//"print=function(){p.push.apply(p,arguments);};print();" +
		"with(obj){p.push('" +

		str
		  .replace(/[\r\t\n]/g, " ")
		  .split("<%").join("\t")
		  .replace(/((^|%>)[^\t]*)'/g, "$1\r")
		  .replace(/\t=(.*?)%>/g, "',$1,'")
		  .split("\t").join("');")
		  .split("%>").join("p.push('")
		  .split("\r").join("\\'")
	  + "');}return p.join('');");
//console.log(fn);
	return data ? fn( data ) : fn;
  };
})();

