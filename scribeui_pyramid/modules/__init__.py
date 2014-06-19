# -*- coding: utf-8 -*-
def includeme(config):
    config.include('.app')
    config.include('.api')
    config.include('.auth')
    config.include('.workspaces')
    config.include('.maps')
    config.include('.webui')
    config.include('.plugins')
    config.include('.main')
