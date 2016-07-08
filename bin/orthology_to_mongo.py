#!/usr/bin/python
"""
orthology_to_mongo.py
"""

__author__ = 'rensholmer'

import sys
from pymongo import MongoClient
from subprocess import Popen,PIPE

def upload_orthogroups(orthogroups,collection):
	for gene_id,features in orthogroups.iteritems():
		result = collection.update({'ID':gene_id},{'$set':features})

def get_client_ip():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def get_orthogroups(infile):
	orthogroups = {}
	with open(infile,'rU') as inhandle:
		for line in inhandle:
			features = {}
			if not line.strip():
				continue
			if line[0] == '#':
				continue
			parts = line.strip().split('\t')

			assert len(parts[1].split(',')) == 1
			gene_id = parts[1].split(',')[0]
			assert gene_id not in orthogroups

			og = parts[0]
			features['orthogroup'] = og
			
			orthologs = parts[2].split(',')
			if orthologs[0]:
				features['orthologs'] = orthologs
			
			paralogs = parts[3].split(',')
			if paralogs[0]:
				features['paralogs'] = paralogs

			if parts[4] == 'singleton':
				features['singleton'] = True
			
			if orthologs or paralogs:
				if len(orthologs) == 1 and len(paralogs) == 1:
					if parts[5] == '1':
						features['one_to_one_orthologs'] = 'High confidence'
					else:
						features['one_to_one_orthologs'] = 'Low confidence'
			orthogroups[gene_id] = features
	return orthogroups

def main(infile):
	orthogroups = get_orthogroups(infile)
	#quit()
	client_ip = get_client_ip()
	print client_ip
	client = MongoClient(client_ip)
	db = client.meteor
	collection = db.genes
	upload_orthogroups(orthogroups,collection)
	

if __name__ == '__main__':
	main(*sys.argv[1:])