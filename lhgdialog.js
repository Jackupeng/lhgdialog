/*!
 * lhgcore Dialog Plugin v4.0.0
 * Date : 2011-11-04 10:16:11
 * Copyright (c) 2009 - 2011 By Li Hui Gang
 */

;(function( $, window, undefined ){

/*!
 * 克隆对象函数
 * @param	{Object}
 * @return  {Object} 此对象为给定对象为原型对象的空对象
 */
var _clone = function( object )
{
    function f(){};
	f.prototype = object;
	return new f;
},

/*!
 * _path 取的组件文件lhgdialog.js所在的路径
 * _args 取的是文件后的url参数组，如：lhgdialog.js?self=true&skin=aero中的?后面的内容
 */
_args, _path = (function( script, i, me ){
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
	
	me = me.split('?');
	_args = me[1];
	
	return me[0].substr( 0, me[0].lastIndexOf('/') + 1 );
}(document.getElementsByTagName('script'),0),        

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
	    _doc = w['top'].document;
		_doc.getElementsByTagName;
	}catch(e){
	    _doc = w.document; return w;
	}
	
	if( _getArgs('self') === 'true' ||
	    doc.getElementsByTagName('frameset').length > 0 )
	{
	    _doc = w.document; return w;
	}
	
	return w;
})(window);

/*! 开启IE6 CSS背景图片缓存 */
try{
	_doc.execCommand( 'BackgroundImageCache', false, true );
}catch(e){};

/*! 在最顶层页面添加样式文件 */
$('head',_doc).append( '<link href="' + _path + 'skins/' + _skin + '.css" rel="stylesheet" type="text/css"/>' );

$.fn.show = function(){
    return this.css('display','block');
};

$.fn.hide = function()
{
    return this.css('display','none');
};

/*!
 * lhgdialog 入口函数
 * 还有待改进，先使用着
 */
var lhgdialog = function( config )
{
	config = config || {};
	
	if( typeof config === 'string' || config.nodeType === 1 )
	{
	    // if( /^url:/.test( config ) )
		    // _url = config.split('url:')[1];
		
		config = { content: config, fixed: !_isMobile };
	}
	
	var setting = lhgdialog.setting;
		
	// 合并默认配置
	for( var i in setting ){
		if( config[i] === undefined ) config[i] = setting[i];
	};
	
	return _clone(lhgdialog.fn)._init( config );
};

lhgdialog.fn =
{
    _init: function( config )
	{
	    var S = this, _url;
		
		S.config = config;
		S.DOM = DOM = S.DOM || S._getDOM();
		
		DOM.wrap.addClass( config.skin );
		DOM.close[config.cancel===false?'show':'hide']();
		
		if( /^url:/.test(config.content) )
		    _url = config.split('url:')[1];
		
		S[config.show?'show':'hide'](true)
		.title( config.title )
		.content( config.content, true );
		
		return this;
	},
	
	content: function( txt )
	{
	
	},
	
	/*! 显示对话框 */
	show: function()
	{
	    this.DOM.wrap.show();
		!arguments[0] && this._lockMaskWrap && this._lockMaskWrap.show();
		return this;
	},
	
	/*! 隐藏对话框 */
	hide: function()
	{
	    this.DOM.wrap.hide();
		!arguments[0] && this._lockMaskWrap && this._lockMaskWrap.hide();
	},
	
	/*! 获取窗口元素 */
	_getDOM: function()
	{
		var wrap = $(lhgdialog.templates).appendTo(_doc.body),
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
	}
	
};

lhgdialog.focus = null;

// 存储窗口实例的对象列表
lhgdialog.list = {};

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
									'<div class="ui_titleBar">' +
										'<div class="ui_title"></div>' +
										'<a class="ui_close" href="javascript:void(0);">' +
											'\xd7' +
										'</a>' +
									'</div>' +
								'</td>' +
							'</tr>' +
							'<tr>' +
								'<td class="ui_icon">' +
									'<div class="ui_iconBg"></div>' +
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
    content: '<div class="ui_loading"><span>loading..</span></div>',
	title: '新窗口',		// 标题. 默认'消息'
	skin: '',
	cancel: null,				// 取消按钮回调函数
	show: true					// 初始化后是否显示对话框
};

window.lhgdialog = $.dialog = $.lhgdialog = lhgdialog;

})( window.jQuery||window.lhgcore, this );