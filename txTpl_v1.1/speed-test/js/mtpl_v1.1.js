
(function(){
	var w=window, cache={}; 	
	
	function mTpl(str, data, startSelector, endSelector, isCache){
		var fn, d=data, valueArr=[], isCache=isCache!=undefined ? isCache : true;
		if(isCache && cache[str]){
			for (var i=0, list=cache[str].propList, len=list.length; i<len; i++){
				valueArr.push(d[list[i]]);
			}	
			fn=cache[str].parsefn;
		}else{
			var a=startSelector, b=endSelector, propArr=[], formatTpl=(function(str){				
				if(!a){a='<'+'%'; b='%'+'>';}
				var el=document.getElementById(str), tpl=el? el.innerHTML : str;			
				return tpl
					.replace(/\\/g, "\\\\") 
					.replace(/[\r\t\n]/g, " ") 	
					.split(a).join("\t") 
					.replace(/'/g, "\r")
					.replace(new RegExp("\t=(.*?)"+b,"g"), "';\n s+=$1;\n s+='")  
					.split("\t").join("';\n")	
					.split(b).join("\n s+='")	
					.split("\r").join("\\'");
			})(str);
			
			for (var p in d) {propArr.push(p);valueArr.push(d[p]);}	
			fn = new Function(propArr, "var s='';\n s+='" + formatTpl+ "';\n return s");
			isCache && (cache[str]={parsefn:fn, propList:propArr});
		}
//console.log(fn);
		try{
			return fn.apply(w,valueArr);
		}catch(e){
			var fnName='mTpl'+Date.now(), 
				fnStr='var '+ fnName+'='+fn.toString(), 
				head=document.getElementsByTagName("head")[0], 
				script = document.createElement("script"),
				ua = navigator.userAgent.toLowerCase(); 
			if(ua.indexOf('gecko') > -1 && ua.indexOf('khtml') == -1){
				w['eval'].call(w, fnStr);
				w[fnName].apply(w,valueArr);return;
			}				
			script.innerHTML = fnStr; 
			head.appendChild(script); 
			head.removeChild(script);
			w[fnName].apply(w,valueArr);
		}
	} 
	
	typeof exports != "undefined" ? exports.mTpl = mTpl : w.mTpl = mTpl;	
})();

