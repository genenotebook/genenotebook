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
from pymongo import MongoClient

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

def main(folder):
	alignments = get_alignments(folder)
	client_ip = get_client_ip()
	print client_ip
	client = MongoClient(client_ip)
	db = client.meteor
	collection = db.orthogroups
	upload_alignments(alignments,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])
