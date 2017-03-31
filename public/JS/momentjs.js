$(document).ready(function(){
  var now = moment();
$('time').each(function(i,e){
    var time = moment($(e).attr('datetime'));

            $(e).html('<span>' + time.fromNow() + '</span>');

});
//function to display modal for specific friends permission
$('#permission').change(function(){
  if($('#permission').val() =="specific"){
  $('#id01').css("display","block");
}
});
//
$('#setfriends').click(function(event){
  var checked="";
  $('#friendlist').val("");
$("input[name='options[]']:checked").each(function ()
{
    checked += $(this).val()+ " ";
});
$('#id01').css("display","none");
$('#friendlist').val(function(n, c){
            return c + checked;});
});

$('#myBtn').click(function(event){
  $('#id01').css("display","block");

});
$(function(){
var socket = io().connect();
var length = $('#length').val();
var click = 0;
for(i = 0 ; i < length; i++){
$('#comment_btn'+i).click(function(event){
  var formid = $(this).parent().attr('id');
  var info = {comment:$('#'+formid).children('#comment').val(), post_id:$(this).val(),user_id: $('#user_email').attr('alt')};
  socket.emit('profile_comment', info);
  $('#'+formid).children('#comment').val('');
  click = $(this).attr('alt');
  return false

  });
}
socket.on('profile_comment', function(comment){
console.log(comment);
console.log(click)
var comment_area = $('#comment_area'+click);
comment_area.append($('<p>').text(comment));
});
});
});
