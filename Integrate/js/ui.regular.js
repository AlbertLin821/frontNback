function registerDropDownList(selector,dataSourceUrl,textField="text",valueFIeld="value",onChange){

    $(selector).kendoDropDownList({
        dataTextField: textField,
        dataValueField: valueFIeld,
        optionLabel: "請選擇",
        change:onChange,
        index: 0,        
        dataSource: {
            schema:{
                data:"data"
            },
            transport: {
                read: {
                    dataType: "json",
                    type:"post",
                    url: dataSourceUrl,
                }
            }
        }
    });
}

function getDropDownList(selector){
    return $(selector).data("kendoDropDownList");
}


function registerDatePicker(selector){
    $(selector).kendoDatePicker({
        format: "yyyy-MM-dd",
        value: new Date(),
        dateInput: true
    });
}

function getDatePicker(selector) {  
    return $(selector).data("kendoDatePicker");
}