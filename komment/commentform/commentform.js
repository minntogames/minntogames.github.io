var AjaxObject = false;

if (window.XMLHttpRequest) {
	AjaxObject = new XMLHttpRequest();
} else if (window.ActiveXObject) {
	try {
		AjaxObject = new ActiveXObject("Msxml2.XMLHTTP");
	} catch(e) {
		AjaxObject = new ActiveXObject("Microsoft.XMLHTTP");
	}
}
function getAjaxText(url, obj, func) {
	if (!AjaxObject) return;
	var myDate = new Date;
	if (!url.match(/\?/)) {
		url = url + '?';
	}
	url += '&t='+myDate.getTime();
	AjaxObject.open('GET', url, true);
	AjaxObject.send(null);
	AjaxObject.onreadystatechange=function() {
		if (AjaxObject.readyState==4
			&& AjaxObject.status==200) {
			document.getElementById(obj).innerHTML =
			AjaxObject.responseText;
			if (func) {
				func();
			}
		}
	}
}
function GetFileName(file_url){
	//file_url = file_url.substring(file_url.lastIndexOf("/")+1,file_url.length);
	//file_url = file_url.substring(0,file_url.indexOf("."));
	//file_url = file_url.replace(/\//g, '_');
	
	file_url = file_url.replace(/\//g, '!');
	file_url = file_url.replace(/\./g, '*');
    return file_url;
}
function commentformsubmit() {

	var url = '/commentform/commentform.php?cmd=commentRegist&file='+GetFileName(location.pathname);
		with (document.commentform) {
		url = url + '&name=' + name.value;
		url = url + '&title=' + title.value;
		url = url + '&pw=' + pw.value;
		url = url + '&comment=' + comment.value.replace( /\n/g , "___" ) ;//改行コード対策
		reset();
		getAjaxText(url, 'commentBox');
	}
}
function open_passworddialog(id) {
	document.passwordform.id.value=id;
	document.getElementById('passworddialog').style.display='block';
}
function close_passworddialog() {
	document.getElementById('passworddialog').style.display='none';
}
getAjaxText('/commentform/commentform.php?file='+GetFileName(location.pathname), 'commentBox');
