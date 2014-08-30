/** 
 *
 *  txSlide v1.0
 *	滑动播放组件(tab切换、tab滑动、滑图功能, 播放功能)	
 *  demo: http://f2e.org/jt/slide.html
 *	例：txSlide({container:container});
 *
 *	使用说明：
 *
 *	点击指定项, 立马从当前位置跳到指定项位置, 过渡效果可能是向左的, 如2→4, 也可能是向右的, 如5→3
 *	点击下一页/上一页(向左滑/向右滑), 如果循环参数loop为true, 那么支持单方向无限次数滑动，否则到头则停止。
 *	开启自动播放时, 过渡效果是向左的, 循环参数loop会强制为true, 一直播放下去。
 *
 * 	options : { 
 *		container		: container, 	//必选 滑动面板容器元素或选择器
 * 
 *		tab				: tab,			//可选 tab元素数组或选择器
 *		activeClass		: 'selected', 	//可选 激活时的class
 *		duration   		: 400,			//可选 一幅帧完整滑过的时间 单位毫秒 
 *		ease			: 'linear'		//可选 动画过渡效果
 *		bounce 			: true,			//可选 bounce效果
 *		onTouchMove		: null,			//可选 触摸移动时的回调
 *		onScrollStart	: null, 		//可选 开始滚动前的回调
 *		onScrollEnd		: null,		 	//可选 在滚动结束后的回调
 *		stopPropagation : 0,			//可选 0、不阻止；1、在有水平滑移的情况下阻止；2、完全阻止
 *		showPrevNext	: false, 		//可选 是否显示上一页 下一页
 *		showIndicator	: false, 		//可选 是否指示器，多数情况下以“点点点”表现形式展现
 * 		isLoop			: false,		//可选 是否支持循环滑动, 单方向无限滑动
 *		isPlay			: false,		//可选 如果为true, isLoop参数为强制为true
 *		stayTime		: 2000,			//可选 帧的间隔时间, 每帧的停留时间 单位毫秒 	 
 *  }
 *	
 *	返回一个slide对象。 
 *	return {
 *		//以下几个方法是为方便开发者自定义使用
 *		num 			: number,		//取滑动面板数量
 *		width 			: number,		//滑动面板宽度
 *		moveX 			: number,		//当前滑动面板的偏移量	 
 *		goIndex			: function(){},	//前进、后退、去第几项	
 * 		getPastIndex 	: function(){}	//取刚刚过去(上一次)的索引	
 * 		getCurrentIndex : function(){}	//取当前索引
 *
 * 		//以下播放控制功能仅当isPlay为true时有效。
 *		start			: function(){}, //开始
 *		go				: function(){}, //继续
 *		pause			: function(){}, //暂停
 *		stop			: function(){}, //停止	
 *	}
 *	
 */	

function txSlide(opt){
	//此处$(selector)只要具备支持索引、length、eq、find、addClass、removeClass、css、append、prepend、clone、bind、unbind这些属性和方法即可。
	//如果用了jqmobi或jQuery可以把这个函数注释或删掉。	
	var $=window.$ || (function(){	
		var o = function(selector){var t=this;if(selector&&selector instanceof o){return t}t.length=0;if(!selector){return t}if(typeof selector==='string'){selector=document.querySelectorAll(selector)}if(!selector.length){t[t.length++]=selector}if(selector.length&&selector[0].nodeType==1){if(selector.length){for(var i=0,len=selector.length;i<len;i++){t[t.length++]=selector[i]}}else{t[t.length++]=selector}}return t};
		var _$ = function(selector){return new o(selector);}
		
		_$.fn=o.prototype = { 		
			find		: function(str){function unique(arr){for(var i=0;i<arr.length;i++){if(arr.indexOf(arr[i])!=i){arr.splice(i,1);i--}}return arr}if(this.length===0){return undefined}var elems=[],tmpElems;for(var i=0;i<this.length;i++){tmpElems=this[i].querySelectorAll(str);for(var j=0;j<tmpElems.length;j++){elems.push(tmpElems[j])}}return _$(unique(elems))}, 
			each		: function(callback){[].forEach.call(this,function(el,idx){callback.call(el,idx,el)});return this},		
			addClass	: function(name){this.each(function(){this.classList.add(name);});return this;},
			removeClass	: function(name){this.each(function(){this.classList.remove(name);});return this;},
			css			: function(prop,value,obj){for(var i=0;i<this.length;i++){this[i].style[prop]=value}return this},		
			bind		: function(type, fn){this.each(function(){this.addEventListener(type, fn, false);}); return this;}, 
			unbind		: function(type, fn){this.each(function(){this.removeEventListener(type, fn, false);}); return this;}, 
			append		: function(node){node=node.nodeType==1?node:node[0];this[0].appendChild(node);return this;},
			prepend		: function(node){node=node.nodeType==1?node:node[0];node=node.cloneNode(true);this[0].insertBefore(node,this[0].firstChild);return this;},
			clone		: function(deep){var node=this[0].cloneNode(true); return _$(node);}
		};

		return _$;
	})();
	
	$.fn.eq = $.fn.eq || function(i){var _this=this,slice=function(){return $([].slice.apply(_this,arguments))};return i===-1?slice(i):slice(i,+i+1)}; //jqmobi目前还不支持这个函数		
	
	var hasTouch = 'ontouchstart' in window, START_EV = hasTouch ? 'touchstart' : 'mousedown', MOVE_EV = hasTouch ? 'touchmove' : 'mousemove', END_EV = hasTouch ? 'touchend' : 'mouseup';
		
	var o={
		init : function(opt){
			var t=this;	
			t.oC=$(opt.container);//oContainer
			t.oTab=$(opt.tab);			
			t.oPP=t.oC.find('.t_panels');//oPanelParent
			t.isLoop=opt.isPlay?true:opt.isLoop;			
			if(t.oC.find('.t_panel').length<=1){return;}
			t.activeClass=opt.activeClass ||'active';
			t.oC.find('.t_panel').removeClass(t.activeClass);
			if(t.isLoop){
				(function addCloneNode(){
					var oP=t.oC.find('.t_panel'), cloneFirstNode=oP.eq(0).clone().addClass('clone'), cloneLastNode=oP.eq(oP.length-1).clone().addClass('clone');
					t.oPP.append(cloneFirstNode).prepend(cloneLastNode);
				})();
			}
			t.oP=t.oC.find('.t_panel');//oPanel
			t.num = t.oP.length;//slideNum								
			t.oPP.css('-webkit-tap-highlight-color', 'rgba(255,255,255,0)').css('width',t.num*100+'%').css('-webkit-transition','0s');		
			t.oP.css('float', 'left').css('width', 100/t.num+'%').css('overflow','hidden');				
			t.w = parseInt(getComputedStyle(t.oPP[0]).width)/t.num;//slideWidth				
			t.duration =opt.duration?parseInt(opt.duration)+'ms' : '400ms';
			t.bounce = opt.bounce==undefined?true:opt.bounce;
			t.ease = opt.ease||"linear";			
			t.pastIndex=-1;				
			t.curIdx =0;//currentIndex(不包含克隆节点)
			t.curIdx2 =t.isLoop?1:0; //currentPanelIndex(包含克隆节点)			 
			t.curX=-t.curIdx2*t.w;//currentX 			
			t.animFrontFunc=function(){
				var i=t.curIdx;
				if(t.oTab && t.oTab.length){
					t.oTab.removeClass(t.activeClass); 
					t.oTab.eq(i).addClass(t.activeClass);
				}
				
				if(t.showIndicator){					
					var oLI=t.oC.find('.t_orders li');
					oLI.removeClass(t.activeClass);					
					oLI.eq(i).addClass(t.activeClass);					
				}
				opt.onScrollStart && opt.onScrollStart(i);
			};
			t.animEndFunc=function(){
				t.oP.removeClass(t.activeClass); 						 
				t.oP.eq(t.curIdx2).addClass(t.activeClass);				
				opt.onScrollEnd && opt.onScrollEnd(t.curIdx);				
			};	
			t.touchMoveFunc=opt.onTouchMove;						
			t.oP.eq(t.curIdx2).addClass(t.activeClass);
			t.oPP.css('-webkit-transform','translate3d('+t.curX+'px,0,0)').css('-webkit-transition-timing-function',t.ease);
			t.oldTime=0;				
			t.moveX=0;//往左移为负值 往右移动为正值			
			hasTouch && t.touch();
			t.showPrevNext=opt.showPrevNext;
			t.showIndicator=opt.showIndicator;
			t.oPP.bind('webkitTransitionEnd', function(e){if(e.target!=t.oPP[0]){return;}if(t.isInPlay){t.playFunc();}});
			t.iTimer=null;
			t.isPlay=opt.isPlay;
			t.stayTime=opt.stayTime==undefined?2000:parseInt(opt.stayTime);					
			t.isInPlay=t.isPlay;
			t.playFunc=function(){clearTimeout(t.iTimer);t.iTimer= setTimeout(function(){t.goIndex('+1');}, t.stayTime);}			
			t.isPlay && t.playFunc();
			t.inArray=function(elem,array){if(array.indexOf){return array.indexOf(elem)}for(var i=0,len=array.length;i<len;i++){if(array[i]===elem){return i}}return-1};				
			
			if(t.showIndicator){
				var s='',len=len=t.num-(t.isLoop?2:0);
				for(var i=0;i<len;i++){
					var css=i==0?' class="'+t.activeClass+'"':'';
					s+='<li'+css+'><a>'+(i+1)+'</a></li>';
				}
				var ol = document.createElement('ol');
				ol.classList.add('t_orders');
				ol.innerHTML=s;
				t.oC.append(ol);
				var oLI=t.oC.find('.t_orders li');
				oLI.bind('click',function(e){e.preventDefault();t.goIndex(t.inArray(this, oLI));});								
			}
			
			if(t.showPrevNext){
				var div = document.createElement('div');
				div.classList.add('t_direction');
				div.innerHTML='<span class="prev">prev</span><span class="next">next</span>';
				t.oC.append(div);
				t.oPrev=t.oC.find('.prev');
				t.oNext=t.oC.find('.next');		
				t.oPrev.bind(START_EV,function(e){e.preventDefault(); t.goIndex('-1');});
				t.oNext.bind(START_EV,function(e){e.preventDefault();t.goIndex('+1');});
			} 
		
			if(t.oTab && t.oTab.length){
				t.oTab.bind('click',function(e){e.preventDefault();t.goIndex(t.inArray(this, t.oTab));});
			} 							
		},	
		//← → direction['-1','+1',...] 如果'-1'、'+1'表示往前1张、往后1张, 否则表示跳到指定索引
		goIndex:function(direction, duration){ 
			var t=this;	
			clearTimeout(t.iTimer);
			
			var panelIndex;
			if(typeof direction === 'string' && direction.indexOf('-')!=-1){//prev
				panelIndex=!t.isLoop?Math.max(t.curIdx-1,0) : t.curIdx2==0?t.num-3:t.curIdx2-1;			
			}else if(typeof direction === 'string' && direction.indexOf('+')!=-1){//next
				panelIndex=!t.isLoop?Math.min(t.curIdx+1,t.num-1):t.curIdx2==t.num-1?2:t.curIdx2+1;
			}else{
				panelIndex=direction+(t.isLoop?1:0);
			}
						
			if(t.isLoop && (panelIndex==0 || panelIndex==t.num-1)){
				var oldIndex, x;
				
				if(panelIndex==0){
					oldIndex=t.num-1;
					panelIndex=oldIndex-1;
					x=-oldIndex*t.w+t.moveX;
				}else{
					oldIndex=0;
					panelIndex=1;
					x=t.moveX;				
				}	
				t.oPP.css('-webkit-transform','translate3d('+ x/(t.num*t.w)*100 +'%,0,0)').css('-webkit-transition','0ms');
				getComputedStyle(t.oPP[0]).zoom;
			}
				
			var duration=duration==undefined?t.duration:duration;
			t.curIdx2=panelIndex;
			t.pastIndex=t.curIdx;
			t.curIdx=panelIndex-(t.isLoop?1:0);		
			t.curX = -t.curIdx2/t.num* 100;			
			t.animFrontFunc(t.curIdx);			
			t.oPP.css('-webkit-transform','translate3d('+t.curX+'%,0,0)').css('-webkit-transition-duration',duration);
		},					

		touch: function(){
			var t=this, identifier, pageX, pageY, isMoved, isHorizontalMove, currX, currY, deltaX, deltaY;
		
			var onTouchStart=function(e){
				if (e.touches.length !== 1) {return;}
				identifier=e.changedTouches[0].identifier;
				pageX=e.pageX;
				pageY=e.pageY;	
				
				t.oldTime=Date.now();//e.timeStamp
				isMoved = false;
				currX = hasTouch ? e.touches[0].pageX : e.pageX;
				currY = hasTouch ? e.touches[0].pageY : e.pageY;
				t.oPP.bind(MOVE_EV, func_MOVE_EV).bind(END_EV, func_END_EV);											
			};
			
			var onTouchMove=function(e){
				var isStartFinger=Math.abs(e.pageX-pageX)<50 && Math.abs(e.pageY-pageY)<50; //是否是初始手指	
				if(!isStartFinger){return;}				
				
				deltaX = (hasTouch ? e.touches[0].pageX : e.pageX) - currX; // 往左滑为负，往右滑为正
				deltaY = (hasTouch ? e.touches[0].pageY : e.pageY) - currY;

				if(!isMoved){
					isMoved = true;
					isHorizontalMove=Math.abs(deltaX) > Math.abs(deltaY);
					isHorizontalMove && e.preventDefault();
				}else{					
					if(isHorizontalMove){
						e.preventDefault();
						var x=deltaX;	

						if((t.curIdx==0 && deltaX >0)|| (t.curIdx == t.num-(t.isLoop?3:1) && deltaX<0)){							
							if(!t.isLoop){
								x = Math.min(t.w/5, Math.abs(x));
								x = !t.bounce?0:t.curIdx==0?x:-x;
							}else{
								x = Math.min(t.w, Math.abs(x));
								x = t.curIdx==0?x:-x;	
							}
						}	

						clearTimeout(t.iTimer);						
						t.moveX=x;
						t.oPP.css('-webkit-transform','translate3d('+(t.curX + x/(t.num*t.w)*100)+'%,0,0)').css('-webkit-transition','0ms');
						t.touchMoveFunc && t.touchMoveFunc(t.curIdx, t.moveX/t.w);
					}					
				}
			};
					
			var onTouchEnd=function(e){		
				if(identifier!=e.changedTouches[e.changedTouches.length-1].identifier){return;}
				t.oPP.unbind(MOVE_EV, func_MOVE_EV).unbind(END_EV, func_END_EV);				
				
				if(!isMoved || !isHorizontalMove){return;}

				if(Date.now()-t.oldTime < 300){
					t.goIndex(deltaX>10?'-1':deltaX<-10?'+1':t.curIdx);
				}else{
					if(Math.abs(t.moveX)/t.w<0.5){
						t.goIndex(t.curIdx);
					}else{
						t.goIndex(deltaX>10?'-1':'+1');							
					}		
				}
			};

			var func_START_EV=function(e){onTouchStart.call(t,e);}, func_MOVE_EV=function(e){onTouchMove.call(t,e);}, func_END_EV=function(e){onTouchEnd.call(t,e);};							
			t.oPP.bind(START_EV, func_START_EV);
		}			
	};
	
	o.init(opt);	
	
	return {
		num 			: o.num,
		width			: o.w,
		moveX			: function(){return o.moveX;},
		goIndex			: function(direction, duration){o.goIndex(direction, duration);},
		getPastIndex 	: function(){return o.pastIndex;},			
		getCurrentIndex : function(){return o.curIdx;},
		
		start			: function(){if(!o.isPlay){return;}o.isInPlay=true;o.playFunc();},
		pause			: function(){if(!o.isPlay){return;}o.isInPlay=false;clearTimeout(o.iTimer);},
		go				: function(){if(!o.isPlay){return;}o.isInPlay=true;o.playFunc();},
		stop			: function(){if(!o.isPlay){return;}o.isInPlay=false;clearTimeout(o.iTimer);o.goIndex(1,0);}		
	};		
}

