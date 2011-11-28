/*!
 * lhgcore Dialog Plugin v4.0.0
 * Date : 2011-11-04 10:16:11
 * Copyright (c) 2009 - 2011 By Li Hui Gang
 */

;(function( $, window, undefined ){

$.noop = $.noop || function(){}; // jQuery 1.3.2
var _ie6 = window.VBArray && !window.XMLHttpRequest,
    _isIE = 'CollectGarbage' in window,
    _isMobile = 'createTouch' in document && !('onmousemove' in document.documentElement)
	    || /(iPhone|iPad|iPod)/i.test(navigator.userAgent),
	_count = 0,
	_expando = 'lhgdialog' + (new Date).getTime(),
	_rurl = /^url:/, _box,
		
/*!
 * 克隆对象函数
 * @param	{Object}
 * @return  {Object} 此对象为给定对象为原型对象的空对象
 */
_clone = function( object )
{
    function f(){};
	f.prototype = object;
	return new f;
},

/*!
 * _path 取的组件文件lhgdialog.js所在的路径
 * _args 取的是文件后的url参数组，如：lhgdialog.js?self=true&skin=aero中的?后面的内容
 */
_args, _path = (function( script, i, me )
{
    var l = script.length,
	    r = /lhgdialog(?:\.min)?\.js/i;
	
	for( ; i < l; i++ )
	{
	    if( r.test(script[i].src) )
		{
		    me = !!document.querySelector ?
			    script[i].src : script[i].getAttribute('src',4);
			break;
		}
	}
	
	me = me.split('?'); _args = me[1];
	
	return me[0].substr( 0, me[0].lastIndexOf('/') + 1 );
})(document.getElementsByTagName('script'),0),        

/*!
 * 获取url参数值函数
 * @param {String}
 * @return {String||null}
 * @demo lhgdialog.js?skin=aero | _getArgs('skin') => 'aero'
 */
_getArgs = function( name )
{
    if( _args )
	{
	    var p = _args.split('&'), i = 0, l = p.length, a;
		for( ; i < l; i++ )
		{
		    a = p[i].split('=');
			if( name === a[0] ) return a[1];
		}
	}
	return null;
},

/*! 取皮肤样式名，默认为 default */
_skin = _getArgs('skin') || 'default',

/*! 获取 lhgdialog 可跨级调用的最高层的 window 对象和 document 对象 */
_doc, _top = (function(w)
{
	try{
	    _doc = w['top'].document;  // 跨域|无权限
		_doc.getElementsByTagName; // chrome 浏览器本地安全限制
	}catch(e){
	    _doc = w.document; return w;
	}
	
	// 如果指定参数self为true则不跨框架弹出，或为框架集则无法显示第三方元素
	if( _getArgs('self') === 'true' ||
	    _doc.getElementsByTagName('frameset').length > 0 )
	{
	    _doc = w.document; return w;
	}
	
	return w['top'];
})(window),

_$doc = $(_doc), _$top = $(_top), _$html = $('html',_doc);

/*! 开启IE6 CSS背景图片缓存 */
try{
	_doc.execCommand( 'BackgroundImageCache', false, true );
}catch(e){};

/*! 在最顶层页面添加样式文件 */
$('head',_doc).append( '<link href="' + _path + 'skins/' + _skin + '.css" rel="stylesheet" type="text/css"/>' );

$.fn.show = function(ib){
    ib = ib ? 'inline-block' : 'block';
	this[0].style.display = ib;
	return this;
};

$.fn.hide = function()
{
    this[0].style.display = 'none';
	return this;
};

/*!
 * lhgdialog 入口函数
 */
var lhgdialog = function( config, ok, cancel )
{
	config = config || {};
	
	if( typeof config === 'string' || config.nodeType === 1 )
		config = { content: config, fixed: _isMobile };
	
	var api, setting = lhgdialog.setting;
		
	// 合并默认配置
	for( var i in setting ){
		if( config[i] === undefined ) config[i] = setting[i];
	};
	
	config.id = config.id || _expando + _count;
	
	// 如果定义了id参数则返回存在此id的窗口对象
	api = lhgdialog.list[config.id];
	if(api) return api.focus();
	
	// 目前主流移动设备对fixed支持不好
	if(_isMobile) config.fixed = false;
	
	// 按钮队列
	if( !$.isArray(config.button) )
		config.button = config.button ? [config.button] : [];
	
	if( ok !== undefined ) config.ok = ok;
	if( cancel !== undefined ) config.cancel = cancel;
	
	config.ok && config.button.push({
	    name: config.okVal,
		callback: config.ok,
		focus: true
	});
	
	config.cancel && config.button.push({
	    name: config.cancelVal,
		callback: config.cancel
	});
	
	// zIndex全局配置
	lhgdialog.setting.zIndex = config.zIndex;
	
	_count++;
	
	return lhgdialog.list[config.id] = _box ?
	    _box._init(config) : _clone(lhgdialog.fn)._init( config );
};

lhgdialog.fn =
{
    version: '4.0.0',
	
	_init: function( config )
	{
	    var that = this, _url, DOM,
		    icon = config.icon,
			iconBg = icon && config.path + 'skins/icons/' + icon,
			
			// 标题栏左边的图标
			ticon = config.titleIcon 
			? { backgroundImage: 'url(\'' + config.path + 'skins/icons/' + config.titleIcon + '\')' }
			: { display:'none' }
		
		// 假如提示性图标为真默认不显示最小化和最大化按钮
		if( icon )
		{
		    config.min = false;
			config.max = false;
		}
		
		that._isRun = true;
		that.config = config;
		that.DOM = DOM = that.DOM || that._getDOM();
		
		// 定义属性opener为引当前加载页面的window对象
		that.opener = window;
		
		DOM.wrap.addClass( config.skin ); // 多皮肤共存
		DOM.icon[0].style.display = icon ? '' : 'none';
		DOM.icon_bg.attr('src',iconBg || '');
		DOM.title_icon.css( ticon );
		DOM.rb.css('cursor', config.resize ? 'se-resize' : 'auto');
		DOM.title.css('cursor', config.drag ? 'move' : 'auto');
		DOM.max[config.max?'show':'hide'](true);
		DOM.min[config.min?'show':'hide'](true);
		DOM.close[config.cancel===false?'hide':'show'](true); //当cancel参数为false时隐藏关闭按钮
		DOM.content.css('padding', config.padding);
		
		that.show(true)
		.button(config.button)
		.title(config.title)
		.content(config.content, true)
		.size(config.width, config.height)
		.position(config.left, config.top)
		.focus()
		.time(config.time);
		
		config.lock && that.lock();
		
		that._addEvent();
		that._ie6PngFix();
		
		_box = null;
		
		// 假如加载的是单独页面的内容页config.init函数会在内容页加载完成后执行，这里就不执行了
		if( !_rurl.test(config.content) )
		{
		    config.init && config.init.call( that, window );
		}
		
		return that;
	},
	
	/*!
	 * 设置内容
	 * @param	{String}	内容 (如果内容前3个字符为‘url:’就加载单独页面的内容页)
	 * @return	{this}		如果无参数则返回对象本身
	 */
	content: function( msg )
	{
	    if( msg === undefined ) return this;
		
		var that = this, _url,
		    DOM = that.DOM,
			wrap = DOM.wrap[0],
			width = wrap.offsetWidth,
			height = wrap.offsetHeight,
			left = parseInt(wrap.style.left),
			top = parseInt(wrap.style.top),
			cssWidth = wrap.style.width,
			$content = DOM.content,
			loading = lhgdialog.setting.content;
		
		wrap.style.width = 'auto';
		
		if( typeof msg === 'string' )
		{
		    // 假如内容中前3个字符为'url:'就加载相对路径的单独页面的内容页
			if( _rurl.test(msg) )
			{
			    DOM.icon.hide();
				$content.html( loading );
				_url = msg.split('url:')[1];
				that._iframe( _url );
			}
			else
			    $content.html( msg );
		}
		
		// 新增内容后调整位置
		if( !arguments[1] )
		{
			width = wrap.offsetWidth - width;
			height = wrap.offsetHeight - height;
			left = left - width / 2;
			top = top - height / 2;
			wrap.style.left = Math.max(left, 0) + 'px';
			wrap.style.top = Math.max(top, 0) + 'px';
			
			if( cssWidth && cssWidth !== 'auto' )
				wrap.style.width = wrap.offsetWidth + 'px';
			
			that._autoPositionType();
		};
		
		that._ie6SelectFix();
		
		if( !_rurl.test(msg) )
		    that._runScript( $content[0] );
		
		return that;
	},
	
	/**
	 * 设置标题
	 * @param	{String, Boolean}	标题内容. 为false则隐藏标题栏
	 * @return	{this}	如果无参数则返回对象本身
	 */
	title: function( text )
	{
		if( text === undefined ) return this;
		
		var DOM = this.DOM,
			border = DOM.border,
			title = DOM.title,
			className = 'ui_state_tips';
		
		if( text === false )
		{
			title.hide().html('');
			border.addClass(className);
		}
		else
		{
			text = title.html() + text;
			title.show().html(text || '');
			border.removeClass(className);
		};
		
		return this;
	},
	
	/**
	 *	尺寸
	 *	@param	{Number, String}	宽度
	 *	@param	{Number, String}	高度
	 */
	size: function( width, height )
	{
		var maxWidth, maxHeight, scaleWidth, scaleHeight,
			that = this,
			config = that.config,
			DOM = that.DOM,
			wrap = DOM.wrap,
			main = DOM.main,
			wrapStyle = wrap[0].style,
			style = main[0].style;
		
		if( width )
		{
			that._width = width.toString().indexOf('%') !== -1 ? width : null;
			maxWidth = _$top.width() - wrap[0].offsetWidth + main[0].offsetWidth;
			scaleWidth = that._toNumber(width,maxWidth);
			width = scaleWidth;
			
			wrapStyle.width = 'auto';
			
			if( typeof width === 'number' )
				style.width = Math.max(that.config.minWidth,width) + 'px';
			else if( typeof width === 'string' )
				style.width = width;
			
			if( width !== 'auto' ) // 防止未定义宽度的表格遇到浏览器右边边界伸缩
			    wrapStyle.width = wrap[0].offsetWidth + 'px';
		}
		
		if( height )
		{
			that._height = height.toString().indexOf('%') !== -1 ? height : null;
			maxHeight = _$top.height() - wrap[0].offsetHeight + main[0].offsetHeight;
			scaleHeight = that._toNumber(height,maxHeight);
			height = scaleHeight;
			
			if( typeof height === 'number' )
				style.height = Math.max(that.config.minHeight, height) + 'px';
			else if( typeof height === 'string' )
				style.height = height;
		};
		
		that._ie6SelectFix();
		
		return that;
	},
	
	/**
	 * 位置(相对于可视区域)
	 * @param	{Number, String}
	 * @param	{Number, String}
	 */
	position: function( left, top )
	{
		var that = this,
			config = that.config,
			wrap = that.DOM.wrap[0],
			isFixed = _ie6 ? false : config.fixed,
			ie6Fixed = _ie6 && config.fixed,
			docLeft = _$doc.scrollLeft(),
			docTop = _$doc.scrollTop(),
			dl = isFixed ? 0 : docLeft,
			dt = isFixed ? 0 : docTop,
			ww = _$top.width(),
			wh = _$top.height(),
			ow = wrap.offsetWidth,
			oh = wrap.offsetHeight,
			style = wrap.style;
		
		if( left || left === 0 )
		{
			that._left = left.toString().indexOf('%') !== -1 ? left : null;
			left = that._toNumber(left, ww - ow);
			
			if(typeof left === 'number')
			{
				left = ie6Fixed ? (left += docLeft) : left + dl;
				style.left = Math.max(left,dl) + 'px';
			}
			else if(typeof left === 'string')
				style.left = left;
		}
		
		if( top || top === 0 )
		{
			that._top = top.toString().indexOf('%') !== -1 ? top : null;
			top = that._toNumber(top, wh - oh);
			
			if(typeof top === 'number')
			{
				top = ie6Fixed ? (top += docTop) : top + dt;
				style.top = Math.max(top,dt) + 'px';
			}
			else if(typeof top === 'string')
				style.top = top;
		}
		
		if( left !== undefined && top !== undefined )
			that._autoPositionType();
		
		return that;
	},
	
	/**
	 * 自定义按钮
	 * @example
		button({
			name: 'login',
			callback: function () {},
			disabled: false,
			focus: true
		}, .., ..)
	 */
	button: function()
	{
		var that = this,
			ags = arguments,
			buttons = that.DOM.buttons[0],
			focusButton = 'ui_state_highlight',
			listeners = that._listeners = that._listeners || {},
			list = $.isArray(ags[0]) ? ags[0] : [].slice.call(ags);
		
		if( ags[0] === undefined ) return that;
		
		$.each(list, function(i,obj){
		    var name = obj.name,
			    isNewButton = !listeners[name],
				button = !isNewButton ?
					listeners[name].elem :
					_doc.createElement('button');
			
			if( !listeners[name] ) listeners[name] = {};
			if( obj.callback ) listeners[name].callback = obj.callback;
			if( obj.className ) button.className = obj.className;
			
			if( obj.focus )
			{
			    that._focus && that._focus.removeClass(focusButton);
				that._focus = $(button).addClass(focusButton);
				that.focus();
			}
			
			button[_expando + 'callback'] = name;
			button.disabled = !!obj.disabled;

			if( isNewButton )
			{
				button.innerHTML = name;
				listeners[name].elem = button;
				buttons.appendChild(button);
			}
		});
		
		buttons.style.display = list.length ? '' : 'none';
		that._ie6SelectFix();
		
		return that;
	},
	
	/*! 显示对话框 */
	show: function()
	{
		this.DOM.wrap.show();
		!arguments[0] && this._lock && $(lhgdialog.lockMask).show();
		return this;
	},
	
	/*! 隐藏对话框 */
	hide: function()
	{
	    this.DOM.wrap.hide();
		!arguments[0] && this._lock && $(lhgdialog.lockMask).hide();
		return this;
	},
	
	/*! 关闭对话框 */
	close: function()
	{
		if( !this._isRun ) return this;
		
		var that = this,
			DOM = that.DOM,
			wrap = DOM.wrap,
			list = lhgdialog.list,
			fn = that.config.close;
		
		that.time();
		
		// 当使用iframe方式加载内容页时的处理代码
		if( that.iframe )
		{
			if( typeof  fn === 'function' && fn.call(that, that.iframe.contentWindow, window) === false )
			    return that;
			
			// 重要！需要重置iframe地址，否则下次出现的对话框在IE6、7无法聚焦input
			// IE删除iframe后，iframe仍然会留在内存中出现上述问题，置换src是最容易解决的方法
			$(that.iframe).css('display', 'none')
			.unbind('load', that._fmLoad)
			.attr('src', 'about:blank').remove();
			
			DOM.content.removeClass('ui_state_full');
			if( that._frmTimer ) clearTimeout(that._frmTimer);
		}
		else
		{
		    if( typeof fn === 'function' && fn.call(that, window) === false )
			    return that;
		}
		
		that.unlock();
		
		if( that._minState )
		    that._minReset();
		
		if( that._maxState )
		{
		    DOM.main.css({width:that._or.w,height:that._or.h});
		    DOM.res.hide();
			
			if( !that.parent || (that.parent && !that.parent._lock) )
			    _$html.removeClass('ui_lock_scroll ui_lock_fixed');
		}
		
		// 置空内容
		wrap[0].className = wrap[0].style.cssText = '';
		DOM.outer.removeClass('ui_state_focus');
		DOM.title.html('');
		DOM.content.html('');
		DOM.buttons.html('');
		
		if( lhgdialog.focus === that ) lhgdialog.focus = null;
		
		delete list[that.config.id];
		that._removeEvent();
		that.hide(true)._setAbsolute();
		
		// 清空除this.DOM之外临时对象，恢复到初始状态，以便使用单例模式
		for( var i in that )
		{
			if(that.hasOwnProperty(i) && i !== 'DOM') delete that[i];
		};
		
		// 移除HTMLElement或重用
		_box ? wrap.remove() : _box = that;
		
		return that;
	},
	
	/*!
	 * 定时关闭
	 * @param	{Number}	单位为秒, 无参数则停止计时器
	 * @param   {Function}  关闭窗口前执行的回调函数
	 */
	time: function( second, callback )
	{
		var that = this,
			cancel = that.config.cancelVal,
			timer = that._timer;
			
		timer && clearTimeout(timer);
		if( callback ) callback.call(that);
		
		if(second)
		{
			that._timer = setTimeout(function(){
				that._click(cancel);
			}, 1000 * second);
		}
		
		return that;
	},
	
	/*! 设置焦点 */
	focus: function()
	{
		var that = this, elemFocus,
			DOM = that.DOM,
			top = lhgdialog.focus,
			index = lhgdialog.setting.zIndex++;
		
		// 设置叠加高度
		DOM.wrap.css('zIndex', index);
		
		// 设置最高层的样式
		top && top.DOM.outer.removeClass('ui_state_focus');
		lhgdialog.focus = that;
		DOM.outer.addClass('ui_state_focus');
		
		// 添加焦点
		if(that.config.focus)
		{
			try {
				elemFocus = that._focus && that._focus[0] || DOM.close[0];
				elemFocus && elemFocus.focus();
			}catch(e){} // IE对不可见元素设置焦点会报错
		}
		
		return that;
	},
	
	/*!
	 * 设置屏锁 
	 * 所有窗口都共用一个遮罩层
	 */
	lock: function()
	{
		var that = this, frm,
		    index = lhgdialog.setting.zIndex - 1,
			config = that.config,
			mask = $('#lockMask',_doc)[0] || null,
			style = mask ? mask.style : '',
			positionType = _ie6 ? 'absolute' : 'fixed';
			opac = $.browser.msie
		
		// 消除滚动条
		_$html.addClass('ui_lock_scroll');
		
		if( !mask )
		{
			frm = '<iframe src="about:blank" style="width:100%;height:100%;position:absolute;' +
			    'top:0;left:0;z-index:-1;filter:alpha(opacity=0)"></iframe>';
				
			mask = _doc.createElement('div');
			style = mask.style;
			mask.id = 'lockMask';
			
			style.cssText = 'position:' + positionType + ';left:0;top:0;width:100%;height:100%;overflow:hidden;';
			$(mask).css({ opacity:config.opacity, background:config.background });
			
			_doc.body.appendChild( mask );
			if( _ie6 ) mask.innerHTML = frm;
		}
		
		if( positionType === 'absolute' )
		{
		    style.width = _$doc.width();
			style.height = _$doc.height();
			style.top = _$doc.scrollTop();
			style.left = _$doc.scrollLeft();
		}
		
		// 延迟显示遮罩层，防止显示遮罩层时左上角有小方块区域
		that._lockTimer = setTimeout(function(){
			style.display = '';
		    style.zIndex = index;
		}, 1);
		
		// $(mask).bind('dblclick',function(){
		    // that._click(config.cancelVal);
		// }); 此方法还是有问题
		
		that.focus();
		that.DOM.outer.addClass('ui_state_lock');
		
		that._lock = true;
			
		return that;
	},
	
	/*! 解开屏锁 */
	unlock: function()
	{
		var that = this,
		    config = that.config,
			mask = $('#lockMask',_doc)[0];
		
		if( mask && that._lock )
		{
		    // 无限级锁屏
			if( config.parent && config.parent._lock )
			{
			    var index = config.parent.DOM.wrap[0].style.zIndex;
				mask.style.zIndex = parseInt(index,10) - 1;
			}
			else
			{
			    mask.style.display = 'none';
			    _$html.removeClass('ui_lock_scroll');
			}
			
			that.DOM.outer.removeClass('ui_state_lock');
		}
		
		if( that._lockTimer ) clearTimeout(that._lockTimer);
		
		return that;
	},
	
	/*!
	 * 最大化窗口
	 */
	max: function()
	{
		var that = this,
		    DOM = that.DOM,
			wrapStyle = DOM.wrap[0].style,
			mainStyle = DOM.main[0].style,
			rbStyle = DOM.rb[0].style,
			titleStyle = DOM.title[0].style,
			config = that.config,
		    top = _$doc.scrollTop(),
		    left = _$doc.scrollLeft();
		
		if( !that._maxState )
		{
		
			if( that._minState )
			{
			    that._minReset();
				DOM.min.show(true);
				that._minState = false;
			}
			
			// 存储最大化窗口前的状态
			that._or = {
				t: wrapStyle.top,
				l: wrapStyle.left,
				w: mainStyle.width,
				h: mainStyle.height,
				d: config.drag,
				r: config.resize,
				rc: rbStyle.cursor,
				tc: titleStyle.cursor
			};
			
			// 最大化时去除滚动条
			!that._lock && _$html.addClass('ui_lock_scroll');
			_ie6 && _$html.addClass('ui_lock_fixed');
			
			DOM.wrap.css({ top:top + 'px', left:left + 'px' });
			
			that.size('100%', '100%')._setAbsolute();
			config.drag = false;
			config.resize = false;
			rbStyle.cursor = 'auto';
			titleStyle.cursor = 'auto';
			
			DOM.max.hide();
			DOM.res.show(true);
			
			that._maxState = true;
		}
		else
		{
		    !that._lock && _$html.removeClass('ui_lock_scroll');
			
			if( _ie6 )
			{
			    _$html.removeClass('ui_lock_fixed');
				that._top = that._or.t;
				that._left = that._or.l;
			}
			
			DOM.wrap.css({ top:that._or.t, left:that._or.l });
			that.size(that._or.w, that._or.h)._autoPositionType();
			config.drag = that._or.d;
		    config.resize = that._or.r;
		    rbStyle.cursor = that._or.rc;
		    titleStyle.cursor = that._or.tc;
		
		    DOM.res.hide();
			DOM.max.show(true);
			
			delete that._or;
			
			that._maxState = false;
		}
		
		return that;
	},
	
	/*!
	 * 最小化窗口
	 */
	min: function()
	{
	    var that = this,
		    DOM = that.DOM;
			
		if( !that._minState )
		{
		    if( that._maxState )
				that.max();
			
			that._minRz = that.config.resize;
			DOM.main.hide();
		    DOM.footer.hide();
		    DOM.dialog[0].style.width = DOM.main[0].style.width;
			DOM.rese.show(true);
			DOM.min.hide();
			DOM.rb[0].style.cursor = 'auto';
			that.config.resize = false;
		
		    that._minState = true;
		}
		else
		{
		    that._minReset();
			DOM.min.show(true);
			
			delete that._minRz;
			
			that._minState = false;
		}
		
		return that;
	},
	
	/*!
	 * 获取指定id的几种对象
	 * @param {String} 指定的id
	 * @param {String} 指定要返回的类型
	 *        'window' 默认值，返回iframe加载的内容页的window对象
	 *        'object' 返回指定id的窗口对象
	 *        'dom' 返回指定id的窗口的DOM对象
	 * @return {Object|null}
	 */
	get: function( id, type )
	{
	    type = type || 'window';
		
		if( lhgdialog.list[id] )
		{
			if( type === 'window' )
			    return lhgdialog.list[id].iwin || null;
			else if( type === 'object' )
			    return lhgdialog.list[id];
			else if( type === 'dom' )
			    return lhgdialog.list[id].DOM;
		}
		
		return null;
	},
	
	/*!
	 * 设置iframe方式加载内容页
	 */
	_iframe: function( url )
	{
	    var that = this, $iframe, iwin, $idoc, ibody, iWidth, iHeight,
		    $content = that.DOM.content, srcTimer,
			config = that.config,
			$loading = $('.ui_loading',$content[0]),
		    initCss = 'position:absolute;left:-9999em;border:none 0;background:transparent',
		    loadCss = 'width:100%;height:100%;border:none 0;';
		
		// 是否允许缓存. 默认true
		if( config.cache === false )
		{
			var ts = (new Date).getTime(),
				ret = url.replace(/([?&])_=[^&]*/, '$1_=' + ts );
			url = ret + ((ret === url) ? (/\?/.test(url) ? '&' : '?') + '_=' + ts : '');
		}
		
		$iframe = $('<iframe name="' + config.id + '" frameborder="0" src="" ' +
		    'allowtransparency="true" style="' + initCss + '"><\/iframe>',_doc);
		
		that.iframe = $iframe[0];
		$content[0].appendChild( $iframe[0] );
		
		// 延迟加载iframe的src属性，IE6下不延迟加载会出现加载进度条的BUG
		that._frmTimer = setTimeout(function(){
		    $iframe.attr('src', url);
		}, 1);
		
		// iframe中页面加载完成后执行的函数
		var load = that._fmLoad = function()
		{
			$content.addClass('ui_state_full');
			$loading[0] && $loading.hide();
			
			try{
			    iwin = that.iwin = $iframe[0].contentWindow; // 定义窗口对象iwin属性为内容页的window对象
				$idoc = $(iwin.document);
				ibody = iwin.document.body;
			}catch(e){// 跨域
			    $iframe[0].style.cssText = loadCss;
				that.position( config.left, config.top );
				return;
			}
			// 获取iframe内部尺寸
			iWidth = config.width === 'auto'
			? $idoc.width() + (_ie6 ? 0 : parseInt($(ibody).css('marginLeft')))
			: config.width;
			
			iHeight = config.height === 'auto'
			? $idoc.height() : config.height;
			
			// 适应iframe尺寸
			setTimeout(function(){
			    $iframe[0].style.cssText = loadCss;
			},0);// setTimeout: 防止IE6~7对话框样式渲染异常
			
			that.size( iWidth, iHeight )
			.position( config.left, config.top );
			
			$idoc.bind('mousedown',function()
			{
			    that.focus();
			});
			
			config.init && config.init.call( that, iwin, _top );
		};
		
		// 绑定iframe元素api属性为窗口自身对象，在内容页中此属性很重要
		that.iframe.api = that;
		$iframe.bind( 'load', load );
	},
	
	/*! 获取窗口元素 */
	_getDOM: function()
	{
		var wrap = $(lhgdialog.templates,_doc).appendTo(_doc.body),
            name, i = 0,
			DOM = { wrap: wrap },
			els = wrap[0].getElementsByTagName('*'),
			len = els.length;
			
		for( ; i < len; i ++ )
		{
			name = els[i].className.split('ui_')[1];
			if(name) DOM[name] = $(els[i]);
		};
		
		return DOM;
	},
	
	/*!
	 * px与%单位转换成数值 (百分比单位按照最大值换算)
	 * 其他的单位返回原值
	 */
	_toNumber: function( thisValue, maxValue )
	{
		if( !thisValue && thisValue !== 0 || typeof thisValue === 'number')
			return thisValue;
		
		var last = thisValue.length - 1;
		if( thisValue.lastIndexOf('px') === last )
			thisValue = parseInt(thisValue);
		else if( thisValue.lastIndexOf('%') === last )
			thisValue = parseInt(maxValue * thisValue.split('%')[0] / 100);
		
		return thisValue;
	},
	
	/*! 让IE6 CSS支持PNG背景 */
	_ie6PngFix: _ie6 ? function(){
		var i = 0, elem, png, pngPath, runtimeStyle,
			path = lhgdialog.setting.path + '/skins/',
			list = this.DOM.wrap[0].getElementsByTagName('*');
		
		for( ; i < list.length; i ++ )
		{
			elem = list[i];
			png = elem.currentStyle['png'];
			if(png)
			{
				pngPath = path + png;
				runtimeStyle = elem.runtimeStyle;
				runtimeStyle.backgroundImage = 'none';
				runtimeStyle.filter = "progid:DXImageTransform.Microsoft." +
					"AlphaImageLoader(src='" + pngPath + "',sizingMethod='crop')";
			};
		}
	} : $.noop,
	
	/*! 强制覆盖IE6下拉控件 */
	_ie6SelectFix: _ie6 ? function(){
		var $wrap = this.DOM.wrap,
			wrap = $wrap[0],
			expando = _expando + 'iframeMask',
			iframe = $wrap[expando],
			width = wrap.offsetWidth,
			height = wrap.offsetHeight;

		width = width + 'px';
		height = height + 'px';
		if(iframe)
		{
			iframe.style.width = width;
			iframe.style.height = height;
		}else{
			iframe = wrap.appendChild(_doc.createElement('iframe'));
			$wrap[expando] = iframe;
			iframe.src = 'about:blank';
			iframe.style.cssText = 'position:absolute;z-index:-1;left:0;top:0;'
			+ 'filter:alpha(opacity=0);width:' + width + ';height:' + height;
		}
	} : $.noop,
	
	/*!
	 * 解析HTML片段中自定义类型脚本，其this指向lhgdialog内部
	 * <script type="text/dialog">// [code] //</script>
	 */
	_runScript: function( elem )
	{
		var fun, i = 0, n = 0,
			tags = elem.getElementsByTagName('script'),
			length = tags.length,
			script = [];
			
		for( ; i < length; i++ )
		{
			if( tags[i].type === 'text/dialog' )
			{
				script[n] = tags[i].innerHTML;
				n ++;
			}
		}
		
		if( script.length )
		{
			script = script.join('');
			fun = new Function(script);
			fun.call(this);
		}
	},
	
	/*! 自动切换定位类型 */
	_autoPositionType: function()
	{
		this[this.config.fixed ? '_setFixed' : '_setAbsolute']();
	},
	
	/*! 设置静止定位
	 * IE6 Fixed @see: http://www.planeart.cn/?p=877
	 */
	_setFixed: function()
	{
		var $elem = this.DOM.wrap,
			style = $elem[0].style;
		
		if(_ie6)
		{
			var sLeft = _$doc.scrollLeft(),
				sTop = _$doc.scrollTop(),
				left = parseInt($elem.css('left')) - sLeft,
				top = parseInt($elem.css('top')) - sTop;
			
			this._setAbsolute();
			
			style.setExpression( 'left', 'this.ownerDocument.documentElement.scrollLeft +' + left );
			style.setExpression( 'top', 'this.ownerDocument.documentElement.scrollTop +' + top );
		}
		else
			style.position = 'fixed';
	},
	
	/*! 设置绝对定位 */
	_setAbsolute: function()
	{
		var style = this.DOM.wrap[0].style;
			
		if(_ie6)
		{
			style.removeExpression('left');
			style.removeExpression('top');
		}

		style.position = 'absolute';
	},
	
	/*! 按钮回调函数触发 */
	_click: function( name )
	{ 
		var that = this,
			fn = that._listeners[name] && that._listeners[name].callback;
		return typeof fn !== 'function' || fn.call(that, window) !== false ?
			that.close() : that;
	},
	
	/*! 重置位置与尺寸 */
	_reset: function( test )
	{
		var newSize,
			that = this,
			oldSize = that._winSize || _$top.width() * _$top.height(),
			width = that._width,
			height = that._height,
			left = that._left,
			top = that._top;
		
		if(test)
		{
			//IE6~7 window.onresize bug
			newSize = that._winSize =  _$top.width() * _$top.height();
			if( oldSize === newSize ) return;
		};
		
		if(width || height) that.size(width, height);
		
		if(left || top)
			that.position(left, top);
	},
	
	/*! 最化小后还原时设置 */
	_minReset: function()
	{
	    var that = this,
		    DOM = that.DOM;
			
		DOM.main[0].style.display = '';
		DOM.footer[0].style.display = '';
		DOM.dialog.removeAttr('style');
		DOM.rese.hide();
		that.config.resize = that._minRz;
		DOM.rb[0].style.cursor = that._minRz ? 'se-resize' : 'auto';
	},
	
	/*! 事件代理 */
	_addEvent: function()
	{
		var resizeTimer,
			that = this,
			config = that.config,
			DOM = that.DOM;
		
		// 窗口调节事件
		that._winResize = function()
		{
			resizeTimer && clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function()
			{
				that._reset(_isIE);
			}, 140);
		};
		_$top.bind('resize', that._winResize);
		
		// 监听点击
		DOM.wrap.bind('click',function(event)
		{
			var target = event.target, callbackID;
			
			if( target.disabled ) return false; // IE BUG
			
			if( target === DOM.close[0] )
			{
				that._click(config.cancelVal);
				return false;
			}
			else if( target === DOM.max[0] || target === DOM.res[0] || target === DOM.max_b[0]
			    || target === DOM.res_b[0] || target === DOM.res_t[0] )
			{
			    that.max();
				return false;
			}
			else if( target === DOM.min[0] || target === DOM.rese[0] || target === DOM.min_b[0] )
			{
				that.min();
				return false;
			}
			else
			{
				callbackID = target[_expando + 'callback'];
				callbackID && that._click(callbackID);
			};
			
			that._ie6SelectFix();
			return false;
		}).bind('mousedown',function(){ that.focus(); });
		
		// 双击标题栏最大化还窗口事件
		if( config.max )
		    DOM.title.bind('dblclick',function(){ that.max();return false; });
	},
	
	/*!  卸载事件代理 */
	_removeEvent: function()
	{
		var that = this,
			DOM = that.DOM;
		
		DOM.wrap.unbind();
		DOM.title.unbind();
		_$top.unbind('resize', that._winResize);
	}
};

$.fn.dialog = $.fn.lhgdialog = function()
{
	var config = arguments;
	this.bind('click', function(){
		lhgdialog.apply(this, config);
		return false;
	});
	return this;
};

/*! 此对象用来存储获得焦点的窗口对象实例 */
lhgdialog.focus = null;

/*! 最高层的 window 对象 */
lhgdialog.top = _top;

/*! 存储窗口实例的对象列表 */
lhgdialog.list = {};

/*! 全局快捷键 */
_$doc.bind('keydown',function(event)
{
	var target = event.target,
		nodeName = target.nodeName,
		rinput = /^INPUT|TEXTAREA$/,
		api = lhgdialog.focus,
		keyCode = event.keyCode;

	if( !api || !api.config.esc || rinput.test(nodeName) ) return;
		
	keyCode === 27 && api._click(api.config.cancelVal);
});

/*! 触发浏览器预先缓存背景图片 */
$(function()
{
	setTimeout(function()
	{
	    if(_count) return;
		lhgdialog({left:'-9999em',time:9,fixed:false,lock:false,focus:false});
	},150);
});

/*!
 * 框架页面卸载前关闭所有穿越的对话框
 * 同时移除拖动层和遮罩层
 */
_top != window && $(window).bind('unload',function()
{
    var list = lhgdialog.list;
	for( var i in list )
	{
	    if(list[i])
		{
		    list[i].close();
			delete list[i];
		}
	}
	_box && _box.DOM.wrap.remove();
	$('#lockMask',_doc)[0] && $('#lockMask',_doc).remove();
	$('#dragMask',_doc)[0] && $('#dragMask',_doc).remove();
});


/**
 * 跨框架数据共享接口
 * @see		http://www.planeart.cn/?p=1554
 * @param	{String}	存储的数据名
 * @param	{Any}		将要存储的任意数据(无此项则返回被查询的数据，如果此值为false就删除指定名称的删除)
 */
lhgdialog.data = function( name, value )
{
    var top = lhgdialog.top,
	    cache = top['_data'] || {};
	
	top['_data'] = cache;
	
	if( value !== undefined )
	    cache[name] = value;
	else if( value === false )
	{
	    if(cache[name]) delete cache[name];
	}
	else
	    return cache[name];
	
	return cache;
};


/*!
 * 窗口组件模板，基础皮肤自适应九宫格结构
 * 由网友[一丝冰凉] 制作提供 QQ:50167214
 */
lhgdialog.templates =
'<div style="position:absolute;left:0;top:0">' +
'<div class="ui_outer">' +
    '<table class="ui_border">' +
	    '<tbody>' +
		    '<tr>' +
			    '<td class="ui_lt"></td>' +
				'<td class="ui_t"></td>' +
				'<td class="ui_rt"></td>' +
			'</tr>' +
			'<tr>' +
				'<td class="ui_l"></td>' +
				'<td class="ui_c">' +
				    '<div class="ui_inner">' +
					'<table class="ui_dialog">' +
						'<tbody>' +
							'<tr>' +
								'<td colspan="2" class="ui_header">' +
									'<div class="ui_title_bar">' +
										'<div class="ui_title"><span class="ui_title_icon"></span></div>' +
										'<div class="ui_title_buttons">' +
										    '<a class="ui_min" href="#" title="\u6700\u5C0F\u5316"><b class="ui_min_b"></b></a>' +
											'<a class="ui_rese" href="#" title="\u6062\u590D">▽</a>' +
											'<a class="ui_max" href="#" title="\u6700\u5927\u5316"><b class="ui_max_b"></b></a>' +
											'<a class="ui_res" href="#" title="\u8FD8\u539F"><b class="ui_res_b"></b><b class="ui_res_t"></b>' +
										    '<a class="ui_close" href="#" title="\u5173\u95ED(esc\u952E)">\xd7</a>' +
										'</div>' +
									'</div>' +
								'</td>' +
							'</tr>' +
							'<tr>' +
								'<td class="ui_icon">' +
									'<img src="" class="ui_icon_bg"/>' + 
								'</td>' +
								'<td class="ui_main">' +
									'<div class="ui_content"></div>' +
								'</td>' +
							'</tr>' +
							'<tr>' +
								'<td colspan="2" class="ui_footer">' +
									'<div class="ui_buttons"></div>' +
								'</td>' +
							'</tr>' +
						'</tbody>' +
					'</table>' +
					'</div>' +
				'</td>' +
				'<td class="ui_r"></td>' +
			'</tr>' +
			'<tr>' +
				'<td class="ui_lb"></td>' +
				'<td class="ui_b"></td>' +
				'<td class="ui_rb"></td>' +
			'</tr>' +
		'</tbody>' +
	'</table>' +
'</div>' +
'</div>';

/*! lhgdialog 的全局默认配置 */
lhgdialog.setting =
{
    content: '<div class="ui_loading"><span>loading...</span></div>',
	title: '\u89C6\u7A97 ',     // 标题. 默认'视窗'
	titleIcon: null,            // 标题栏左边的小图标
	button: null,				// 自定义按钮
	ok: null,					// 确定按钮回调函数
	cancel: null,				// 取消按钮回调函数
	init: null,					// 对话框初始化后执行的函数
	close: null,				// 对话框关闭前执行的函数
	okVal: '\u786E\u5B9A',		// 确定按钮文本. 默认'确定'
	cancelVal: '\u53D6\u6D88',	// 取消按钮文本. 默认'取消'
	skin: '',					// 皮肤名
	esc: true,					// 是否支持Esc键关闭
	focus: true,				// 是否支持对话框按钮聚焦
	width: 'auto',				// 内容宽度
	height: 'auto',				// 内容高度
	minWidth: 96,				// 最小宽度限制
	minHeight: 32,				// 最小高度限制
	icon: null,					// 消息图标名称
	path: _path,                // lhgdialog路径
	lock: false,				// 是否锁屏
	parent: null,               // 打开子窗口的父窗口对象，主要用于多层锁屏窗口
	background: '#FFF',			// 遮罩颜色
	opacity: .5,				// 遮罩透明度
	padding: '15px 10px',		// 内容与边界填充距离
	fixed: false,				// 是否静止定位
	left: '50%',				// X轴坐标
	top: '38.2%',				// Y轴坐标
	max: true,                  // 是否显示最大化按钮
	min: true,                  // 是否显示最小化按钮
	zIndex: 1976,				// 对话框叠加高度值(重要：此值不能超过浏览器最大限制)
	resize: true,				// 是否允许用户调节尺寸
	drag: true, 				// 是否允许用户拖动位置
	limit: false,               // 是否将窗口拖动限制到可视区域内
	cache: true,                // 是否缓存窗口内容页
	extendDrag: true            // 增加lhgdialog拖拽体验
};

window.lhgdialog = $.dialog = $.lhgdialog = lhgdialog;

})( window.jQuery||window.lhgcore, this );

/*!
 *------------------------------------------------
 * 对话框模块-拖拽支持（可选外置模块）
 *------------------------------------------------
 */
;(function( $, lhgdialog ){

var _$document = $(lhgdialog.top.document),
    _$window = $(lhgdialog.top),
	_dragEvent, _use,
	_elem = document.documentElement,
	_ie6 = window.VBArray && !window.XMLHttpRequest,
	_isSetCapture = 'setCapture' in _elem,
	_isLosecapture = 'onlosecapture' in _elem;

lhgdialog.dragEvent = function()
{
    var that = this,
	
	proxy = function(name)
	{
	    var fn = that[name];
		that[name] = function(){
		    return fn.apply(that,arguments);
		}
	};
	
	proxy('start');
	proxy('move');
	proxy('end');
};

lhgdialog.dragEvent.prototype =
{
	// 开始拖拽
	onstart: $.noop,
	start: function(event)
	{
		var that = this;
		
		_$document
		.bind( 'mousemove', that.move )
		.bind( 'mouseup', that.end );
		
		that._sClientX = event.clientX;
		that._sClientY = event.clientY;
		that.onstart( event.clientX, event.clientY );
		
		return false;
	},
	
	// 正在拖拽
	onmove: $.noop,
	move: function(event)
	{		
		var that = this;
		
		that._mClientX = event.clientX;
		that._mClientY = event.clientY;
		
		that.onmove(
			event.clientX - that._sClientX,
			event.clientY - that._sClientY
		);
		
		return false;
	},
	
	// 结束拖拽
	onend: $.noop,
	end: function(event)
	{
		var that = this;
		
		_$document
		.unbind('mousemove', that.move)
		.unbind('mouseup', that.end);
		
		that.onend( event.clientX, event.clientY );
		return false;
	}
};

_use = function(event)
{
	var limit, startWidth, startHeight, startLeft, startTop, isResize,
		api = lhgdialog.focus,
		config = api.config,
		DOM = api.DOM,
		wrap = DOM.wrap,
		title = DOM.title,
		main = DOM.main,
	
	// 清除文本选择
	clsSelect = 'getSelection' in _$window[0] ?
	function(){
		_$window[0].getSelection().removeAllRanges();
	}:function(){
		try{_$document[0].selection.empty();}catch(e){};
	};
	
	// 对话框准备拖动
	_dragEvent.onstart = function( x, y )
	{
		if( isResize )
		{
			startWidth = main[0].offsetWidth;
			startHeight = main[0].offsetHeight;
		}
		else
		{
			startLeft = wrap[0].offsetLeft;
			startTop = wrap[0].offsetTop;
		};
		
		_$document.bind( 'dblclick', _dragEvent.end );
		
		!_ie6 && _isLosecapture
		? title.bind('losecapture',_dragEvent.end )
		: _$window.bind('blur',_dragEvent.end);
		
		_isSetCapture && title[0].setCapture();
		
		DOM.outer.addClass('ui_state_drag');
		api.focus();
	};
	
	// 对话框拖动进行中
	_dragEvent.onmove = function( x, y )
	{
		if( isResize )
		{
			var wrapStyle = wrap[0].style,
				style = main[0].style,
				width = x + startWidth,
				height = y + startHeight;
			
			wrapStyle.width = 'auto';
			style.width = Math.max(0,width) + 'px';
			wrapStyle.width = wrap[0].offsetWidth + 'px';
			
			style.height = Math.max(0,height) + 'px';
			
		}
		else
		{
			var style = wrap[0].style,
				left = x + startLeft,
				top = y + startTop;

			config.left = Math.max( limit.minX, Math.min(limit.maxX,left) );
			config.top = Math.max( limit.minY, Math.min(limit.maxY,top) );
			style.left = config.left + 'px';
			style.top = config.top + 'px';
		}
			
		clsSelect();
		api._ie6SelectFix();
	};
	
	// 对话框拖动结束
	_dragEvent.onend = function( x, y )
	{
		_$document.unbind('dblclick',_dragEvent.end);
		
		!_ie6 && _isLosecapture
		? title.unbind('losecapture',_dragEvent.end)
		: _$window.unbind('blur',_dragEvent.end);
		
		_isSetCapture && title[0].releaseCapture();
		
		_ie6 && api._autoPositionType();
		
		DOM.outer.removeClass('ui_state_drag');
	};
	
	isResize = event.target === DOM.rb[0] ? true : false;
	
	limit = (function()
	{
		var maxX, maxY,
			wrap = api.DOM.wrap[0],
			fixed = wrap.style.position === 'fixed',
			ow = wrap.offsetWidth,
			oh = wrap.offsetHeight,
			ww = _$window.width(),
			wh = _$window.height(),
			dl = fixed ? 0 : _$document.scrollLeft(),
			dt = fixed ? 0 : _$document.scrollTop(),
			// 向下拖动时不能将标题栏拖出可视区域
			th = title[0].offsetHeight || 20;
		
		// 坐标最大值限制(在可视区域内，如果窗口随屏滚动那就进行限制)
		if( config.dragLimit || fixed )
		{
		    maxX = ww - ow + dl;
			maxY = wh - oh + dt;
		}
		else
		{
		    maxY = wh - th + dt;
			dl = -10000;
			maxX = 10000;
		}
		
		return {
			minX: dl,
			minY: dt,
			maxX: maxX,
			maxY: maxY
		};
	})();
	
	_dragEvent.start(event);
};

_$document.bind('mousedown',function(event){
    var api = lhgdialog.focus;
	if( !api ) return;
	
	var target = event.target,
		DOM = api.DOM,
	    config = api.config;
	
	if( config.drag !== false && target === DOM.title[0]
	|| config.resize !== false && target === DOM.rb[0] )
	{
	    _dragEvent = _dragEvent || new lhgdialog.dragEvent();
		_use(event);
		return false; // 防止firefox与chrome滚屏
	}
});

/*!
 * -------------------------------------
 * 增强lhgdialog拖拽体验（可选外置模块，如不需要可删除）
 * 防止鼠标落入iframe导致不流畅
 * 对超大对话框拖动优化
 * --------------------------------------
 */
$(function(){

if( lhgdialog.setting.extendDrag ) //lhgdialog.setting.extendDrag 此默认选项只能使用全局设置
{
	var event = lhgdialog.dragEvent;
	if( !event ) return;
	
	var dragEvent = event.prototype,
		mask = _$document[0].createElement('div'),
		style = mask.style,
		positionType = _ie6 ? 'absolute' : 'fixed';
	
	style.cssText = 'display:none;position:' + positionType + ';left:0;top:0;width:100%;height:100%;'
	+ 'cursor:move;filter:alpha(opacity=0);opacity:0;background:#FFF';
	
	mask.id = 'dragMask';
	_$document[0].body.appendChild(mask);
	
	dragEvent._start = dragEvent.start;
	dragEvent._end = dragEvent.end;
	
	dragEvent.start = function()
	{
		var api = lhgdialog.focus,
			main = api.DOM.main[0],
			iframe = api.iframe;
		
		dragEvent._start.apply(this, arguments);
		style.display = 'block';
		style.zIndex = lhgdialog.setting.zIndex + 3;
		
		if(positionType === 'absolute')
		{
			style.width = '100%';
			style.height = _$window.height() + 'px';
			style.left = _$document.scrollLeft() + 'px';
			style.top = _$document.scrollTop() + 'px';
		};
		
		if( iframe && main.offsetWidth * main.offsetHeight > 307200 )
			main.style.visibility = 'hidden';
	};
	
	dragEvent.end = function()
	{
		var api = lhgdialog.focus;
		dragEvent._end.apply(this, arguments);
		style.display = 'none';
		if(api) api.DOM.main[0].style.visibility = 'visible';
	};
}

});

})( window.jQuery||window.lhgcore, this.lhgdialog );

/*!
 *------------------------------------------------
 * 对话框其它功能扩展模块（可选外置模块）
 *------------------------------------------------
 */
;(function( $, lhgdialog, undefined ){

var _zIndex = function()
{
    return lhgdialog.setting.zIndex;
};

/**
 * 警告
 * @param	{String}	消息内容
 */
lhgdialog.alert = function( content, icon, title )
{
	return lhgdialog({
		title: title || '',
		id: 'Alert',
		zIndex: _zIndex(),
		icon: icon || 'warning.png',
		lock: true,
		ok: true,
		resize: false,
		content: content
	});
};

/**
 * 确认
 * @param	{String}	消息内容
 * @param	{Function}	确定按钮回调函数
 * @param	{Function}	取消按钮回调函数
 */
lhgdialog.confirm = function( content, yes, no, icon, title )
{
	return lhgdialog({
		title: title || '',
		id: 'Confirm',
		zIndex: _zIndex(),
		icon: icon || 'issue.png',
		lock: true,
		opacity: .1,
		resize: false,
		content: content,
		ok: function(here){
			return yes.call(this, here);
		},
		cancel: function(here){
			return no && no.call(this, here);
		}
	});
};

/**
 * 提问
 * @param	{String}	提问内容
 * @param	{Function}	回调函数. 接收参数：输入值
 * @param	{String}	默认值
 */
lhgdialog.prompt = function( content, yes, value, icon, title )
{
	value = value || '';
	var input;
	
	return lhgdialog({
		title: title || '',
		id: 'Prompt',
		zIndex: _zIndex(),
		icon: icon || 'issue.png',
		lock: true,
		opacity: .1,
		resize: false,
		content: [
			'<div style="margin-bottom:5px;font-size:12px">',
				content,
			'</div>',
			'<div>',
				'<input value="',
					value,
				'" style="width:18em;padding:6px 4px" />',
			'</div>'
			].join(''),
		init: function(){
			input = $('input',this.DOM.content[0])[0];
			input.select();
			input.focus();
		},
		ok: function(here){
			return yes && yes.call(this, input.value, here);
		},
		cancel: true
	});
};

/**
 * 短暂提示
 * @param	{String}	提示内容
 * @param	{Number}	显示时间 (默认1.5秒)
 */
lhgdialog.tips = function( content, time, icon )
{
	return lhgdialog({
		id: 'Tips',
		zIndex: _zIndex(),
		title: false,
		cancel: false,
		min: false,
		max: false,
		fixed: true,
		lock: false,
		resize: false,
		icon: icon || "i.png"
	})
	.content('<div style="padding: 0 1em;">' + content + '</div>')
	.time(time || 1.5);
};

})( window.jQuery||window.lhgcore, this.lhgdialog );