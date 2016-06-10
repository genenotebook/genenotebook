#!/usr/bin/python
"""
gff_to_mongo.py
"""

__author__ = 'rensholmer'

import ast
import sys
import json
import re
from pymongo import MongoClient
import gff_toolkit as gt
from subprocess import Popen,PIPE
#from pathos.multiprocessing import ProcessingPool as Pool

def upload_ips(gff_file,collection):
	print 'parsing gff'
	gff = gt.parser(gff_file)
	upload_func = upload_wrapper(collection)
	counter = 0
	print 'uploading to mongodb'
	for polypeptide in gff.getitems(featuretype='polypeptide'):
		counter += 1
		for obj in gff.get_children(polypeptide,featuretype='protein_match'):
			obj_id = upload_func(obj)
		if counter % 100 == 0:
			print counter,obj_id,polypeptide.ID
			#quit()

def upload_wrapper(collection):
	def upload(feature):
		transcript_ID = feature.parents[0]
		#print transcript_ID
		feature_ID = re.sub('\.','&#46;',feature.ID)
		key = {'subfeatures.ID':transcript_ID}
		result = collection.update(key,{
			'$set': {
			'subfeatures.$.interproscan.'+feature_ID: {
					'start' : feature.start,
					'end' : feature.end,
					'score' : feature.score,
					'source' : feature.source,
					'signature_desc' : ','.join(feature.attributes.get('signature_desc',[''])),
					'dbxref' : ','.join(feature.attributes.get('Dbxref',[''])),
					'name' : ','.join(feature.attributes.get('Name',['']))
				}
			}
		})
		return result['electionId'],result['nModified']
	return upload

def get_client():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def main(gff_file):
	client = get_client()
	print client
	client = MongoClient(client)
	db = client.meteor
	collection = db.genes
	upload_ips(gff_file,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

