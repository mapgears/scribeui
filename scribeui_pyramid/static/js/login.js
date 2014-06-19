jQuery(function() { 
    $('select').chosen();
    
    $("button").button({
        text: true
    });

    $('#btn-create-workspace').on('click', function(){
        openNewWorkspaceDialog();

        return false;
    });

    $('#btn-delete-workspace').on('click', function(){
        openDeleteWorkspaceDialog();

        return false;
    });
});

function openNewWorkspaceDialog(){
    $("#createws-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newws-name").val();
                var password = $("#newws-password").val();

                var data = {
                    name: name,
                }
                if(password && password != ''){
                    data['password'] = password;
                }

                var self = this;

                $.post($API + '/workspaces/new', data, function(response) {
                    if(response.status == 1){
                        var option = $('<option>').val(name).text(name).prop('selected', true);
                        $('select#name').append(option);
                        $('select#name').trigger('chosen:updated');

                        $(self).dialog("close");
                    }
                });

            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function(e) {
            $(this).find('input').val('');
        }
    }).dialog("open");   
}


function openDeleteWorkspaceDialog(){
    var name = $('select#name').val();
    var password = $('#password').val();

    var data = {
        name: name,
    }
    if(password && password != ''){
        data['password'] = password;
    }

    $.post($API + '/workspaces/delete', data, function(response) {
        if(response.status == 1){
            $('select#name').find('option[value="' + name + '"]').remove();
            $('select#name').trigger('chosen:updated');
            $('#password').val('');  
        }
    });
}