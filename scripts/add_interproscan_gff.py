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
from urllib2  import urlopen
import randomcolor

def upload_ips(gff_file,gene_collection,interpro_collection):
	print 'parsing gff'
	gff = gt.parser(gff_file)
	counter = 0
	all_interpro = set()
	print 'uploading to mongodb'
	print 'adding to genes'
	for polypeptide in gff.getitems(featuretype='polypeptide'):
		counter += 1
		for protein_match in gff.get_children(polypeptide,featuretype='protein_match'):
			protein_match_ID = re.sub('\.','&#46;',protein_match.ID)
			gene_key = {'subfeatures.ID':polypeptide.ID}
			gene_update = {'$set': {
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
				gene_update['$addToSet'] = dbxref_dict

				interpro = dbxref_dict.get('domains.InterPro',None)
				if interpro:
					all_interpro.add(interpro)
						
			
			gene_collection.update(gene_key,gene_update)

	print 'fetching additional interpro data'
	all_interpro = list(all_interpro)
	for domains in (all_interpro[i:i+100] for i in xrange(0,len(all_interpro),100)):
		url =  'http://www.ebi.ac.uk/Tools/dbfetch/dbfetch/interpro/{0}/tab'.format(','.join(domains))
		response = urlopen(url)
		for line in response.readlines():
			line = line.strip()
			if not line or line[0] == '#':
				continue
			parts = line.split('\t')
			rand_color = randomcolor.RandomColor(seed=parts[0])
			interpro_key = {'ID':parts[0]}
			interpro_update = {'$set': {
				'type':parts[1],
				'short_name':parts[2],
				'description':parts[3],
				'color':rand_color.generate(format_='rgb')[0]
			}}
			domains.remove(parts[0])
			interpro_collection.update(interpro_key,interpro_update,upsert=True)
		if domains:
			for domain in domains:
				interpro_key = {'ID':domain}
				interpro_update = {'$set': {
					'type':'ERROR',
					'short_name':'ERROR',
					'description':'This domain was found with interproscan, but could not be found on the interpro site',
					'color':'black'
				}}
			interpro_collection.update(interpro_key,interpro_update,upsert=True)


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
	gene_collection = db.genes
	interpro_collection = db.interpro
	upload_ips(gff_file,gene_collection,interpro_collection)

if __name__ == '__main__':
	main(*sys.argv[1:])

