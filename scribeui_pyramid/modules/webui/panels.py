# -*- coding: utf-8 -*-

from pyramid_layout.panel import panel_config


@panel_config(
    name='flash-messages',
    renderer='scribeui_pyramid:modules/webui/templates/ui/flash.jinja2'
)
def flash_messages(context, request):
    #session = request.session
    queues = []
    for q in ('', 'warning', 'error', 'success', 'info'):
        flash = request.session.pop_flash(queue=q)
        if flash:
            queues.append((q, flash))
    return {
        'queues': queues
    }


@panel_config(
    name='navbar',
    renderer='scribeui_pyramid:modules/webui/templates/ui/navbar.jinja2'
)
def navbar(context, request):
    def activate(item):
        item.active = request.current_route_url().startswith(item.url)
        return item
    return {
        'title': request.layout_manager.layout.title,
        'brand_url': request.route_url('home'),
        'nav': [activate(item) for item in request.navbar.items]
    }


@panel_config(
    name='page-actions',
    renderer='scribeui_pyramid:modules/webui/templates/ui/page.jinja2'
)
def page_actions(context, request, actions):
    return {
        'actions': actions
    }


@panel_config(
    name='form-tabs',
    renderer='scribeui_pyramid:modules/webui/templates/forms/tabs.jinja2'
)
def formtabs(context, request, tabs):
    def activate(item):
        item.active = request.current_route_url() == item.url
        return item
    return {
        'tabs': [activate(item) for item in tabs]
    }


@panel_config(
    name='table',
    renderer='scribeui_pyramid:modules/webui/templates/forms/form.list.new.jinja2'
)
def table(context, request, items):
    return {'items': items}
