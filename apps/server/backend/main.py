# just making my own API app to keep the endpoints seperate
# we can merge them whenever
# this api should handle the following functionality:
# - Process a initial editor text into a knowledge graph
# - Return a user's knowledge graph from neo4j in JSON for the playground to use
# - Find related papers to a node with a description in the knowledge graph.
#   - vector search abstracts -> 
# - 



import urllib, urllib.request
url = 'http://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=1'
data = urllib.request.urlopen(url)
print(data.read().decode('utf-8'))