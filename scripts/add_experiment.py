#!/usr/bin/python
"""
"""

import sys
import pymongo
import json
from subprocess import Popen,PIPE

def get_counts(counts_file):
	print 'reading counts file'
	counts = {}
	with open(counts_file,'rU') as filehandle:
		for line in filehandle:
			if not line.strip():
				continue
			if line[0] == '#':
				continue
			parts = line.strip().split()
			if parts[0] == 'Geneid':
				continue
			counts[parts[0]] = int(parts[6])
	return counts

def get_genelengths(genes,gene_collection):
	print 'getting genelengths'
	genelengths = {}
	for gene in genes:
		genedata = gene_collection.find_one({'ID':gene})
		assert genedata,gene
		transcripts = [s for s in genedata['subfeatures'] if s['type'] == 'mRNA']
		longest = sorted(transcripts,key = lambda x: len(x['seq']) )[-1] 
		genelengths[gene] = len(longest['seq'])
	return genelengths

def get_tpm(count_dic,gene_len_dic):
	print 'calculating tpm'
	rpk_dic = {}
	tpm_dic = {}
	total_rpk = 0.0
	for gene,count in count_dic.iteritems():
		rpk = count / (gene_len_dic[gene] / 1000.0)
		rpk_dic[gene] = rpk
		total_rpk += rpk
	for gene,rpk in rpk_dic.iteritems():
		tpm_dic[gene] = rpk / (total_rpk / 1000000)
	return total_rpk, tpm_dic

def add(counts_file,key,experiment,gene_collection,experiment_collection):
	count_dic = get_counts(counts_file)
	gene_len_dic = get_genelengths(count_dic.keys(),gene_collection)
	total_rpk, tpm_dic = get_tpm(count_dic,gene_len_dic)

	print 'saving to db'

	total_counts = sum(count_dic.values())

	experiment_id = experiment_collection.insert({
		'ID':key,
		'experiment':experiment,
		'totalCounts':total_counts,
		'totalRPK':total_rpk,
		'description':'None'
	})

	bulk = gene_collection.initialize_unordered_bulk_op()

	for gene_id,count in count_dic.iteritems():
		bulk.find({'ID':gene_id}).update({
			'$addToSet': {
				'experiments': {
					'experiment_id':experiment_id,
					'counts':count,
					'tpm':tpm_dic[gene_id]
				}
			}
		})
	bulk.execute()

def get_client_address():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	client_address,stderr = p.communicate()
	return client_address

def main(counts_file, key = None, experiment = None, settings_file = None):
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
	
	gene_collection = db.genes
	experiment_collection = db.experiments

	if key == None:
		key = counts_file

	if experiment == None:
		experiment = 'Experiment'
	
	add(counts_file,key,experiment,gene_collection,experiment_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])