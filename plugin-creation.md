---
title: ScribeUI - Plugin Creation Tutorial
layout: default
---

#Plugin Creation

##Getting started

Let's create a small Hello World plugin with a few basic functionalities. 

All plugins should have their own individual folder in the scribeui\_pyramid/modules/plugins directory. 

Plugins are simply python modules that take advantage of Pyramid's [extensibility](http://docs.pylonsproject.org/docs/pyramid/en/latest/narr/extending.html). 

As such, you first need an **\_\_init__.py** file. In that file, you have to create a function named **includeme** that receives a **config** object. To have your models and views included automatically, your includeme function should look like this:

{% highlight python %}
def includeme(config):
    config.scan('.')
{% endhighlight %}

And at that point, ScribeUI loads your module without any problems. But it doesn't do anything yet. 

##Adding some new Javascript and CSS to ScribeUI

If you wish to include static files, adding the following line to the includeme function will add a folder and its subfolder as a route for the application: 

{% highlight python %}
    config.add_static_view(name='hellostatics', path='static')
{% endhighlight %}

For our example, let's create a simple file with the path scribeui\_pyramid/modules/plugins/static/js/helloworld.js containing a simple jquery-ui dialog as an example:

{% highlight javascript %}
jQuery(function() { $(document).ready(function(){
    var helloDialog = $('<div class="hello-world">Hello, World!</div>');
    $('body').append(helloDialog);
    helloDialog.dialog({                                              
        modal:false
    }).dialog('open');                                                
})});
{% endhighlight %}
                               
This code should be pretty straightforward if you are familiar with jquery-ui.

As ScribeUI is mostly a single page app, if you want css and javascript files to be included directly into the home template, you need to add the  files in a function such this:

{% highlight python %}
def getIncludedFiles():
    return {'css':['hellostatics/css/helloworld.css'], # if you have any css files
            'js': ['hellostatics/js/helloworld.js']}
{% endhighlight %}

The css and js values are arrays so that you may add several javascript and css files to ScribeUI. 

And thus, if you restart scribeui ( make restart for the development install, or restarting apache on a production setup), Hello world! should appear in an alert box. 
        
## Server-side functions

You can easily add models and views to your plugins. Models should be stored in a **models.py** file, and views in **views.py** (or in a folder named views, the mapcache plugin included with ScribeUI is an example of this)

We are going to edit our hello world plugin by formatting a bit of data with templates and getting it with javascript.

First, let's create a view in **views.py**:

{% highlight python %}
from pyramid.view import view_config
from pyramid.renderers import render_to_response

class HelloWorldView(object):
    def __init__(self, request):
        self.request = request

    @view_config(
        route_name='helloworld',
        permission='view'
    )   
    def helloworld(self):
        data = [{
                "language": "English",
                "message": "Helloworld"
                },  
                {   
                "language": "French",
                "message": "Bonjour monde"
                },  
                {   
                "language": "Spanish",
                "message": "Hola mundo"
                }   
            ]   
        return render_to_response('scribeui_pyramid:modules/plugins/HelloWorld/templates/helloworld.jinja2',{"data":data})
{% endhighlight %}

This code names a route named helloworld, renders it to a template, passing it some data. [The templates are using jinja2.](http://jinja.pocoo.org/docs/), served by [Pyramid templating](http://docs.pylonsproject.org/projects/pyramid/en/1.0-branch/narr/templates.html)

Let's create a templates directory, with this basic template, called **helloworld.jinja2**:

{% highlight html %}
<table><tr><th>Language</th><th>Message</th></tr>                     
{{ "{% for d in data " }}%}                                                    
    <tr><td>{{ "{{ d['language'] "}} }}</td><td>{{ "{{d['message']"}}}}</td></tr>
{{ "{% endfor " }}%}                     
</table>              
{% endhighlight %}

Now, we need to add the route to the config. In \_\_init__.py add the following line to the includeme function:

{% highlight python %}
def getIncludedFiles():
   config.add_route('helloworld', '/helloworld')

{% endhighlight %}

After restarting ScribeUI, a table containing the data will be accessible at the /helloworld location. 
    
Now, let's edit our javascript script to show the template in our popup:

{% highlight javascript %}
jQuery(function() { $(document).ready(function(){
        $.ajax({url:"helloworld",success:function(result){
                var helloDialog = $('<div class="hello-world">'+result+'</div>');
                $('body').append(helloDialog);
                helloDialog.dialog({
                        modal:false
                }).dialog('open');
        }});
})});
{% endhighlight %}

And now you should see your popup appear when you launch ScribeUI! 


## Useful links

* [Pyramid documentation](http://docs.pylonsproject.org/en/latest/docs/pyramid.html)
* [Jinja2 Documentation](http://jinja.pocoo.org/docs/)
