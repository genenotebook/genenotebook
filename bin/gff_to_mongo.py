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
	return sub_dic

def model_gene_feature(gene):
	gene_dic = gene.todict()
	gene_dic['attributes'].pop('ID')
	gene_dic['attributes'].pop('Parent',None)
	gene_dic.pop('parents')
	gene_dic.pop('children')
	gene_dic['subfeatures'] = []
	for subfeature in gene.get_children(featuretype=['mRNA','CDS']):
		sub_dic = model_subfeature(subfeature)
		gene_dic['subfeatures'].append(sub_dic)
	return gene_dic

def init(gff_file,fasta_file,gene_collection,track_collection):
	print 'parsing gff'
	assembly = fasta_file.split('/')[-1]
	assembly = assembly.rstrip('.fasta')
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
	#for feature in gff.getitems(featuretype='gene'):
	#	feature_dic = feature.todict()
	#	feature_dic['track'] = track
	#	feature_dic['assembly'] = assembly

	#	bulk.insert(feature_dic)
	#	meta.setdefault(feature.featuretype,0)
	#	meta[feature.featuretype] += 1
	
	print 'uploading to mongodb'
	print '...'
	bulk.execute()
	#print 'uploaded {0} genes, {1} transcripts, {2} cds'.format(meta['gene'],meta['mRNA'],meta['CDS'])
	print 'uploaded {0} genes'.format(meta['gene'])
	print 'indexing'
	gene_collection.create_index('ID')
	gene_collection.create_index('type')
	#gene_collection.create_index('children')
	#gene_collection.create_index('parents')
	#gene_collection.create_index('start')
	#gene_collection.create_index('end')
	gene_collection.create_index([('seqid',pymongo.TEXT),('start',pymongo.ASCENDING),('end',pymongo.ASCENDING)])
	#gene_collection.create_index('subfeatures')
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

def get_client():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def main(gff_file,fasta_file=None):
	client = get_client()
	print client
	client = pymongo.MongoClient(client)
	db = client.meteor
	gene_collection = db.genes
	track_collection = db.tracks
	init(gff_file,fasta_file,gene_collection,track_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

