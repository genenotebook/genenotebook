#!/usr/bin/env python
"""
"""

import sys
import requests

def get_url(url):
	response = requests.post(url)
	return response

def main():
	enzymes_url = 'http://rest.kegg.jp/list/enzyme'
	print get_url(enzymes_url)

if __name__ == '__main__':
	main()