// JavaScript Document
$(document).ready(function() {
  "use strict";
	document.getElementById("defaultLoad").click();
  $(window).scroll(function () {
    if ($(window).scrollTop() > $('#banner').height()) {
      $("#nav_bar").addClass("navbar-fixed");
    }
    if ($(window).scrollTop() <= $('#banner').height()) {
      $("#nav_bar").removeClass("navbar-fixed");
    }
  });
});

function signFunc() {
	var email = document.getElementsByName('Email')[0].value;
	var emailC = document.getElementsByName('EmailC')[0].value;
	var pw = document.getElementsByName('Password')[0].value;
	var pwc = document.getElementsByName('PasswordC')[0].value;
	if (!email.endsWith("@mun.ca")){
		alert("Email is not a @mun.ca email address");
		return false;
	}
	if (email !== emailC){
		alert("Email confirmation field does not match Email field.");
		return false;
	}
	if (pw.length < 8){
		alert("Password must be at least 8 characters in length.");
		return false;
	}
	if (pw !== pwc){
		alert("Password confirmation field does not match Password field.");
		return false;
	}
	return true;
}

function openTab(evt, tabName) {
	"use strict";
	var i, tabcontent, tablink;
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++){
		tabcontent[i].style.display = "none";
	}
	
	tablink = document.getElementsByClassName("tablink");
	for (i = 0; i < tablink.length; i++){
		tablink[i].style.backgroundColor = null;
	}
	document.getElementById(tabName).style.display = "block";
	evt.currentTarget.style.backgroundColor = "maroon";
}