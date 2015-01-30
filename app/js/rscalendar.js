(function($) {
    $.fn.rsCalendar = function(config) {
        var ops = {};
        var option = $.extend(ops, config);
        return new Calendar($(this), option);
    };
    var Calendar = function(dom, option) {
        this.dom = dom;
        this.option = option;
        $(dom).addClass("calendar");
        this.init();
    };
    Calendar.prototype = {
        init: function() {
            var ths = this;
            this.activeDay = 1;
            this.format = "yyyy-MM-dd";
            var date = new Date();
            this.Days = ["日", "一", "二", "三", "四", "五", "六"];
            this.Year = date.getFullYear();
            this.Month = date.getMonth() + 1;
            this.Day = date.getDate();
            this.getData(this.formate(date));
        },
        getData: function(dat) {
            dat = dat.replace(/-/g, "/");
            var date = new Date(dat);
            this.Year = date.getFullYear();
            this.Month = date.getMonth() + 1;
            this.Day = date.getDate();
            this.Week = new Date(this.Year, this.Month - 1, 1).getDay();
            var ths = this;
            $.ajax({
                url: "./data/calendar.json",
                //url: "/cpxt_app/act/front/listByMonth.do",
                dataType: "json",
                data: {
                    date: ths.formate(date)
                },
                type: "post",
                success: function(e) {
                    if (e.code === "1") {
                        ths.data = e.data;
                        ths.createpanel(e.data)
                    }
                }
            });
        },
        formate: function(da) {
            var year = da.getFullYear(),
                month = da.getMonth() + 1,
                day = da.getDate();
            var format = this.format;
            format = format.replace("yyyy", year)
                .replace("MM", (month.toString().length <= 1 ? "0" + month : month))
                .replace("dd", (day.toString().length <= 1 ? "0" + day : day))
                .replace("hh:mm:ss", "");
            return format;
        },
        createpanel: function(data) {
            if (this.dom.children) {
                this.dom.empty();
            }
            var date = new Date();
            this.activeDay = -1;
            this.day = date.getDate();
            this.month = date.getMonth() + 1;
            this.year = date.getFullYear();
            var b = '<div class="news">' +
                '<div class="news-sound"></div><div class="news-text">定时推出新消息</div></div>' +
                '<div class="header">' +
                '<div class="header-dpre"><<</div><div class="header-pre"><</div>' +
                '<div class="header-center"><div class="y">' + this.Year + '</div>&nbsp;年&nbsp;' +
                '<div class="m">' + this.Month + '</div>&nbsp;月</div><div class="header-next">>' +
                '</div><div class="header-dnext">>></div></div><div class="body-header">';
            for (var j = 0; j < 7; j++) {
                b += '<div class="body-header-btn">' + this.Days[j] + '</div>';
            }
            b += '</div>'; //currentday,ownnews,num
            b += '<div class="body">';

            var curMaxDay = new Date(this.Year, this.Month, 0).getDate();
            window.curcontent = [];
            var day = 1;
            for (var i = 0; i < 6; i++) {
                b += '<div class="row">';
                for (var j = 0; j < this.Days.length; j++) {
                    //<div class="col opct currentday ownnews"><span>2</span><div class="num">3</div></div>
                    if (this.Year < this.year || this.Year == this.year && this.Month < this.month || this.Year == this.year && this.Month == this.month && day < this.day) { //小于当前day
                        b += '<div class="col opct ';
                    } else if (this.Year == this.year && this.Month == this.month && day == this.day) {
                        b += '<div class="col currentday ';
                        this.Day = this.day;
                    } else {
                        b += '<div class="col ';
                    }
                    var find = 0,
                        count = 0,
                        content = [];
                    for (var k = 0; k < data.length; k++) {
                        if (data[k].day == day) {
                            find = 1;
                            count = data[k].count;
                            content = data[k].content;
                            if (this.Year == this.year && this.Month == this.month && day == this.day) {
                                for (var t in data[k].content) {
                                    window.curcontent.push(data[k].content[t]);
                                }
                            }
                            break;
                        }
                    }
                    if (find == 1) {
                        b += 'ownnews">';
                    } else {
                        b += '">';
                    }
                    b += '<span>';
                    if (i == 0 && j < this.Week || day > curMaxDay) {
                        b += "&nbsp;";
                    } else {
                        b += day;
                        day++;
                    }
                    b += '</span>';

                    if (find == 1) {
                        b += '<div class="num" data-content=' + JSON.stringify(content) + '>' + count + '</div>';
                    }
                    b += '</div>';
                }
                b += '</div>';
            }
            b += '</div><div class="footer"><div class="curdate">';
            if (this.Year == this.year && this.Month == this.month && this.Day != this.day) {
                b += this.activeDay;
            } else if (this.Year == this.year && this.Month == this.month && this.Day == this.day) {
                b += "今天";
            } else {
                b += "&nbsp;";
            }
            b += '</div>';

            b += '<div class="news-info">';
            if (window.curcontent.length == 0) {
                b += '</div></div>';
            } else {
                for (var i = 0; i < window.curcontent.length; i++) {
                    /*if(i>=2){
                        b+='<div class="info"  index="'+(i+1)+'" style="display:none;">'+(i+1)+"."+window.curcontent[i].title+'</div>';
                    }else{
                        b+='<div class="info"  index="'+(i+1)+'">'+(i+1)+"."+window.curcontent[i].title+'</div>';
                    }*/
                    b += '<div class="info" >' + (i + 1) + "." + window.curcontent[i].title + '</div>';
                }
            }

            var ths = this;
            this.box = $(b).appendTo(this.dom);
            this.box.find(".col").each(function() {
                if ($(this).hasClass("currentday")) {
                    ths.activeDay = $(this).find("span").html();
                    return false;
                }
            });
            this.box.find(".col span").each(function() {
                var html = $(this).html();
                if (html == ths.activeDay) {
                    $(this.parentNode).addClass("active");
                    return false;
                }
            });
            this.box.find(".header-pre").click(function(e) {
                ths.prvemonth();
            });
            this.box.find(".header-next").click(function(e) {
                ths.nextmonth();
            });
            this.box.find(".header-dnext").click(function() {
                ths.nextyear();
            });
            this.box.find(".header-dpre").click(function() {
                ths.prevyear();
            });

            if (this.dom.find(".news-info").find(".info").length > 2) {
                window.interval && clearInterval(window.interval);
                window.interval = setInterval(function() {
                    var domEle = $(ths.dom).find(".news-info");

                    var height = domEle.height();
                    var top = domEle.position().top;
                    if (top < (-height + 10)) {
                        top = 70;
                    }
                    domEle.css({
                        top: (top - 5) + "px"
                    });
                }, 200);
            }
            var nodeY = this.dom.find(".y");
            var value = nodeY.html();
            var minY = 2005,
                maxY = 2055;
            var cy = "<ul class='header-list'  style='display:none;'>";
            for (var i = minY; i <= maxY; i++) {
                if (value == i) {
                    cy += "<li index='" + i + "' class='selected'>" + i + "</li>";
                } else {
                    cy += "<li index='" + i + "'>" + i + "</li>";
                }
            }
            cy += "</ul>";
            $(cy).appendTo(nodeY).hover(function() {}, function() {
                $(this).hide();
            });

            nodeY.find("li").click(function() {
                nodeY.find("ul li").removeClass("selected");
                $(this).addClass("selected");
                $(this.parentNode).hide();
                var year = $(this).html();
                var date = new Date(parseInt(year), ths.Month - 1, ths.Day);
                ths.getData(ths.formate(date));
            });
            this.dom.find(".y").click(function() {
                $(this).find(".header-list").show();
                $(ths.dom).find(".m").find(".header-list").hide();
            });

            var nodeM = this.dom.find(".m");
            var value = nodeM.html();
            var minY = 1,
                maxY = 12;
            var cm = "<ul class='header-list' style='display:none;'>";
            for (var i = minY; i <= maxY; i++) {
                if (value == i) {
                    cm += "<li index='" + i + "' class='selected'>" + i + "</li>";
                } else {
                    cm += "<li index='" + i + "'>" + i + "</li>";
                }

            }
            cm += "</ul>";
            $(cm).appendTo(nodeM).hover(function() {}, function() {
                $(this).hide();
            });
            nodeM.find("li").click(function() {
                nodeM.find("ul li").removeClass("selected");
                $(this).addClass("selected");
                $(this.parentNode).hide();
                var month = $(this).html();
                var date = new Date(ths.Year, parseInt(month) - 1, ths.Day);
                ths.getData(ths.formate(date));
            });
            this.dom.find(".m").click(function() {
                $(this).find(".header-list").show();
                $(ths.dom).find(".y").find(".header-list").hide();
            });

            $(this.dom).find(".y").hover(function() {
                $(this).find("ul").show();
            }, function() {
                $(this).find("ul").hide();
            });
            $(this.dom).find(".m").hover(function() {
                $(this).find("ul").show();
            }, function() {
                $(this).find("ul").hide();
            });

            this.dom.find(".news-info").hover(function() {
                window.interval && clearInterval(window.interval);
            }, function() {
                if ($(this).find(".info").length > 2) {
                    window.interval && clearInterval(window.interval);
                    window.interval = setInterval(function() {
                        var domEle = $(ths.dom).find(".news-info");

                        var height = domEle.height();
                        var top = domEle.position().top;
                        if (top < (-height + 10)) {
                            top = 70;
                        }
                        domEle.css({
                            top: (top - 5) + "px"
                        });
                    }, 200);
                }
            });
            this.btns = [];
            this.dom.find(".body").find(".row").each(function() {
                var c = [];
                $(this).find(".col").each(function() {
                    c.push($(this));
                    $(this).click(function(e) {
                        $(".body").find(".row").find(".col").removeClass("active");
                        $(this).addClass("active");
                        var day = $(this).find("span").html();
                        var footer = $(ths.dom).find(".footer");
                        if (day == ths.Day) {
                            day = "今天";
                        } else if (day == "&nbsp;") {
                            return;
                        }
                        footer.find(".curdate").html(day);
                        window.interval && clearInterval(window.interval);
                        if ($(this).find(".num").length == 0) {
                            $(".news-info").empty();
                            return;
                        }
                        var newslist = JSON.parse($(this).find(".num").attr("data-content"));
                        footer.find(".news-info").empty().css({
                            top: "10px"
                        });
                        var str = "";
                        for (var i = 0; i < newslist.length; i++) {
                            str += '<div class="info">' + (i + 1) + '.' + newslist[i].title + '</div>';
                        }
                        $(str).appendTo(footer.find(".news-info"));
                        if (footer.find(".news-info").find(".info").length > 2) {
                            window.interval && clearInterval(window.interval);
                            window.interval = setInterval(function() {
                                var domEle = $(ths.dom).find(".news-info");

                                var height = domEle.height();
                                var top = domEle.position().top;
                                if (top < (-height + 10)) {
                                    top = 70;
                                }
                                domEle.css({
                                    top: (top - 5) + "px"
                                });
                            }, 200);
                        }
                    });
                });
                ths.btns.push(c);
            });
        },
        prvemonth: function() {
            var d = new Date(this.Year, this.Month - 2, 1);
            this.getData(this.formate(d));
        },
        nextmonth: function() {
            var d = new Date(this.Year, this.Month, 1);
            this.getData(this.formate(d));
        },
        nextyear: function() {
            var d = new Date(this.Year + 1, this.Month - 1, 1);
            this.getData(this.formate(d));
        },
        prevyear: function() {
            var d = new Date(this.Year - 1, this.Month - 1, 1);
            this.getData(this.formate(d));
        }
    }
})($);
