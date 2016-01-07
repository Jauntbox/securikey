'''Script that will read from the Meteor database that stores all the keypress data and perform some analytics on it which will be pushed to the database to be read by the Meteor app'''
import pymongo
import numpy as np
import scipy.stats

client = pymongo.MongoClient('mongodb://127.0.0.1:3001/meteor')
print client.database_names()

print client.meteor
print client.meteor.collection_names(include_system_collections=False)

keydata1 = client.meteor['TypingDatabase1']
keydata2 = client.meteor['TypingDatabase2']
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
	#print unpress_event, unpress_event['timeStamp'], press_event['timeStamp'], unpress_event['timeStamp'] - press_event['timeStamp']
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

#The first metric we'll use is a normalize variance between the two typing samples:
avg_ttest = 0.0
avg_pval = 0.0
count = 0
n_lower_limit = 3
for key in dwell_times1:
	#Ignore spaces?
	if((len(dwell_times1[key]) > n_lower_limit and len(dwell_times2[key]) > n_lower_limit) and key != 32000):
		count += 1
		[stat, pval] = scipy.stats.ttest_ind(dwell_times1[key],dwell_times2[key],equal_var=False)
		#print key, stat, pval
		avg_ttest += stat
		avg_pval += pval
avg_ttest /= count
avg_pval /= count
print ""
print "Results: ", avg_ttest, avg_pval

[stat, pval] = scipy.stats.ttest_ind(dwell_times1_raw,dwell_times2_raw,equal_var=False)
print "Results (just one t-test): ", stat, pval
