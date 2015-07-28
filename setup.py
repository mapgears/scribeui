# -*- coding: utf-8 -*-

import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.markdown')).read()

requires = [
    'pyramid==1.4',
    'SQLAlchemy==0.8.0',
    'transaction',
    'pyramid_tm',
    'pyramid_debugtoolbar',
    'pyramid_layout',
    'pyramid_jinja2',
    'zope.sqlalchemy',
    'waitress',
    'wtforms',
    'cryptacular',
    'm2crypto',
    'psycopg2',
    'alembic',
    'fixture==1.5',
    'GeoAlchemy2==0.2'
]

tests_require = [
    'WebTest >= 1.3.1',
]

docs_extras = [
    'Sphinx',
    'docutils',
    'repoze.sphinx.autointerface',
]

testing_extras = tests_require + [
    'nose',
    'coverage',
    'mock',
]

setup(name='scribeui_pyramid',
      version='1.3',
      description='Pyramid Base',
      long_description=README,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pylons",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='Mapgears',
      author_email='cbourget@mapgears.com',
      url='',
      keywords='web pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='scribeui_pyramid',
      install_requires=requires,
      extras_require = {
          'testing':testing_extras,
          'docs':docs_extras,
          },
      tests_require = tests_require,
      entry_points="""\
      [paste.app_factory]
      main = scribeui_pyramid:main
      [console_scripts]
      load_ev_data = scribeui_pyramid.scripts.loaddata:main
      load_ev_muni = scribeui_pyramid.scripts.loadmuni:main
      """,
      )
