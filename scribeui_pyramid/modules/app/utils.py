# -*- coding: utf-8 -*-

import zipfile
from tempfile import mkdtemp
from shutil import rmtree

import random
import string

class Bunch(dict):
    def __init__(self, **kw):
        dict.__init__(self, kw)
        self.__dict__ = self


def extract_zip(input_file):
    """Extract a zip file into a system temporary directory"""

    try:
        tmp_dir = mkdtemp()
        zip_file = tmp_dir+'/tmp.zip'
    except:
        raise Exception("Erreur lors de la création du répertoire temporaire.")

    # TODO: use zipfile.ZipFile with a file-like object
    # rather than writing it..
    try:
        output_file = open(zip_file, 'wb')
        input_file.seek(0)
        while True:
            data = input_file.read(2 << 16)
            if not data:
                break
            output_file.write(data)
        output_file.close()

        f = zipfile.ZipFile(zip_file, 'r')
        f.extractall(tmp_dir)
    except:
        rmtree(tmp_dir)
        raise Exception("Impossible d'ouvrir ce fichier ZIP")

    return tmp_dir


def random_str(n):
	return "".join(random.choice(string.ascii_lowercase) for x in xrange(n))


