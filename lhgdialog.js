/*!
 * lhgcore Dialog Plugin v4.0.0
 * Date : 2011-11-04 10:16:11
 * Copyright (c) 2009 - 2011 By Li Hui Gang
 */

;(function( $, window, undefined ){


var _clone = function( object )
{
    function f(){};
	f.prototype = object;
	return new f;
},

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

_skin = _getArgs('skin') || 'default',

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

// 开启IE6 CSS背景图片缓存
try{
	_doc.execCommand( 'BackgroundImageCache', false, true );
}catch(e){};

$('head',_doc).append( '<link href="' + _path + 'skins/' + _skin + '.css" rel="stylesheet" type="text/css"/>' );

var lhgdialog = function( config )
{
	config = config || {};
	
	return _clone(lhgdialog.fn).init( config );
};

lhgdialog.fn =
{
    init: function( config )
	{
	    var S = this;
		
		S.config = config;
		S.DOM = DOM = S.DOM || S._getDOM();
		
		DOM.wrap.addClass( config.skin );
		DOM.close.
		
		
		return this;
	},
	
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

// 窗口默认配置
lhgdialog.setting =
{
    skin: ''
};

window.lhgdialog = $.dialog = $.lhgdialog = lhgdialog;

})( window.jQuery||window.lhgcore, this );