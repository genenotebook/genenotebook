#!/usr/bin/python
"""
gff_to_mongo.py
"""

__author__ = 'rensholmer'

import ast
import sys
import json
import random
import timeit
import time
#import pymongo
from pymongo import MongoClient
import gff_toolkit as gt
from subprocess import Popen,PIPE

def _template_func(setup, func):
    """Create a timer function. Used if the "statement" is a callable."""
    def inner(_it, _timer, _func=func):
        setup()
        _t0 = _timer()
        for _i in _it:
            retval = _func()
        _t1 = _timer()
        return round(_t1 - _t0,4), retval
    return inner

timeit._template_func = _template_func

def init(infile,mongo):
	print 'parsing gff'
	gff = gt.parser(infile)
	counter = 0
	print 'firing to mongodb'
	for obj in gff.getitems():
		counter += 1
		obj_dict = ast.literal_eval(obj.__str__())
		#print json.dumps(obj)
		obj_id = mongo.insert_one(obj_dict).inserted_id
		if counter % 1000 == 0:
			print counter,obj_id

def query(mongo,minimum,maximum):
	counter = 0
	start = random.randint(minimum,maximum)
	end = start + random.randint(1,maximum)
	#print start,end
	for gene in mongo.find({'start':{'$gt':start},'end':{'$lt':end},'type':'gene'}):
		for mrna in mongo.find({'ID':{'$in':gene['children']}}):
			#for sub in 
			#print mrna['ID'] 
			counter += 1
		#container.append(obj['ID'])
	return '{0} hits, query size {1}bp'.format(counter,end-start)

def wrapper(func, *args, **kwargs):
	def wrapped():
		return func(*args, **kwargs)
	return wrapped

def get(mongo,number):
	print 'finding min max'
	start_min = mongo.find().sort([('start',1)]).limit(1)[0]
	start_max = mongo.find().sort([('start',-1)]).limit(1)[0]
	end_min = mongo.find().sort([('end',1)]).limit(1)[0]
	end_max = mongo.find().sort([('end',-1)]).limit(1)[0]
	minimum = min(start_min['start'],end_min['end'])
	maximum = max(start_max['start'],end_max['end'])
	print 'min',minimum,'max',maximum
	index = 0
	print 'querying away'
	while index < number:
		index += 1
		#start = random.randint(minimum,maximum)
		#end = start + random.randint(100,10000)
		wrapped = wrapper(query,mongo,minimum,maximum)
		print timeit.timeit(wrapped,number=1)
		#print start,end
		#for obj in mongo.find({'start':{'$gt':start},'end':{'$lt':end},'type':'gene'}):
		#	continue
		#	print obj['ID']

def get_client():
	command = 'meteor mongo -U'
	p = Popen(command.split(),stdout=PIPE,stderr=PIPE)
	stdout,stderr = p.communicate()
	return stdout

def main(infile):
	print 'mongo init'
	client = get_client()
	client = MongoClient(client)
	db = client.meteor
	collection = db.genes
	#print [x for x in collection.find()]
	init(infile,collection)
	#get(collection,100)

if __name__ == '__main__':
	main(*sys.argv[1:])

