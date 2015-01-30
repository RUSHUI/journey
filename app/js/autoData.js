(function($) {
    var callbacks = {};
    var pageReady = function() {};
    var parse = function(temp) { //返回当前data-autodata中的语句块
        var str = temp.replace(/<\!--/g, "").replace(/-->/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "'");
        var fn = "var out='';",
            b = str.split(/<%|%>/g);
        for (i = 0; i < b.length; i++) {
            var e = b[i],
                index = i,
                q = "";
            for (var t = 0; t < e.length; t++) {
                if (e[t] !== "\r" && e[t] !== "\n") {
                    q += e[t];
                }
            }
            e = q.replace(/(^\s*)|(\s*$)/g, "").replace(/"/g, '\\"');
            index % 2 !== 0 ? (/^=.*;/g.test(e) ? (fn += "out+" + e) : (fn += e.replace(/&amp;/g, "&"))) : (fn += "out+=\"" + e + "\";");
        }
        fn += "return out;";
        return fn;
    };
    var compile = function(temp) { //返回一个能执行的js匿名函数代码
        var fn = parse(temp);
        //console.log(fn);
        try {
            return new Function("data", fn);
        } catch (e) {
            console.error("[template error] " + e.message);
            return function() {
                return "";
            };
        }
    };
    var queryObject = function() { //获取所有url上的参数
        var n = window.location.href.split("?"),
            result = {};
        if (n.length > 1) {
            n[1].split("&").forEach(function(a) {
                var c = a.split("=");
                result[c[0]] = c.length > 1 ? c[1] : "";
            });
            return result;
        } else {
            return null;
        }
    };
    $.templateParse = function(temp) {
        return parse(temp);
    };
    $.template = function(temp) {
        return compile(temp);
    };
    $.queryObject = function() {
        return queryObject();
    };
    $.fn.autodata = function(fn, er) {
        return new autodataobject($(this), fn, er);
    };
    var autodataobject = function(dom, fn, er) {
        this.dom = dom;

        //dom.data("autodata")===dom.attr("data-autodata")
        //从这里可以看出data是一个数据存储方式，
        //当下面这句话运行后并没有改变dom的属性data-autodata属性值，仅仅改变了缓存区中的autodata的值
        dom.data("autodata", this);
        this.str = dom.html();
        this.url = dom.attr("data-autodata");
        this.callback = dom.attr("data-callback");
        if (typeof(dom.attr("data-paras")) != "undefined") {
            this.paras = $.parseJSON(dom.attr("data-paras"));
        } else {
            this.paras = {};
        }
        dom.html("<div class='loading'>Loading...</div>");
        this.fn = fn;
        this.render({}, function() {
            fn && fn();
        }, function() {
            er && er();
        });
    };
    autodataobject.prototype.render = function(data, fn, er) {
        var ths = this;
        if (this.url && this.url !== "") {
            $.ajax({
                url: ths.url,
                data: $.extend({}, ths.paras, queryObject(), data),
                dataType: "json",
                type: "post",
                success: function(e) {
                    if (e.code === "1") {
                        if (!ths.template) {
                            ths.template = compile(ths.str);
                        }
                        ths.dom.html(ths.template(e.data));
                        callbacks[ths.callback] && callbacks[ths.callback].call(ths.dom, e);
                        fn && fn();
                    } else {
                        er && er();
                    }
                },
                error: function() {
                    er && er();
                }
            });
        }
    };
    $.AutoCallback = function(type, fn) {
        if (arguments.length === 2) {
            callbacks[type] = fn;
        } else if (arguments.length === 1) {
            for (var i in type) {
                callbacks[i] = type[i];
            }
        }
    };
    $.pageReady = function(fn) {
        pageReady = fn;
    };
    $.fn.autoflip = function(fn, er) {
        new flip($(this), fn, er);
    };
    var flip = function(dom, fn, er) {
        this.dom = dom;
        dom.data("flip", this);
        var c = $.templateParse(dom.html());
        this.temp = new Function("data", "pages", "btns", c);
        this.url = dom.attr("data-autoflip");
        this.pageSize = dom.attr("data-pageSize"); //每页数目
        this.currentPage = 1; //当前页码
        this.totalPage = 1; //总页数
        dom.empty();
        this.gotoPage(1, fn, er);
    };
    flip.prototype.load = function(data, fn, er) {
        var ths = this;
        this.paras = data;
        $.ajax({
            type: "POST",
            url: this.url,
            data: $.extend({}, ths.paras, queryObject(), data),
            dataType: "json",
            success: function(e) {
                if (e.code === "1") {
                    ths.total = e.data.total; //数据总条数
                    ths.rows = e.data.rows;
                    if (ths.total % ths.pageSize === 0) {
                        ths.totalPage = ths.total / ths.pageSize;
                    } else {
                        ths.totalPage = Math.floor(ths.total / ths.pageSize) + 1; //页数
                    }
                    var pages = [], //这个其实是页面上显示的页码数量的数组，在html上体现
                        num = ths.currentPage, //当前页码
                        times = 5;
                    if (ths.currentPage > times) { //若当前页码大于times
                        if (ths.currentPage <= ths.totalPage - times) { //若当前页码小于（总页数-times）
                            //当前页码大于5小于总页码-5
                            for (var i = times; i > 0; i--) { //循环times的
                                var a = num - i;
                                if (a >= 1) {
                                    pages.push({
                                        num: a,
                                        iscurrent: (a === num),
                                        name: a
                                    });
                                }
                            }
                            for (var i = 0; i < times; i++) {
                                var a = num + i;
                                if (a <= ths.totalPage) {
                                    pages.push({
                                        num: a,
                                        iscurrent: (a === num),
                                        name: a
                                    });
                                }
                            }
                        } else {
                            for (var i = 2 * times; i > 0; i--) {
                                var a = ths.totalPage - i + 1;
                                if (a >= 1) {
                                    pages.push({
                                        num: a,
                                        iscurrent: (a === num),
                                        name: a
                                    });
                                }
                            }
                        }
                    } else { //当前页码不大于5
                        for (var i = 0; i < 2 * times; i++) {
                            //循环2*5次,num是当前页码
                            var a = i + 1; //当前页码加循环变量，递增的页码数小于总页码数就pages增加一个
                            if (a <= ths.totalPage) {
                                pages.push({
                                    num: a,
                                    iscurrent: (a === num),
                                    name: a
                                });
                            }
                        }
                    }

                    ths.dom.html(ths.temp(e.data.rows, pages, {
                        prev: "_prev",
                        next: "_next",
                        num: "_num",
                        gopage: "_gopage"
                    }));
                    ths.setPage();
                    fn && fn();
                } else {
                    er && er();
                }
            },
            error: function() {
                er && er();
            }
        });
    };
    flip.prototype.gotoPage = function(num, fn, er) {
        num = parseInt(num);
        if (num > 0 && num <= this.totalPage) {
            this.currentPage = num;
            this.load($.extend(this.paras, {
                page: num,
                pageSize: this.pageSize
            }), fn, er);
        }
    };
    flip.prototype.prevPage = function() {
        var a = this.currentPage - 1;
        this.gotoPage(a);
    };
    flip.prototype.nextPage = function() {
        var a = this.currentPage + 1;
        this.gotoPage(a);
    };
    flip.prototype.setPage = function() {
        var ths = this;
        this.dom.find("._prev").click(function() {
            ths.prevPage();
        });
        this.dom.find("._next").click(function() {
            ths.nextPage();
        });
        this.dom.find("*[num]").each(function() {
            $(this).click(function() {
                var a = $(this).attr("num");
                ths.gotoPage(a);
            });
        });
        this.dom.find("._gopage").click(function() {
            var k = ths.dom.find("._num").val();
            if (/^[0-9]*$/.test(k)) {
                ths.gotoPage(k);
            }
        });
    };
    $().ready(function() {
        var a = [],
            b = 0;
        $("*[data-autodata]").each(function() {
            //            a.push("a");//数组元素加1
            b++;
            $(this).autodata(function() {
                //                a.pop();//执行一个方法数组元素减1
                b--;
                if (b === 0) {
                    pageReady && pageReady.call($("body"));
                }
            }, function() {
                //                a.pop();
                b--;
                if (b === 0) {
                    pageReady && pageReady.call($("body"));
                }
            });
        });
        $("*[data-autoflip]").each(function() {
            b++;
            $(this).autoflip(function() {
                //                a.pop();
                b--;
                if (b === 0) {
                    pageReady && pageReady.call($("body"));
                }
            }, function() {
                //                a.pop();
                b--;
                if (b === 0) {
                    pageReady && pageReady.call($("body"));
                }
            });
        });
        if (b === 0) {
            pageReady && pageReady.call($("body"));
        }
    });
})(jQuery);
