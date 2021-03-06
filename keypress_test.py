'''Script that will read from the Meteor database that stores all the keypress data and perform some analytics on it which will be pushed to the database to be read by the Meteor app'''
import pymongo
from pymongo.cursor import CursorType
import numpy as np
import scipy.stats
import time

client = pymongo.MongoClient('mongodb://127.0.0.1:3001/meteor')
print client.database_names()

print client.meteor
print client.meteor.collection_names(include_system_collections=False)

keydata1 = client.meteor['TypingDatabase1']
keydata2 = client.meteor['TypingDatabase2']
results = client.meteor['Results']
#print keydata1.find_one()
#print keydata1.count()
#for item in keydata1.find():
	#print item
#print ""

#Calculate a dictionary of dwell times for each letter that was typed. It will typically have many repeats in it so for examples would look like {'a':[132,144,167]} if the letter 'a' was pressed 3 times with dwell times of 132ms, 144ms, and 167ms.
dwell_times1 = {}
dwell_times1_raw = []
for item in keydata1.find({'keyCode':'keydown'}).sort('timeStamp',1):
	press_event = item
	#For each entry, we want to find the first instance when that key was released:
	unpress_event = keydata1.find_one({'eventType':press_event['eventType'], 'keyCode':'keyup', 'timeStamp':{'$gt':press_event['timeStamp']}}, sort=[('timeStamp',1)])

	#We need to be careful about recording Tab keys because if someone is typing in the first text box and types a Tab, then the first text box will record the keydown event but then context will switch to the second text box so the second text box registers the keyup event. One way around this would be to just not put tab events into the database in the first place (let's try that first)

	dwell_time = unpress_event['timeStamp'] - press_event['timeStamp']
	dwell_times1_raw.append(dwell_time)

	#Insert the calculated dwell time into our dictionary
	if press_event['eventType'] not in dwell_times1:
		dwell_times1[press_event['eventType']] = []
	dwell_times1[press_event['eventType']].append(dwell_time)

print dwell_times1

dwell_times2 = {}
dwell_times2_raw = []
for item in keydata2.find({'keyCode':'keydown'}).sort('timeStamp',1):
	press_event = item
	#For each entry, we want to find the first instance when that key was released:
	unpress_event = keydata2.find_one({'eventType':press_event['eventType'], 'keyCode':'keyup', 'timeStamp':{'$gt':press_event['timeStamp']}}, sort=[('timeStamp',1)])
	#print unpress_event, unpress_event['timeStamp'], press_event['timeStamp'], unpress_event['timeStamp'] - press_event['timeStamp']
	dwell_time = unpress_event['timeStamp'] - press_event['timeStamp']
	dwell_times2_raw.append(dwell_time)

	#Insert the calculated dwell time into our dictionary
	if press_event['eventType'] not in dwell_times2:
		dwell_times2[press_event['eventType']] = []
	dwell_times2[press_event['eventType']].append(dwell_time)

print dwell_times2

#Now compare the two distributions. 

#The first metric we'll use is a normalized variance between the two typing samples:
avg_ttest = 0.0
avg_pval = 0.0
count = 0
n_lower_limit = 3
for key in dwell_times1:
	#Ignore spaces?
	if key in dwell_times2 and ((len(dwell_times1[key]) >= n_lower_limit and len(dwell_times2[key]) >= n_lower_limit) and key != 32000):
		count += 1
		[stat, pval] = scipy.stats.ttest_ind(dwell_times1[key],dwell_times2[key],equal_var=False)
		#print key, stat, pval
		avg_ttest += stat
		avg_pval += pval

if count > 0:
	avg_ttest /= count
	avg_pval /= count
	print ""
	print "Results: ", avg_ttest, avg_pval

	[stat, pval] = scipy.stats.ttest_ind(dwell_times1_raw,dwell_times2_raw,equal_var=False)
	print "Results (just one t-test): ", stat, pval

#Another way we can compare things is to make a vector out of the mean dwell times for each
#key and then compare the two vectors with a chi-squared test. Not sure what to do about the
#keys that are only pressed once (maybe best to ignore them for now since we can't calculate a 
#standard deviation for them)
chi_squared = 0.0
count = 0
for key in dwell_times1:
	if key in dwell_times2 and ((len(dwell_times1[key]) >= n_lower_limit and len(dwell_times2[key]) >= n_lower_limit) and key != 32000):
		count += 1
		for item in dwell_times2[key]:
			#chi_squared += (np.mean(dwell_times2[key]) - np.mean(dwell_times1[key]))**2/((np.std(dwell_times1[key]) + np.std(dwell_times2[key]))/2.0)
			chi_squared += (np.mean(dwell_times2[key]) - np.mean(dwell_times1[key]))**2/((np.mean(dwell_times1[key]) + np.mean(dwell_times2[key]))/2.0)

if count > 0:
	print ""
	print "Normalized chi-squared: ",chi_squared/count

#Another way is to just compute the euclidean distance (and cosine) between the two vectors
euclidean_distance = 0.0
dot_product = 0.0
norm1 = 0.0
norm2 = 0.0
count = 0
for key in dwell_times1:
	if key in dwell_times2 and ((len(dwell_times1[key]) >= n_lower_limit and len(dwell_times2[key]) >= n_lower_limit) and key != 32000):
		count += 1
		euclidean_distance += (np.mean(dwell_times2[key]) - np.mean(dwell_times1[key]))**2
		norm1 += np.mean(dwell_times1[key])**2
		norm2 += np.mean(dwell_times2[key])**2
		dot_product += np.mean(dwell_times2[key])*np.mean(dwell_times1[key])

euclidean_distance = np.sqrt(euclidean_distance)
if norm1 > 0 and norm2 > 0:
	norm1 = np.sqrt(norm1)
	norm2 = np.sqrt(norm2)
	print ""
	print "Euclidean distance, norm1, norm2: ",euclidean_distance, norm1, norm2
	print "Euclidean distance as a fraction of the average norm: ", euclidean_distance/np.mean([norm1,norm2])
	print "Dot product: ", dot_product
	print "Cosine distance: ", dot_product/(norm1*norm2)
	print "Angle/pi: ", np.arccos(dot_product/(norm1*norm2))/np.pi

oplog = client.local.oplog.rs
last_ts = oplog.find().sort('$natural', -1)[0]['ts'];
num_keys = 0

'''Generates a dictionary of dwell times from one of the MongoDB databases generated by our Meteor app

Inputs: 	
	db (MongoDB database)

Outputs: 	
	dictionary of dwell times in the format of {key:[array of dwell times for that key]}
'''
def generate_dwell_times(db):
	dwell_times = {}
	for item in db.find({'keyCode':'keydown'}).sort('timeStamp',1):
		print item

		press_event = item
		#For each entry, we want to find the first instance when that key was released:
		unpress_event = db.find_one({'eventType':press_event['eventType'], 'keyCode':'keyup', 'timeStamp':{'$gt':press_event['timeStamp']}}, sort=[('timeStamp',1)])

		#We need to be careful about recording Tab keys because if someone is typing in the first text box and types a Tab, then the first text box will record the keydown event but then context will switch to the second text box so the second text box registers the keyup event. One way around this would be to just not put tab events into the database in the first place (let's try that first)

		dwell_time = unpress_event['timeStamp'] - press_event['timeStamp']

		#Insert the calculated dwell time into our dictionary
		if press_event['eventType'] not in dwell_times:
			dwell_times[press_event['eventType']] = []
		dwell_times[press_event['eventType']].append(dwell_time)

	return dwell_times


'''Computes the Euclidean distance and cosine distance between vectors dict1 and dict2 and
assumes that the dictionaries are of the form {type:[numbers]}, so turns them into vectors
with each type having a length equal to the mean of its entries

Inputs:
	dict1, dict2 - dictionaries in form {'label':array of numbers})
	min_threshold - minimum number of numbers in order to add mean to the sum (entries with an array size <= min_threshold will be ignored)
		
Returns: 
	[euclidean_distance, cosine_distance]
'''
def distance_comparison(dict1, dict2, min_threshold):
	euclidean_distance = 0.0
	euclidean_distance_score = 0.0
	cosine_distance = 0.0
	dot_product = 0.0
	norm1 = 0.0
	norm2 = 0.0
	count = 0
	for key in dict1:
		if key in dict2 and ((len(dict1[key]) >= min_threshold and len(dict2[key]) >= min_threshold)):
			count += 1
			euclidean_distance += (np.mean(dict2[key]) - np.mean(dict1[key]))**2
			norm1 += np.mean(dict1[key])**2
			norm2 += np.mean(dict2[key])**2
			dot_product += np.mean(dict2[key])*np.mean(dict1[key])

	euclidean_distance = np.sqrt(euclidean_distance)
	if norm1 > 0 and norm2 > 0:
		norm1 = np.sqrt(norm1)
		norm2 = np.sqrt(norm2)
		cosine_distance = dot_product/(norm1*norm2)
		euclidean_distance_score = 1-euclidean_distance/np.mean([norm1,norm2])

	return [euclidean_distance_score, cosine_distance]


while True:
	query = { 'ts': { '$gt': last_ts } }
  	cursor = oplog.find(query, cursor_type = CursorType.TAILABLE_AWAIT)
  	#cursor.add_option(_QUERY_OPTIONS['oplog_replay'])

	try:
		while cursor.alive:
			try:
				post = cursor.next()

				#If the database update corresponds to the "compare" button being pressed then recompute the comparison data. It looks like if an element is deleted from the database then the delete action will also show up in the oplog so we also want to check if the post here corresponds to an insert (post['op'] == 'i') as opposed to a delete (post['op'] == 'd')
				if post['ns'] == 'meteor.Tasks' and post['op'] == 'i':
					print "Compare Button pressed!"

					dwell_times1 = generate_dwell_times(keydata1)
					dwell_times2 = generate_dwell_times(keydata2)
					[euclidean_distance_score, cosine_distance] = distance_comparison(dwell_times1, dwell_times2, 3)

					#Insert a document if the database is empty
					if(results.count() == 0):
						results.insert_one({'num_keys':num_keys, 'euclidean_distance_score':euclidean_distance_score, 'cosine_distance':cosine_distance})
					#Otherwise update the document
					elif(results.count() == 1):
						results.update_one({}, {"$set":{"num_keys":num_keys, 'euclidean_distance_score':euclidean_distance_score, 'cosine_distance':cosine_distance}}, upsert=False)
						#results.update_one({'num_keys':num_keys-1}, {"$inc":{"num_keys":1}}, upsert=False)
					#There should not be more than one document in the database
					else:
						print "We shouldn't be here - results database has" + results.count() + "entries"

				#Otherwise, make sure post is from one of the typing databases before doing anything with it
				elif post['ns'] == 'meteor.TypingDatabase1' or post['ns'] == 'meteor.TypingDatabase2':
					num_keys += 1
					print post
					#print post['ns']
					#print post['o']['keyCode'] + " " + str(post['o']['timeStamp'])
					#print num_keys
					#results.insert_one({'num_keys':num_keys})
					#print results.find().sort('$natural', -1)[0]
					#print results.count()

					#results.update_one({'num_keys':num_keys-1}, {"$inc":{"num_keys":1}}, upsert=True)
			except StopIteration:
				time.sleep(1.0)
	finally:
		cursor.close()
