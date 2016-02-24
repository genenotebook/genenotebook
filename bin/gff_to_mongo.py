#!/usr/bin/python
"""
gff_to_mongo.py
"""

__author__ = 'rensholmer'

import ast
import sys
import json
#import pymongo
from pymongo import MongoClient
#sys.path.insert(0,'/Volumes/myers.bioinformatics.nl/mnt/nexenta/holme003/CODE/gff_toolkit/')
import gff_toolkit as gt
from subprocess import Popen,PIPE
#import multiprocessing as mp
from pathos.multiprocessing import ProcessingPool as Pool

def init(gff_file,fasta_file,mongo):
	print 'parsing gff'
	
	gff = gt.parser(gff_file,fasta_file=fasta_file)
	#pool = Pool(4)
	upload = wrapper(mongo)
	#pool.map(upload,gff.getitems())
	#'''
	counter = 0
	print 'uploading to mongodb'
	for gene in gff.getitems(featuretype='gene'):
		counter += 1
		for obj in gff.get_children(gene):
			obj_id = upload(obj)
		if counter % 10 == 0:
			print counter,obj_id
		if counter == 100:
			pass
			#break
		#	print obj['ID']
	#'''
def wrapper(mongo):
	def upload(feature):
		feature_dict = ast.literal_eval(feature.__str__())
		feature_id = mongo.insert_one(feature_dict).inserted_id
		mongo.create_index('ID')
		mongo.create_index('type')
		mongo.create_index('children')
		mongo.create_index('parents')
		return feature_id
	return upload

def get_client():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def main(gff_file,fasta_file=None):
	client = get_client()
	print client
	client = MongoClient(client)
	db = client.meteor
	collection = db.genes
	init(gff_file,fasta_file,collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

