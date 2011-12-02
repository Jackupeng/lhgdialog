/**
 * notice 右下角通知扩展
 * @param {options} 独立配置
 * 注意：由于notice通知扩展使用了animate动画功能，lhgcore.js简化了该功能，如使用此扩展，请使用jQuery最新版本。
 */
(function( $, lhgdialog ){
	lhgdialog.notice = function( options )
	{
		var opts = options || {},
			api, aConfig, hide, wrap, top,
			duration = 800;
		
		var config = {
			id: 'Notice',
			left: '100%',
			top: '100%',
			fixed: true,
			drag: false,
			resize: false,
			lock: false,
			init: function(here){
				api = this;
				aConfig = api.config;
				wrap = api.DOM.wrap;
				top = parseInt(wrap[0].style.top);
				hide = top + wrap[0].offsetHeight;
				
				wrap.css('top', hide + 'px')
				.animate({top: top + 'px'}, duration, function(){
					opts.init && opts.init.call(api, here);
				});
			},
			close: function(here){
				wrap.animate({top: hide + 'px'}, duration, function(){
					opts.close && opts.close.call(this, here);
					aConfig.close = $.noop;
					api.close();
				});
				
				return false;
			}
		};
		
		for(var i in opts)
		{
			if( config[i] === undefined ) config[i] = opts[i];
		}
		
		return lhgdialog( config );
	};
	
	
})( window.jQuery||window.lhgcore, this.lhgdialog );