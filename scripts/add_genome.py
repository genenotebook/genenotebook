#!/usr/bin/python
"""
"""

import sys
import pymongo
import json
from subprocess import Popen,PIPE
from itertools import groupby

def fasta_iter(fasta_file):
	with open(fasta_file,'rU') as filehandle:
		faiter = (x[1] for x in groupby(filehandle, lambda line: line[0] == '>'))
		for header in faiter:
			header = header.next()[1:].strip()
			seq = ''.join(s.strip() for s in faiter.next())
			yield header,seq

def add(fasta_file,genomes_collection):
	print 'saving to db'

	bulk = genomes_collection.initialize_unordered_bulk_op()

	for header,seq in fasta_iter(fasta_file):
		bulk.insert({'ID':header,'seq':seq,'original_file':fasta_file,'name':fasta_file})
	bulk.execute()

	genomes_collection.create_index('ID')
	genomes_collection.create_index('name')

def get_client_address():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	client_address,stderr = p.communicate()
	return client_address

def main(fasta_file, settings_file = None):
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
	
	genomes_collection = db.genomes
	
	add(fasta_file,genomes_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])