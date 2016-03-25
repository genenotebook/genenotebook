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
#from pathos.multiprocessing import ProcessingPool as Pool

def init(gff_file,fasta_file,gene_collection,track_collection):
	print 'parsing gff'
	assembly = fasta_file.split('/')[-1]
	assembly = assembly.rstrip('.fasta')
	track = gff_file.split('/')[-1]
	track = track.rstrip('.gff3')
	
	gff = gt.parser(gff_file,fasta_file=fasta_file)
	gff_md5 = get_md5(gff_file)

	bulk = gene_collection.initialize_unordered_bulk_op()

	print 'initializing upload'

	meta = {'track':track,'assembly':assembly,'md5':gff_md5}

	for feature in gff:
		feature_dic = feature.todict()
		feature_dic['track'] = track
		feature_dic['assembly'] = assembly
		bulk.insert(feature_dic)
		meta.setdefault(feature.featuretype,0)
		meta[feature.featuretype] += 1
	
	print 'uploading to mongodb'
	print '...'
	bulk.execute()
	print 'uploaded {0} genes, {1} transcripts, {2} cds'.format(meta['gene'],meta['mRNA'],meta['CDS'])
	print 'indexing'
	gene_collection.create_index('ID')
	gene_collection.create_index('type')
	gene_collection.create_index('children')
	gene_collection.create_index('parents')
	gene_collection.create_index('start')
	gene_collection.create_index('end')
	gene_collection.create_index('seqid')
	print 'setting metadata'
	track_collection.insert_one(meta)

def get_md5(file):
	print 'getting md5sum for {0}'.format(file)
	command = 'md5sum {0}'.format(file)
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	md5 = stdout.split('\n')[0]
	md5 = md5.split()[0]
	return md5

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
	gene_collection = db.genes
	track_collection = db.tracks
	init(gff_file,fasta_file,gene_collection,track_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

