function ajaxPost(url,parameter,successCallBack){
    debugger
    $.ajax({
        type: "post",
        url: url,
        data:JSON.stringify(parameter),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            successCallBack(response);
        },error:function(xhr){
            alert(xhr.responseText);
        }
    });
}