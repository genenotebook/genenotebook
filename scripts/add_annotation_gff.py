#!/usr/bin/python
"""
gff_to_mongo.py
"""

__author__ = 'rensholmer'

import ast
import sys
import json
#from pymongo import MongoClient
import pymongo
import gff_toolkit as gt
from subprocess import Popen,PIPE

def model_subfeature(subfeature):
	sub_dic = subfeature.todict()
	for key in ('seqid','strand','file'):
		sub_dic.pop(key,None)
	sub_dic['attributes'].pop('ID')
	sub_dic['attributes'].pop('Parent',None)
	for key,value in sub_dic['attributes'].iteritems():
		sub_dic[key] = value
	sub_dic.pop('attributes')
	return sub_dic

def model_gene_feature(gene):
	gene_dic = gene.todict()
	gene_dic['attributes'].pop('ID')
	gene_dic['attributes'].pop('Parent',None)
	for key,value in gene_dic['attributes'].iteritems():
		gene_dic[key] = value
	for remove in ('parents','children','attributes'):
		gene_dic.pop(remove)
	gene_dic['subfeatures'] = []
	for subfeature in gene.get_children(featuretype=['mRNA','CDS']):
		sub_dic = model_subfeature(subfeature)
		gene_dic['subfeatures'].append(sub_dic)
	return gene_dic

def init(gff_file,fasta_file,gene_collection,track_collection):
	print 'parsing gff'
	assembly = fasta_file.split('/')[-1]
	track = gff_file.split('/')[-1]
	track_name = '.'.join(track.split('.')[:-1])
	
	gff = gt.parser(gff_file,fasta_file=fasta_file)
	gff_md5 = get_md5(gff_file)

	bulk = gene_collection.initialize_unordered_bulk_op()

	print 'initializing upload'

	meta = {'track':track,'assembly':assembly,'md5':gff_md5}

	for gene in gff.getitems(featuretype='gene'):
		gene_dic = model_gene_feature(gene)
		gene_dic['track'] = track
		gene_dic['assembly'] = assembly
		bulk.insert(gene_dic)
		meta.setdefault('gene',0)
		meta['gene'] += 1

	print 'uploading to mongodb'
	print '...'
	bulk.execute()
	print 'uploaded {0} genes'.format(meta['gene'])
	print 'indexing'
	gene_collection.create_index('ID')
	gene_collection.create_index('type')
	gene_collection.create_index([('seqid',pymongo.TEXT),('start',pymongo.ASCENDING),('end',pymongo.ASCENDING)])
	gene_collection.create_index('subfeatures.ID')
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

def get_client_address():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	client_address,stderr = p.communicate()
	return client_address

def main(gff_file=None,fasta_file=None,settings_file=None):
	#settings_file = 'settings.json'
	if settings_file:
		with open(settings_file) as filehandle:
			settings = json.load(filehandle)
			client_address = settings['private']['mongoUrl']
	else:
		client_address = get_client_address()
	print client_address
	client = pymongo.MongoClient(client_address)

	db_string = client_address.split('/')[-1]
	db = client[db_string]
	
	gene_collection = db.genes
	track_collection = db.tracks
	
	init(gff_file,fasta_file,gene_collection,track_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

