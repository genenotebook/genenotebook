#!/usr/bin/python
"""
gff_to_mongo.py
"""

__author__ = 'rensholmer'

import sys
import json
import re
from pymongo import MongoClient
import gff_toolkit as gt
from subprocess import Popen,PIPE

def upload_ips(gff_file,collection):
	print 'parsing gff'
	gff = gt.parser(gff_file)
	counter = 0
	print 'uploading to mongodb'
	for polypeptide in gff.getitems(featuretype='polypeptide'):
		counter += 1
		for protein_match in gff.get_children(polypeptide,featuretype='protein_match'):
			protein_match_ID = re.sub('\.','&#46;',protein_match.ID)
			key = {'subfeatures.ID':polypeptide.ID}
			update = {'$set': {
				'subfeatures.$.interproscan.'+protein_match_ID: {
						'start' : protein_match.start,
						'end' : protein_match.end,
						'score' : protein_match.score,
						'source' : protein_match.source,
						'signature_desc' : ','.join(protein_match.attributes.get('signature_desc',[''])),
						'dbxref' : ','.join(protein_match.attributes.get('Dbxref',[''])),
						'name' : ','.join(protein_match.attributes.get('Name',['']))
					}
				}
			}
			dbxref = protein_match.attributes.get('Dbxref',None)
			if dbxref:
				dbxref_dict = {'domains.'+kv[0]:kv[1] for kv in [d.split(':') for d in dbxref]}
				update['$addToSet'] = dbxref_dict
			result = collection.update(key,update)
		if counter % 1000 == 0:
			print counter,result['electionId'],result['nModified']

def get_client_ip():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def main(gff_file):
	client_ip = get_client_ip()
	print client_ip
	client = MongoClient(client_ip)
	db = client.meteor
	collection = db.genes
	upload_ips(gff_file,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

