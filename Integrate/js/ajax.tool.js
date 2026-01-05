/**
 * 執行 AJAX POST 請求
 * @param {string} url - 請求的 URL
 * @param {object} parameter - 請求參數
 * @param {function} successCallBack - 成功回呼函數
 */
function ajaxPost(url, parameter, successCallBack) {
    $.ajax({
        type: "post",
        url: url,
        data: JSON.stringify(parameter),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            successCallBack(response);
        },
        error: function (xhr) {
            alert(xhr.responseText);
        }
    });
}