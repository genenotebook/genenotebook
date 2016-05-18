#!/usr/bin/python
"""
"""

import sys
import os
#sys.path.insert(0,'/mnt/nexenta/holme003/CODE/gff_toolkit/')
import gff_toolkit as gt
#import urllib2
from bs4 import BeautifulSoup
import pickle
#import editdistance
import numpy as np
import wget
import gzip
from subprocess import Popen,PIPE
from pymongo import MongoClient

class IprHierarchy(object):
	def __init__(self):
		self.domains = {}
	def __iter__(self):
		for sub in self.domains.values():
			yield sub
	def __getitem__(self,key):
		return self.domains[key]
	def __str__(self):
		s ='['
		for sub in self:
			s += str(sub) + ','
		s = s.rstrip(',')
		s += ']'
		return s
	def update(self,feature):
		self.domains[feature.ID] = feature
	def set_contained_by(self):
		for sub in self:
			for contain_name in sub.contains:
				contain = self[contain_name]
				if sub.ID not in contain.contained_by:
					contain.contained_by.append(sub.ID)
	def get_children(self,feature,seen=None):
		if seen == None:
			seen = set()
		if feature not in seen:
			seen.add(feature)
			yield feature
		for subfeature in feature.children:
			subfeature = self[subfeature]
			for s in self.get_children(subfeature,seen):
				yield s
	def get_contains(self,feature,seen=None):
		if seen == None:
			seen = set()
		if feature not in seen:
			seen.add(feature)
			yield feature
		for subfeature in feature.contains:
			subfeature = self[subfeature]
			for s in self.get_contains(subfeature,seen):
				yield s
	def get_parents(self,feature):
		yield feature
		for subfeature in feature.parents:
			subfeature = self[subfeature]
			for s in self.get_parents(subfeature):
				yield s

class IprObject(object):
	def __init__(self,ID,name,domain_type,domain_features):
		self.ID = ID
		self.name = name
		self.domain_type = domain_type
		self.parents = domain_features['parent_list']#parents
		self.children = domain_features['child_list']#children
		self.found_in = domain_features['found_in']#found_in
		self.contains = domain_features['contains']#contains
		self.contained_by = []
	def __str__(self):
		dic = self.todict()
		return str(dic)
	def __repr__(self):
		return self.__str__()
	def __eq__(self,other):
		assert isinstance(other,str)
		return self.ID == other
	def todict(self):
		dic = {	'ID':self.ID,
				'domain_type':self.domain_type,
				'parents':self.parents,
				'children':self.children,
				'found_in':self.found_in,
				'contains':self.contains,
				'contained_by':self.contained_by,
				'name':self.name}
		return dic

def get_domain_features(domain):
	features = ('parent_list','child_list','contains','found_in')
	domain_features = {}
	for feature in features:
		domain_feature = domain.find(feature)
		if domain_feature:
			for df in domain_feature.find_all('rel_ref'):
				domain_features.setdefault(feature,[]).append(df['ipr_ref'])
		else:
			domain_features[feature] = []
	return domain_features

def get_ipr_hierarchy():
	if not os.path.isfile('interpro.xml.gz'):
		print 'downloading interpro data'
		wget.download('ftp://ftp.ebi.ac.uk/pub/databases/interpro/Current/interpro.xml.gz')
	#if os.path.isfile('interpro.hierarchy.p'):
	#	with open('interpro.hierarchy.p','rU') as filehandle:
	#		ipr_hierarchy = pickle.load(filehandle)
	#	return ipr_hierarchy
	print 'preparing interpro data'
	ipr_hierarchy = IprHierarchy()
	with gzip.open('interpro.xml.gz','rb') as filehandle:
		#filecontent = filehandle.read()
		soup = BeautifulSoup(filehandle,'xml')
		for domain in soup.find_all('interpro'):
			name = str(domain.find('name').string)
			parents_list = []
			contains_list = []
			child_list = []
			found_in_list = []
			domain_features = get_domain_features(domain)
			ipr = IprObject(ID=domain['id'],name=name,domain_type=domain['type'],domain_features=domain_features)
			ipr_hierarchy.update(ipr)
	ipr_hierarchy.set_contained_by()
	#print ipr_hierarchy
	with open('interpro.hierarchy.p','w') as filehandle:
		pickle.dump(ipr_hierarchy,filehandle)
	return ipr_hierarchy

def get_client():
	print 'finding mongodb'
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	print stdout
	return stdout

def upload(collection,ipr_hierarchy):
	bulk = collection.initialize_unordered_bulk_op()
	print 'preparing upload'
	for ipr in ipr_hierarchy:
		bulk.insert(ipr.todict())
	print 'uploading to mongodb'
	bulk.execute()
	print 'indexing'
	collection.create_index('ID')

def main(infile=None):
	client_ip = get_client()
	client = MongoClient(client_ip)
	db = client.meteor
	collection = db.interpro
	ipr_hierarchy = get_ipr_hierarchy()
	upload(collection,ipr_hierarchy)
	#for ipr in ipr_hierarchy:
	#	print ipr
	quit()
	ipr_combinations = get_ipr_combinations()
	gff = gt.parser(infile)
	names = {}
	for polypeptide in gff.getitems(featuretype='polypeptide'):
		domains = set()
		for protein_match in gff.get_children(polypeptide,featuretype='protein_match'):
			interpro = get_interpro(protein_match)
			if not interpro or interpro not in ipr_hierarchy:
				continue
			name = ipr_hierarchy[interpro].name
			if 'DUF' in name or 'unknown' in name:
				continue
			domains.add(protein_match)
		if not domains:
			name = ['None']
		else:
			reduced_domains = reduce_domains(domains,ipr_hierarchy)
			if len(reduced_domains) == 1:
				name = [reduced_domains[0].name]
			else:
				name = find_similar_names(reduced_domains)
		#print name
		if len(name) != 1:
			name = [ipr_combinations.get(name,name[0])]
		name = name[0]
		if name.endswith('domain') or name.endswith('fold'):
			name += ' containing protein'
		print '\t'.join([polypeptide.ID,name])
	'''
		names.setdefault(name,0)
		names[name] += 1
	for name,count in sorted(names.iteritems(),key = lambda x: x[1]):
		if isinstance(name,str):
			print '\t'.join([polypeptide.ID,name])
			continue
		if name in ipr_combinations:
			print '\t'.join([polypeptide.ID,ipr_combinations[name]])
		else:
			print '\t'.join([polypeptide.ID,name[0]])
	'''
if __name__ == '__main__':
	main(*sys.argv[1:])
