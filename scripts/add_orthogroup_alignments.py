#!/usr/bin/python
"""
orthogroup_alignments_to_mongo.py
"""

__author__ = 'rensholmer'

import sys
import glob
import re
import gff_toolkit as gt
from subprocess import Popen,PIPE
import pymongo

def upload_alignments(alignments,collection):
	bulk = collection.initialize_unordered_bulk_op()
	
	print 'initializing upload'
	counter = 0
	for og,alignment in alignments:
		counter += 1
		if counter % 1000 == 0:
			print 'processed {0} orthogroups'.format(counter)
		og_dict = {}
		og_dict['ID'] = og
		og_dict['alignment'] = alignment
		bulk.insert(og_dict)
	
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

def get_alignments(folder):
	files = glob.glob(folder + '*fa')
	for file in files:
		og = file.split('/')[-1].strip('.fa')
		alignment = []
		for header,seq in gt.fasta_iter(file):
			fasta_dict = {}
			header = '_'.join(header.split('_')[1:])
			header = re.sub('\.','&#46;',header)
			fasta_dict['header'] = header
			fasta_dict['sequence'] = seq
			alignment.append(fasta_dict)
		yield og,alignment

def main(folder,settings_file=None):
	if settings_file:
		with open(settings_file) as filehandle:
			settings = json.load(filehandle)
			client_address = settings['private']['mongoUrl']
	else:
		client_address = get_client_address()
	print client_address
	client = pymongo.MongoClient(client_address)

	db_string = client_address.strip().split('/')[-1]
	db = client[db_string]

	collection = db.orthogroups
	upload_alignments(alignments,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])
