(function ($) {
    $.AutoCallback({
        test:function(){
            console.log(this.attr("data-autodata"));
        },
        aa:function(){
            
        }
        
    });
    $.pageReady(function(){
        console.log("==============>>");
    });
})(jQuery);