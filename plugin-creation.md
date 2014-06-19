---
title: ScribeUI - Plugin Creation Tutorial
layout: default
---

**DEPRECATION NOTICE: The following tutorial is only valid for ScribeUI versions earlier than v1.0. ScribeUI 1.0 plugin tutorial will [be added shortly.](https://github.com/mapgears/scribeui/issues/98)**

#Plugin Creation

Creating plugins in ScribeUI is easy, this page should help understand how to create a new functionnality. 

*Plugin creation requires ScribeUI v0.4 or higher.*

##Getting started

Let's create a small Hello World plugins with a few basic functionalities. 

All plugins should have their own individual folder in the application/plugins directory. For our plugin, let's create a directory named HelloWorld. Inside that folder, you must create a file named \__init__.py

This file will be imported as a module in the ScribeUI application. All the python files you wish to be available in your plugin should be imported in the \__init__.py 

In our case, next to the \__init__.py file, we will create helloworld.py in which all of our code will go. In your \__init__.py, add the following line:

{% highlight python %}
from helloworld import *
{% endhighlight %}
    
ScribeUI plugins are in fact [Flask Blueprints](http://flask.pocoo.org/docs/blueprints/) loaded dynamically when the application is loaded. As such, helloworld.py need to at least import the following modules: 

{% highlight python %}
from flask import Flask, Blueprint, render_template, url_for
{% endhighlight %}

Then, for ScribeUI to recognize your plugin, you need the following variable, named plugin:

{% highlight python %}
plugin = Blueprint('HelloWorld', __name__, static_folder='static', template_folder='templates')
{% endhighlight %}

The static_folder parameter defines the path relative where all your resources will be located. In that example, all images, javascript or css files are located in the application/plugins/myPlugin/static folder. In the same spirit, all the templates will be located in the application/plugins/myPlugin/templates directory.

*The different values the Blueprint function can accept are more detailed in the [Flask documentation.](http://flask.pocoo.org/docs/blueprints/)*

At this point, application/plugins/HelloWorld directory should look like this: 

    HelloWorld/
        __init__.py
        helloworld.py
        static/
        templates/
            
And at that point, ScribeUI loads your module without any problems. But it doesn't do anything yet. 

##Adding some new Javascript and CSS to ScribeUI

First, we will create a simple javascript file that opens a jquery-ui dialog saying "Hello, World!"

In your static folder, create a js directory, in which you will add a helloworld.js file with the following code:

{% highlight javascript %}
jQuery(function() { $(document).ready(function(){
    var helloDialog = $('<div class="hello-world">Hello, World!</div>');
    $('body').append(helloDialog);
    helloDialog.dialog({                                              
        modal:false
    }).dialog('open');                                                
})});
{% endhighlight %}
                               
This code should be pretty straightforward if you are familiar with JQueryUI.

Next, this javascript file should be included in the scribeui main page. To do that, add the following function to your helloworld.py page:

{% highlight python %}
 def getJsFiles():                       
    return url_for('HelloWorld.static',filename='js/helloworld.js')
{% endhighlight %}

If you ever need to get several js files added, do it by returning an array, like this: [url_for(...),url_for(...)]

When you edit a python file, the changes probably won't be picked up by mod_wsgi immediately. To see your changes, you should restart apache.

Now, if you refresh ScribeUI, you should see a dialog popping with your hello world message. 

If you wish to add some CSS, you do it in a similar way to the javascript, but the function to add to your python file is the following: 

{% highlight python %}
 def getCssFiles():
    return url_for('HelloWorld.static',filename='myCssFile.css')
{% endhighlight %}
        
## Server-side functions

If you need to execute something server-side, the best way to go is to create a flask page with routing, and calling it with ajax. Flask has some nice advanced functionalities in that regards, for example its jinja2 templating system can be really useful. 

We are going to edit our hello world plugin by formatting a bit of json with templates and getting it with javascript.

First, let's create a small json file, named helloworlds.json:

{% highlight json %}
{
    "helloworld": [
        {
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
 
{% endhighlight %}

Now in the templates directory, create this basic template, called helloworld.html:

{% highlight html %}
<table><tr><th>Language</th><th>Message</th></tr>                     
{{ "{% for d in data " }}%}                                                    
    <tr><td>{{ d['language'] }}</td><td>{{ d['message']}}</td></tr>
{{ "{% endfor " }}%}                     
</table>                                               
{% endhighlight %}

And finally, your python file will look like this:

{% highlight python %}
from flask import Flask, Blueprint, render_template, url_for, current_app
import simplejson

plugin = Blueprint('HelloWorld', __name__, static_folder='static', template_folder='templates')

def getJsFiles():
    return url_for('HelloWorld.static',filename='js/helloworld.js')

@plugin.route('/')
def printHelloWorld():
    data = simplejson.loads('helloworlds.json')
    return render_template('helloworld.html', data=data['helloworld'])
{% endhighlight %}


The @plugin.route function indicate the path that the appliation will use to access the function.  The render_template function defines which template to render, along with defining the data variable, which is then available to the template.

You should be able to access this page from your browser after restarting apache, the path should look like this:

    http://localhost/ScribeUI/plugins/HelloWorld/
    
And the table should appear. All plugins routes are prefixed with plugins/pluginname.

Now, let's edit our javascript script to show the template in our popup:

{% highlight javascript %}
jQuery(function() { $(document).ready(function(){
        $.ajax({url:"plugins/HelloWorld/",success:function(result){
                var helloDialog = $('<div class="hello-world">'+result+'</div>');
                $('body').append(helloDialog);
                helloDialog.dialog({
                        modal:false
                }).dialog('open');
        }});
})});
{% endhighlight %}

And now you should see your popup appear when you launch ScribeUI! 

