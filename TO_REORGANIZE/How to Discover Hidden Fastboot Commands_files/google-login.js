jQuery("#gplus-button, #google_login").click(function(e)
{e.preventDefault();var url=jQuery(this).attr("href");function PopupCenter(url,title,w,h){var dualScreenLeft=window.screenLeft!=undefined?window.screenLeft:screen.left;var dualScreenTop=window.screenTop!=undefined?window.screenTop:screen.top;var width=window.innerWidth?window.innerWidth:document.documentElement.clientWidth?document.documentElement.clientWidth:screen.width;var height=window.innerHeight?window.innerHeight:document.documentElement.clientHeight?document.documentElement.clientHeight:screen.height;var left=((width/2)-(w/2))+dualScreenLeft;var top=((height/2)-(h/2))+dualScreenTop;var newWindow=window.open(url,title,"scrollbars=yes, width="+w+", height="+h+", top="+top+", left="+left);if(window.focus){newWindow.focus();}
return newWindow}
var login_window=PopupCenter(url,"Google Login",700,500);var timer=setInterval(function()
{if(login_window.closed)
{clearInterval(timer);window.location="/?nocache=1";}},1000);});