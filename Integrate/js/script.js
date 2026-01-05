/**
 * 區域選項常數
 */
var areaOption = {
    "query": "q",
    "detail": "d"
}

/**
 * API 根路徑
 */
var apiRootUrl = "http://localhost:5191/api/";

/**
 * 目前操作狀態
 */
var state = "";

/**
 * 狀態選項常數
 */
var stateOption = {
    "add": "add",
    "update": "update"
}

/**
 * 預設書籍狀態 ID
 */
var defauleBookStatusId = "A";

/**
 * 書籍狀態常數
 */
var BOOK_STATUS = {
    AVAILABLE: "A",           // 可以借出
    UNAVAILABLE: "U",          // 不可借出
    BORROWED: "B",             // 已借出
    BORROWED_UNCLAIMED: "C"    // 已借出(未領)
};

/**
 * 定義現有圖片檔案的類別 ID 列表（不含 .jpg 副檔名）
 */
var availableImageClasses = ["BK", "DB", "LG", "LR", "MG", "MK", "NW", "OS", "OT", "SC", "SECD", "TRCD"];

/**
 * 將日期物件格式化為 YYYY-MM-DD 字串格式
 * @param {Date} date - 日期物件
 * @returns {string} 格式化後的日期字串，若日期為空則回傳空字串
 */
function formatDateToString(date) {
    if (!date) {
        return "";
    }
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + "-" + month + "-" + day;
}

/**
 * 檢查 API 回應的狀態是否成功
 * 支援大小寫不敏感的 Status 檢查（ASP.NET Core 預設使用 camelCase）
 * @param {object} response - API 回應物件
 * @returns {boolean} 是否成功
 */
function isResponseSuccess(response) {
    return response && (response.Status === true || response.status === true);
}

/**
 * 取得 API 回應的訊息
 * 支援大小寫不敏感的 Message 檢查
 * @param {object} response - API 回應物件
 * @returns {string} 訊息內容
 */
function getResponseMessage(response) {
    if (!response) {
        return "";
    }
    return response.Message || response.message || "";
}

/**
 * 統一處理 AJAX 錯誤回應
 * @param {object} xhr - XMLHttpRequest 物件
 * @param {string} operation - 操作名稱
 * @returns {string} 錯誤訊息字串
 */
function handleAjaxError(xhr, operation) {
    var errorMsg = operation + "失敗：";
    try {
        // 先嘗試解析 responseJSON（jQuery 自動解析的）
        var response = xhr.responseJSON;
        
        // 如果 responseJSON 不存在，嘗試解析 responseText
        if (!response && xhr.responseText) {
            try {
                response = JSON.parse(xhr.responseText);
            } catch (e) {
                console.error("無法解析 responseText:", e);
            }
        }
        
        if (response) {
            // 檢查是否是我們的 ApiResult 格式
            if (response.Message) {
                errorMsg += response.Message;
            } else if (response.status === false && response.message) {
                errorMsg += response.message;
            } else if (response.errors) {
                var errors = [];
                $.each(response.errors, function (key, value) {
                    if (Array.isArray(value)) {
                        errors.push(key + ": " + value.join(", "));
                    } else {
                        errors.push(key + ": " + value);
                    }
                });
                errorMsg += errors.join("\n");
            } else if (response.title) {
                errorMsg += response.title;
                if (response.errors) {
                    var errors = [];
                    $.each(response.errors, function (key, value) {
                        if (Array.isArray(value)) {
                            errors.push(key + ": " + value.join(", "));
                        } else {
                            errors.push(key + ": " + value);
                        }
                    });
                    errorMsg += "\n" + errors.join("\n");
                }
            } else {
                errorMsg += JSON.stringify(response);
            }
        } else if (xhr.responseText) {
            errorMsg += xhr.responseText.substring(0, 200); // 限制長度
        } else {
            errorMsg += xhr.statusText || "伺服器錯誤 (狀態碼: " + xhr.status + ")";
        }
    } catch (e) {
        errorMsg += "解析錯誤訊息時發生錯誤: " + e.message;
        console.error("錯誤處理例外:", e);
    }
    return errorMsg;
}

$(function () {
    
    registerRegularComponent();

    var validator = $("#book_detail_area").kendoValidator({
        rules:{
            //日期必填驗證
            dateCheckRule: function(input){
                if (input.is(".date_picker")) {
                    var selector=$("#"+$(input).prop("id"));
                    var datePicker = selector.data("kendoDatePicker");
                    if (datePicker) {
                        return datePicker.value() != null;
                    }
                }
                return true;
            },
            //日期不能超過今天驗證
            dateMaxRule: function(input){
                if (input.is(".date_picker") && input.attr("data-date-max-rule") === "true") {
                    var selector=$("#"+$(input).prop("id"));
                    var datePicker = selector.data("kendoDatePicker");
                    if (datePicker) {
                        var selectedDate = datePicker.value();
                        if (selectedDate) {
                            var today = new Date();
                            today.setHours(23, 59, 59, 999); // 設定為今天的結束時間
                            // 比較日期（忽略時間）
                            selectedDate.setHours(0, 0, 0, 0);
                            today.setHours(0, 0, 0, 0);
                            var isValid = selectedDate <= today;
                            // 如果驗證失敗，顯示彈窗提示
                            if (!isValid) {
                                var prefix = input.attr("data-message_prefix") || "日期";
                                alert(prefix + "不能超過今天");
                            }
                            return isValid;
                        }
                    }
                }
                return true;
            },
            //借閱人驗證（根據借閱狀態決定是否必填）
            bookKeeperRule: function(input){
                if (input.is("#book_keeper_d") || input.attr("data-book-keeper-rule") === "true") {
                    // 只有在修改模式下才需要驗證
                    if (state === stateOption.update) {
                        var bookStatusId = $("#book_status_d").data("kendoDropDownList").value();
                        // 如果借閱狀態為「可以借出」或「不可借出」，借閱人可以為空
                        if (bookStatusId == BOOK_STATUS.AVAILABLE || bookStatusId == BOOK_STATUS.UNAVAILABLE) {
                            return true; // 允許為空
                        }
                        // 如果借閱狀態為「已借出」(B) 或「已借出(未領)」(C)，借閱人必填
                        var keeperDropdown = $("#book_keeper_d").data("kendoDropDownList");
                        if (keeperDropdown) {
                            var keeperValue = keeperDropdown.value();
                            return keeperValue != null && keeperValue !== "";
                        }
                    }
                }
                return true;
            }
        },
        messages: { 
            //日期驗證訊息
            dateCheckRule: function(input){ 
                var prefix = input.attr("data-message_prefix") || "日期";
                return prefix + "不可空白";
            },
            dateMaxRule: function(input){ 
                // 返回空字串，因為已經用彈窗顯示錯誤訊息
                return "";
            },
            bookKeeperRule: function(input){ 
                return "借閱人不可空白";
            }
          }
        }).data("kendoValidator");


    $("#book_detail_area").kendoWindow({
        width: "1200px",
        title: "新增書籍",
        visible: false,
        modal: true,
        actions: [
            "Close"
        ],
        close: onBookWindowClose
    }).data("kendoWindow").center();

    $("#book_record_area").kendoWindow({
        width: "700px",
        title: "借閱紀錄",
        visible: false,
        modal: true,
        actions: [
            "Close"
        ]
    }).data("kendoWindow").center();
    

    $("#btn_add_book").click(function (e) {
        e.preventDefault();
        state=stateOption.add;

        enableBookDetail(true);
        clear(areaOption.detail);
        setStatusKeepRelation(state);

        $("#btn-save").css("display","");        
        $("#book_detail_area").data("kendoWindow").title("新增書籍");
        $("#book_detail_area").data("kendoWindow").open();
    });


    $("#btn_query").click(function (e) {
        e.preventDefault();
        
        var grid = getBookGrid();
        grid.dataSource.read();
    });

    $("#btn_clear").click(function (e) {
        e.preventDefault();

        clear(areaOption.query);
        getBookGrid().dataSource.read();
    });

    $("#btn-save").click(function (e) {
        e.preventDefault();
        
        // 在驗證前，根據借閱狀態動態設定借閱人的必填狀態
        if (state === stateOption.update) {
            var bookStatusId = $("#book_status_d").data("kendoDropDownList").value();
            if (bookStatusId == BOOK_STATUS.AVAILABLE || bookStatusId == BOOK_STATUS.UNAVAILABLE) {
                // 可以借出或不可借出時，移除借閱人的必填驗證
                $("#book_keeper_d").removeAttr("required");
            } else {
                // 已借出或已借出(未領)時，設定借閱人為必填
                $("#book_keeper_d").attr("required", "required");
            }
        }
        
        if (validator.validate()) {
            switch (state) {
                case "add":
                    addBook();
                    break;
                case "update":
                    updateBook($("#book_id_d").val());
                break;
                default:
                    break;
            }
        } else {
            // 隱藏購買日期的錯誤訊息（因為已經用彈窗顯示）
            var dateInput = $("#book_bought_date_d");
            if (dateInput.attr("data-date-max-rule") === "true") {
                // 隱藏所有與購買日期相關的錯誤訊息
                var errorElement = dateInput.closest(".k-widget").find(".k-invalid-msg");
                if (errorElement.length > 0) {
                    errorElement.hide();
                }
                // 也檢查父容器中可能的錯誤訊息
                var parentError = dateInput.parent().find(".k-invalid-msg");
                if (parentError.length > 0) {
                    parentError.hide();
                }
            }
        }        
    });

    $("#book_grid").kendoGrid({
        dataSource: {
            transport: {
                read: {
                  url: apiRootUrl+"bookmaintain/querybook",
                  dataType: "json",
                  type: "post",
                  data: function(){
                    return {
                        "BookName":$("#book_name_q").val(),
                        "BookClassId": $("#book_class_q").data("kendoDropDownList").value() || "",
                        "BookKeeperId": $("#book_keeper_q").data("kendoDropDownList").value() || "",
                        "BookStatusId":$("#book_status_q").data("kendoDropDownList").value()
                    }
                  }
                }
            },
            schema: {
                 model: {
                    fields: {
                        bookId: { type: "int" },
                        bookClassName: { type: "string" },
                        bookName: { type: "string" },
                        bookBoughtDate: { type: "string" },
                        bookStatusName: { type: "string" },
                        bookKeeperCname: { type: "string" }
                    }
                }
            },
            serverPaging: false,
            pageSize: 20,
        },
        height: 550,
        sortable: true,
        pageable: {
            input: true,
            numeric: false
        },
        columns: [
            { field: "bookId", title: "書籍編號", width: "10%" },
            { field: "bookClassName", title: "圖書類別", width: "15%" },
            { field: "bookName", title: "書名", width: "30%" ,
              template: "<a style='cursor:pointer; color:blue' onclick='showBookForDetail(event,#:bookId #)'>#: bookName #</a>"
            },
            { field: "bookBoughtDate", title: "購書日期", width: "15%" },
            { field: "bookStatusName", title: "借閱狀態", width: "15%" },
            { field: "bookKeeperCname", title: "借閱人", width: "15%" },
            { command: { text: "借閱紀錄", click: showBookLendRecord }, title: " ", width: "120px" },
            { command: { text: "修改", click: showBookForUpdate }, title: " ", width: "100px" },
            { command: { text: "刪除", click: deleteBook }, title: " ", width: "100px" }
        ]

    });

    $("#book_record_grid").kendoGrid({
        dataSource: {
            data: [],
            schema: {
                model: {
                    fields: {
                        LendDate: { type: "string" },
                        BookKeeperId: { type: "string" },
                        BookKeeperEname: { type: "string" },
                        BookKeeperCname: { type: "string" }
                    }
                }
            },
            pageSize: 20,
        },
        height: 250,
        sortable: true,
        pageable: {
            input: true,
            numeric: false
        },
        columns: [
            { field: "lendDate", title: "借閱日期", width: "10%" },
            { field: "bookKeeperId", title: "借閱人編號", width: "10%" },
            { field: "bookKeeperEname", title: "借閱人英文姓名", width: "15%" },
            { field: "bookKeeperCname", title: "借閱人中文姓名", width: "15%" },
        ]
    });

})

/**
 * 當圖書類別改變時,置換圖片
 */
function onClassChange() {
    var selectedValue = $("#book_class_d").data("kendoDropDownList").value();

    // 先移除之前的錯誤處理器，避免重複綁定
    $("#book_image_d").off("error");
    
    if(selectedValue==="" || selectedValue==null){
        $("#book_image_d").attr("src", "image/optional.jpg");
    }else{
        // 檢查選擇的類別是否有對應的圖片檔案
        if(availableImageClasses.indexOf(selectedValue) !== -1){
            // 如果圖片存在，直接使用對應的圖片
            var imagePath = "image/" + selectedValue + ".jpg";
            $("#book_image_d").attr("src", imagePath);
        }else{
            // 如果圖片不存在，直接使用 notready.jpg，避免產生 404 錯誤
            $("#book_image_d").attr("src", "image/notready.jpg");
        }
    }
}

/**
 * 當 BookWindow 關閉後要處理的作業
 */
function onBookWindowClose() {
    //清空表單內容
    clear(areaOption.detail);
}

/**
 * 建立書籍資料物件
 * @param {number} bookId - 書籍編號（可選，更新時使用）
 * @returns {object} 書籍資料物件
 */
function buildBookData(bookId) {
    var datePicker = $("#book_bought_date_d").data("kendoDatePicker");
    var boughtDate = datePicker.value();
    var boughtDateStr = formatDateToString(boughtDate);

    var book = {
        "BookName": $("#book_name_d").val(),
        "BookClassId": $("#book_class_d").data("kendoDropDownList").value() || "",
        "BookClassName": "",
        "BookBoughtDate": boughtDateStr,
        "BookStatusId": bookId ? $("#book_status_d").data("kendoDropDownList").value() : defauleBookStatusId,
        "BookStatusName": "",
        "BookKeeperId": bookId ? ($("#book_keeper_d").data("kendoDropDownList").value() || "") : "",
        "BookKeeperCname": "",
        "BookKeeperEname": "",
        "BookAuthor": $("#book_author_d").val(),
        "BookPublisher": $("#book_publisher_d").val(),
        "BookNote": $("#book_note_d").val()
    };

    if (bookId) {
        book.BookId = parseInt(bookId);
    }

    return book;
}

/**
 * 處理書籍操作成功後的動作
 * @param {string} successMessage - 成功訊息
 */
function handleBookOperationSuccess(successMessage) {
    alert(successMessage);
    $("#book_detail_area").data("kendoWindow").close();
    getBookGrid().dataSource.read();
}

/**
 * 新增書籍
 */
function addBook() {
    var book = buildBookData();

    console.log("準備新增書籍，資料：", book);
    
    $.ajax({
        type: "post",
        url: apiRootUrl + "bookmaintain/addbook",
        data: JSON.stringify(book),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            console.log("後端回應：", response);
            if (isResponseSuccess(response)) {
                handleBookOperationSuccess("新增成功");
            } else {
                var message = getResponseMessage(response);
                var errorMsg = message || (response ? JSON.stringify(response) : "未知錯誤（無回應資料）");
                alert("新增失敗：" + errorMsg);
                console.error("新增失敗，回應內容：", response);
            }
        },
        error: function (xhr) {
            console.error("AJAX 錯誤:", xhr);
            var errorMsg = handleAjaxError(xhr, "新增");
            alert(errorMsg);
        }
    });
}

/**
 * 更新書籍
 * @param {number} bookId - 書籍編號
 */
function updateBook(bookId) {
    var book = buildBookData(bookId);

    $.ajax({
        type: "post",
        url: apiRootUrl + "bookmaintain/updatebook",
        data: JSON.stringify(book),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            if (isResponseSuccess(response)) {
                handleBookOperationSuccess("修改成功");
            } else {
                var message = getResponseMessage(response);
                alert("修改失敗：" + (message || "未知錯誤"));
            }
        },
        error: function (xhr) {
            var errorMsg = handleAjaxError(xhr, "修改");
            alert(errorMsg);
        }
    });
}

/**
 * 刪除書籍
 * @param {object} e - 事件物件
 */
function deleteBook(e) {
    e.preventDefault();
    var grid = getBookGrid();
    var row = grid.dataItem(e.target.closest("tr"));

    if (confirm("確定刪除")) {
        $.ajax({
            type: "post",
            url: apiRootUrl + "bookmaintain/deletebook",
            data: JSON.stringify(row.bookId),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                if (isResponseSuccess(response)) {
                    grid.dataSource.read();
                    alert("刪除成功");
                } else {
                    var message = getResponseMessage(response) || "刪除失敗";
                    alert(message);
                }
            },
            error: function (xhr) {
                var errorMsg = handleAjaxError(xhr, "刪除");
                alert(errorMsg);
            }
        });
    }
}

/**
 * 顯示圖書明細-for 修改
 * @param {*} e 
 */
/**
 * 顯示圖書明細-for 修改
 * @param {object} e - 事件物件
 */
function showBookForUpdate(e) {
    e.preventDefault();

    state = stateOption.update;
    $("#book_detail_area").data("kendoWindow").title("修改書籍");
    // 顯示存檔按鈕
    $("#btn-save").css("display", "");

    // 取得點選該筆的 bookId
    var grid = getBookGrid();
    var bookId = grid.dataItem(e.target.closest("tr")).bookId;

    // 設定畫面唯讀與否
    enableBookDetail(true);

    // 綁定資料
    bindBook(bookId);
    
    // 設定借閱狀態與借閱人關聯
    setStatusKeepRelation();

    // 開啟 Window
    $("#book_detail_area").data("kendoWindow").open();
}

/**
 * 顯示圖書明細-for 明細(點選Grid書名超連結)
 * @param {*} e 
 */
/**
 * 顯示圖書明細-for 明細(點選Grid書名超連結)
 * @param {object} e - 事件物件
 * @param {number} bookId - 書籍編號
 */
function showBookForDetail(e, bookId) {
    e.preventDefault();

    state = stateOption.update;
    $("#book_detail_area").data("kendoWindow").title("書籍明細");

    // 隱藏存檔按鈕
    $("#btn-save").css("display", "none");

    // 取得點選該筆的 bookId
    var grid = getBookGrid();
    bookId = grid.dataItem(e.target.closest("tr")).bookId;
    
    // 綁定資料
    bindBook(bookId);
    
    onClassChange();

    // 設定借閱狀態與借閱人關聯
    setStatusKeepRelation();

    // 設定畫面唯讀與否
    enableBookDetail(false);
    $("#book_detail_area").data("kendoWindow").open();
}

/**
 * 設定書籍明細畫面唯讀與否
 * @param {*} enable 
 */
function enableBookDetail(enable) { 

    $("#book_id_d").prop('readonly', !enable);
    $("#book_name_d").prop('readonly', !enable);
    $("#book_author_d").prop('readonly', !enable);
    $("#book_publisher_d").prop('readonly', !enable);
    $("#book_note_d").prop('readonly', !enable);

    if(enable){    
        $("#book_status_d").data("kendoDropDownList").enable(true);
        $("#book_bought_date_d").data("kendoDatePicker").enable(true);
    }else{
        $("#book_status_d").data("kendoDropDownList").readonly();
        $("#book_bought_date_d").data("kendoDatePicker").readonly();
    }
 }

 /**
  * 繫結書及明細畫面資料
  * @param {*} bookId 
  */
/**
 * 繫結書及明細畫面資料
 * @param {number} bookId - 書籍編號
 */
function bindBook(bookId) {
    $.ajax({
        type: "post",
        url: apiRootUrl + "bookmaintain/loadbook",
        data: JSON.stringify(bookId),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            if (isResponseSuccess(response)) {
                var book = response.Data || response.data;
                if (book) {
                    $("#book_id_d").val(book.bookId);
                    $("#book_name_d").val(book.bookName);
                    $("#book_class_d").data("kendoDropDownList").value(book.bookClassId);
                    $("#book_author_d").val(book.bookAuthor);
                    $("#book_publisher_d").val(book.bookPublisher);
                    $("#book_note_d").val(book.bookNote);
                    $("#book_bought_date_d").data("kendoDatePicker").value(new Date(book.bookBoughtDate));
                    $("#book_status_d").data("kendoDropDownList").value(book.bookStatusId);
                    $("#book_keeper_d").data("kendoDropDownList").value(book.bookKeeperId || "");
                    onClassChange();
                }
            } else {
                var message = getResponseMessage(response) || "載入書籍資料失敗";
                alert(message);
            }
        },
        error: function (xhr) {
            var errorMsg = handleAjaxError(xhr, "載入書籍");
            alert(errorMsg);
        }
    });
}

/**
 * 顯示書籍借閱紀錄
 * @param {object} e - 事件物件
 */
function showBookLendRecord(e) {
    e.preventDefault();
    
    var grid = getBookGrid();
    var row = grid.dataItem(e.target.closest("tr"));

    $.ajax({
        type: "post",
        url: apiRootUrl + "bookmaintain/booklendrecord",
        data: JSON.stringify(row.bookId),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            if (isResponseSuccess(response)) {
                var recordData = response.Data || response.data;
                if (recordData) {
                    $("#book_record_grid").data("kendoGrid").dataSource.data(recordData);
                    $("#book_record_area").data("kendoWindow").title(row.bookName + "借閱紀錄").open();
                }
            } else {
                var message = getResponseMessage(response) || "取得借閱紀錄失敗";
                alert(message);
            }
        },
        error: function (xhr) {
            var errorMsg = handleAjaxError(xhr, "取得借閱紀錄");
            alert(errorMsg);
        }
    });
}

function clear(area) {
    switch (area) {
        case "q":
            $("#book_name_q").val("");
            $("#book_status_q").data("kendoDropDownList").select(0);
            $("#book_class_q").data("kendoDropDownList").select(0);
            $("#book_keeper_q").data("kendoDropDownList").select(0);
            break;
    
        case "d":
            $("#book_name_d").val("");
            $("#book_author_d").val("");
            $("#book_publisher_d").val("");
            $("#book_note_d").val("");
            $("#book_class_d").data("kendoDropDownList").select(0);
            $("#book_status_d").data("kendoDropDownList").select(0);
            $("#book_keeper_d").data("kendoDropDownList").select(0);
            $("#book_bought_date_d").data("kendoDatePicker").value(new Date());
            onClassChange();
            //清除驗證訊息
            $("#book_detail_area").kendoValidator().data("kendoValidator").reset();
            break;
        default:
            break;
    }
}
                      
function setStatusKeepRelation() { 
    // TODO: 確認選項關聯呈現方式
    switch (state) {
        case "add":
            $("#book_status_d_col").css("display","none");
            $("#book_keeper_d_col").css("display","none");
        
            $("#book_status_d").prop('required',false);
            $("#book_keeper_d").prop('required',false);            
            break;
        case "update":
            $("#book_status_d_col").css("display","");
            $("#book_keeper_d_col").css("display","");
            $("#book_status_d").prop('required',true);

            var bookStatusId=
                $("#book_status_d").data("kendoDropDownList").value();

            if (bookStatusId == BOOK_STATUS.AVAILABLE || bookStatusId == BOOK_STATUS.UNAVAILABLE) {
                // 可以借出或不可借出時，借閱人不是必填，可以為空白
                $("#book_keeper_d").prop('required', false);
                
                // 清除驗證錯誤訊息
                var validator = $("#book_detail_area").data("kendoValidator");
                if (validator) {
                    validator.validateInput($("#book_keeper_d"));
                }

                // 移除必填標記
                $("#book_keeper_d_label").removeClass("required");
                
            } else {
                // 已借出或已借出(未領)時，借閱人是必填
                $("#book_keeper_d").prop('required', true);
                $("#book_keeper_d_label").addClass("required");
            }
            break;
        default:
            break;
    }
    
 }

 /**
  * 生成畫面上的 Kendo 控制項
  */
function registerRegularComponent(){
    
    $("#book_status_q").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/bookstatus",
                }
            }
        }
    });

    $("#book_status_d").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/bookstatus",
                }
            }
        },
        change: function(e) {
            // 當借閱狀態變更時，更新借閱人的必填狀態
            if (state === stateOption.update) {
                setStatusKeepRelation();
            }
        }
    });
    
    $("#book_class_q").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/bookclass",
                }
            }
        }
    });

    $("#book_class_d").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,
        change: onClassChange,
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/bookclass",
                }
            }
        }
    });

    $("#book_keeper_q").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/member",
                }
            }
        }
    });

    $("#book_keeper_d").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        optionLabel: "請選擇",
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: apiRootUrl+"code/member",
                }
            }
        }
    });

    $("#book_bought_date_d").kendoDatePicker({
        format: "yyyy-MM-dd",
        value: new Date(),
        dateInput: true,
        parseFormats: ["yyyy-MM-dd", "MM/dd/yyyy", "yyyy/MM/dd"]
    });
}

/**
 * 取得畫面上的 book grid
 * @returns {object} Kendo Grid 物件
 */
function getBookGrid() {
    return $("#book_grid").data("kendoGrid");
}