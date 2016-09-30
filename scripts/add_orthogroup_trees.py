#!/usr/bin/python
"""
orthogroup_alignments_to_mongo.py
"""

__author__ = 'rensholmer'

import sys
import glob
import re
#import gff_toolkit as gt
from subprocess import Popen,PIPE
from pymongo import MongoClient

def upload_trees(trees,collection):
	bulk = collection.initialize_unordered_bulk_op()
	
	print 'initializing upload'
	counter = 0
	for og,tree in trees:
		counter += 1
		if counter % 1000 == 0:
			print 'processed {0} orthogroups'.format(counter)
		bulk.find({'ID':og}).update({
			'$set':{
				'phylogenetic_tree' : tree
			}
		})
		#og_dict = {}
		#og_dict['ID'] = og
		#og_dict['alignment'] = alignment
		#bulk.insert(og_dict)
	
	print 'uploading to mongodb'
	print '...'
	
	bulk.execute()
	
	print 'uploaded {0} orthogroups'.format(counter)

	print 'creating index'
	
	collection.create_index('ID')

def get_client_ip():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def get_trees(folder):
	files = glob.glob(folder + '/*txt')
	for file in files:
		og = file.split('/')[-1].strip('_tree.txt')
		with open(file,'rU') as filehandle:
			for line in filehandle:
				line = line.strip()
				if not line:
					continue
				tree = line
			yield og,tree

def main(folder,settings_file=None):
	if settings_file:
		with open(settings_file) as filehandle:
			settings = json.load(filehandle)
			client_address = settings['private']['mongoUrl']
	else:
		client_address = get_client_address()
	trees = get_trees(folder)
	print client_ip
	client = MongoClient(client_ip)
	db = client.meteor
	collection = db.orthogroups
	upload_trees(trees,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])
