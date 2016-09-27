#!/usr/bin/python
"""
deploy.py
"""

__author__ = 'rensholmer'

import sys
import shutil
import os
from subprocess import Popen,PIPE

def meteor_build():
	command = 'meteor build .bioportal --server-only --directory'
	print 'building from source'
	p = Popen(command.split(),stderr=PIPE)
	for line in iter(p.stderr.readline,''):
		print line

def npm_install():
	print 'installing dependencies'
	if os.path.exists('.bioportal/bundle/programs/server/node_modules'):
		shutil.rmtree('.bioportal/bundle/programs/server/node_modules')
	os.mkdir('.bioportal/bundle/programs/server/node_modules')
	command = 'npm install --prefix .bioportal/bundle/programs/server/ .bioportal/bundle/programs/server'
	p = Popen(command.split(),stderr=PIPE)
	for line in iter(p.stderr.readline,''):
		print line.strip()

def main(settings):
	if os.path.exists('.bioportal'):
		print 'overwriting existing build'
		shutil.rmtree('.bioportal')
	meteor_build()
	npm_install()
	print 'finished'

if __name__ == '__main__':
	if len(sys.argv) == 2:
		main(*sys.argv[1:])
	else:
		print 'please provide config file as argument'
