
/*
$.post('http://localhost:6543/api/maps/new', {
    name: 'test3',
    type: 'Scribe',
    template: 'NaturalEarth',
    template_workspace: 'default',
    template_workspace_password: 'default',
    description: 'This is my description.'
}, function(response) {
    console.log(response);
});


$.post('http://localhost:6543/api/maps/open/2', {}, function(response) {
    console.log(response);
});

$.post('http://localhost:6543/api/maps/delete/3', {}, function(response) {
    console.log(response);
});

$.post('http://localhost:6543/api/workspace/maps', {
    name: 'default',
    type: 'Scribe'
}, function(response) {
    console.log(response);
});
*/
/*
$.post('http://localhost:6543/api/maps/2/groups/new', {
    name: 'new_group',
}, function(response) {
    console.log(response);
});
*/
/*
$.post('http://localhost:6543/api/maps/2/groups/update', {
    groups:'test1,test3',
    new_groups: 'test1,test3',
    removed_groups: 'test2'
}, function(response) {
    console.log(response);
});

$.post('http://localhost:6543/api/maps/2/save', {
    groups:'test1,test3',
    new_groups: 'test1,test3',
    removed_groups: 'test2'
}, function(response) {
    console.log(response);
});
*/
/*
    var data = JSON.stringify({
        map: 'Mapfile content',
        scales: "Scales",
        variables: 'Variables',
        symbols: 'Symbols',
        fonts: 'Fonts',
        projections: 'Projections',
        readme: 'readme',
        groups: []
    })

    $.ajax({
        url: 'http://localhost:6543/api/maps/2/save',
        type: "POST",
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(response) {
            console.log(response)
        }
    })
*/

$.post('http://localhost:6543/api/maps/configure/2', {
    git_url:'my_git_url',
    description: 'my_new_description'
}, function(response) {
    console.log(response);
});