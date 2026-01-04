var areaOption={
    "query":"q",
    "detail":"d"
}

var apiRootUrl="https://localhost:7246/api/";
var state="";

var stateOption={
    "add":"add",
    "update":"update"
}

var defauleBookStatusId="A";

$(function () {
    
    registerRegularComponent();

    var validator = $("#book_detail_area").kendoValidator({
        rules:{
            //日期必填驗證
            dateCheckRule: function(input){
                if (input.is(".date_picker")) {
                    var selector=$("#"+$(input).prop("id"));
                    return selector.data("kendoDatePicker").value();
                }
                return true;
            }
        },
        messages: { 
            //日期驗證訊息
            dateCheckRule: function(input){ return input.attr("data-message_prefix")+"格式有誤";}
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
        
        var grid=getBooGrid();
        grid.dataSource.read();
    });

    $("#btn_clear").click(function (e) {
        e.preventDefault();

        clear(areaOption.query);
        //TODO: 清空後重新查詢
    });

    $("#btn-save").click(function (e) {
        e.preventDefault();
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
                        //TODO: 補齊傳入參數
                        "BookClassId":"",
                        "BookKeeperId":"",
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
    var selectedValue = "DB";

    if(selectedValue===""){
        $("#book_image_d").attr("src", "image/optional.jpg");
    }else{
        $("#book_image_d").attr("src", "image/" + selectedValue + ".jpg");
    }
}

/**
 * 當 BookWindow 關閉後要處理的作業
 */
function onBookWindowClose() {
    //清空表單內容
    clear(areaOption.detail);
}

function addBook() { 

    var book = {
        //TODO: 補齊欄位值
        "BookName": $("#book_name_d").val(),
        "BookClassId": "",
        "BookClassName": "",
        "BookBoughtDate": $("#book_bought_date_d").val(),
        "BookStatusId": $("#book_status_d").data("kendoDropDownList").value(),
        "BookStatusName": "",
        "BookKeeperId": "",
        "BookKeeperCname": "",
        "BookKeeperEname": "",
        "BookAuthor": $("#book_author_d").val(),
        "BookPublisher": $("#book_publisher_d").val(),
        "BookNote": $("#book_note_d").val()
    }

    $.ajax({
        type: "post",
        url: apiRootUrl+"bookmaintain/addbook",
        data: JSON.stringify(book),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            alert("新增成功");
            $("#book_detail_area").data("kendoWindow").close();
        }
    });
    
 }

function updateBook(bookId){
    
    //TODO: 取得畫面上相關書籍資料
    var book={
        "":""
    }
   
 }

function deleteBook(e) {
    e.preventDefault();
    var grid = getBooGrid();
    var row = grid.dataItem(e.target.closest("tr"));

    if (confirm("確定刪除")) {
        
        $.ajax({
            type: "post",
            url: apiRootUrl+"bookmaintain/deletebook",
            data: JSON.stringify(row.bookId),
            contentType: "application/json",
            dataType: "json",
            success: function (response) {
                if(!response.Status){
                    alert(response.message);
                }else{
                    grid.dataSource.read();
                    alert("刪除成功");
                }
            }
        });
    }
}

/**
 * 顯示圖書明細-for 修改
 * @param {*} e 
 */
function showBookForUpdate(e) {
    e.preventDefault();

    state=stateOption.update;
    $("#book_detail_area").data("kendoWindow").title("修改書籍");
    //顯示存檔按鈕
    $("#btn-save").css("display","");

    //取得點選該筆的 bookId
    var grid = getBooGrid();
    var bookId = grid.dataItem(e.target.closest("tr")).bookId;

    //設定畫面唯讀與否
    enableBookDetail(true);

    //綁定資料
    bindBook(bookId);
    
    //設定借閱狀態與借閱人關聯
    setStatusKeepRelation();

    //開啟 Window
    $("#book_detail_area").data("kendoWindow").open();
}

/**
 * 顯示圖書明細-for 明細(點選Grid書名超連結)
 * @param {*} e 
 */
function showBookForDetail(e,bookId) {
    e.preventDefault();

    state=stateOption.update;
    $("#book_detail_area").data("kendoWindow").title("書籍明細");

    //隱藏存檔按鈕
    $("#btn-save").css("display","none");

    //取得點選該筆的 bookId
    var grid = getBooGrid();
    var bookId = grid.dataItem(e.target.closest("tr")).bookId;
    
    //綁定資料
    bindBook(bookId);
    
    onClassChange();

    //設定借閱狀態與借閱人關聯
    setStatusKeepRelation();

    //設定畫面唯讀與否
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
function bindBook(bookId){

    $.ajax({
        type: "post",
        url: apiRootUrl+"bookmaintain/loadbook",
        data:JSON.stringify(bookId),
        contentType: "application/json",
        dataType: "json",
        success: function (response) {
            var book=response.data;
            //TODO: 補齊要綁的資料
            $("#book_id_d").val(book.bookId);
            $("#book_name_d").val(book.bookName);

            $("#book_status_d").data("kendoDropDownList").value(book.bookStatusId);

            onClassChange();
        },error:function(xhr){
            alert(xhr.responseText);
        }
    });    


}

function showBookLendRecord(e) {
    e.preventDefault();
    
    var grid = getBooGrid();
    var row = grid.dataItem(e.target.closest("tr"));

    //row.bookId
    //TODO: 完成發 AJAX 和處理後續動作
    $.ajax({
        type: "method",
        url: "url",
        data: "data",
        dataType: "dataType",
        success: function (response) {
            //$("#book_record_area").data("kendoWindow").title(bookName+"借閱紀錄").open();
        }
    });    
}

function clear(area) {
    //TODO:補齊要清空的欄位
    switch (area) {
        case "q":
            $("#book_name_q").val("");
            $("#book_status_q").data("kendoDropDownList").select(0);
            break;
    
        case "d":
            $("#book_name_d").val("");
            $("#book_author_d").val("");
            $("#book_publisher_d").val("");
            $("#book_note_d").val("");
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

            if(bookStatusId=="A" || bookStatusId=="U"){
                $("#book_keeper_d").prop('required',false);

                $("#book_detail_area").data("kendoValidator").validateInput($("#book_keeper_d"));

                $("#book_keeper_d_label").removeClass("required");
                
            }else{
                $("#book_keeper_d").prop('required',true);
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
        }
    });
    //TODO: 其他的下拉選單

    $("#book_bought_date_d").kendoDatePicker({
        format: "yyyy-MM-dd",
        value: new Date(),
        dateInput: true
    });
}

/**
 * 
 * @returns 取得畫面上的 book grid
 */
function getBooGrid(){
    return $("#book_grid").data("kendoGrid");
}