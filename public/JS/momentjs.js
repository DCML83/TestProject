$(document).ready(function(){
  var now = moment();
$('time').each(function(i,e){
    var time = moment($(e).attr('datetime'));

            $(e).html('<span>' + time.fromNow() + '</span>');

});

$('#permission').change(function(){
  if($('#permission').val() =="specific"){
  $('#id01').css("display","block");
}
});
// console.log("click click click");
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
  console.log("click change");
  $('#id01').css("display","block");

});
});
