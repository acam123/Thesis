"""                                                                             
*******************************************************************************
HEADER                                                                          
*******************************************************************************
Name: aidnexp3
Date: 12/1/16
Version: 1
Hypothesis: packed v unpacked 

"""

"""
*******************************************************************************
INFO                                                                          
*******************************************************************************

TABLE #1
----------

row[0]  - id
row[1]  - isPractice *1 is Practice
row[2]  - ss_side *not useful in this version
row[3]  - cal
row[4]  - iti
row[5]  - workerID
row[6]  - chosen *0 is ss
row[7]  - ss_val
row[8]  - ss_week
row[9]  - ll_val
row[10] - ll_week
row[11] - color_scheme
row[12] - version
row[13] - time
row[14] - trial_timeout
row[15] - rt
row[16] - trial_num
row[17] - b_val
row[18] - b_week



TABLE #2
---------

row[0] - id 
row[1] - workerID
row[2] - q1 *1 (correct ans)
row[3] - q2 *3
row[4] - q3 *2
row[5] - q4 *1
row[6] - q5 *2
row[7] - time

-- appended 
row[8] - score (number of correct answers)

"""

import sys
import math 
import numpy as np 
import pandas as pd
from scipy import stats
from scipy.optimize import curve_fit
from scipy.optimize import minimize
from scipy import stats
from sklearn.linear_model import LinearRegression as Lin_Reg
import matplotlib.pyplot as plt
import matplotlib.cm as cmx
import matplotlib.colors as colors
from mpl_toolkits.mplot3d import Axes3D

import datetime

to_file = 0
#open write file
if to_file == 1:
	fd = open('results/results.txt', 'w')
	old_stdout = sys.stdout
	sys.stdout = fd

#Date & Title
print '************************************************************************************************'
print ('\nTimestamp: {:%Y-%m-%d %H:%M:%S}'.format(datetime.datetime.now()))
print 'Analysis for Experiment 3'
print 'Aidan Campbell'
print ''

#set these for proper file and experiment version number
read_file = 'data/aidan_table.csv'
read_file_2 = 'data/aidan_table_2.csv'
version_num = '300'

#get data
cols = ['id', 'isPractice', 'ss_side', 'cal', 'iti', 'workerID', 'chosen', 'ss_val', 'ss_week', 'll_val', 'll_week', 'color_scheme', 'version', 'time', 'trial_timeout', 'rt', 'trial_num', 'b_val', 'b_week']
df = pd.read_csv(read_file, header=None, names=cols)
data = df.values
print 'Raw Data'
print data.shape

data = data[data[:,12] == 300]
print '\nCurrent Version Data'
print data.shape


#try and catch nans here in future
data = data[data[:,5] != 'nan']
print '\nOnly Mturk Results'
print data.shape


vals, inv = np.unique(data[:,5], return_inverse=True)
counts = np.bincount(inv)
worker_data = np.array(zip(vals, counts))

worker_ids = []
for ID in vals:
	if isinstance(ID, str):
		worker_ids.append(ID)
worker_ids = np.array(worker_ids)
print '\nWorker IDs' 
#print worker_ids
print worker_ids.shape


worker_data = worker_data[worker_data[:,1] == '88']
worker_ids = worker_data[:,0]
print '\nCompleted Experiment Worker IDs'
print worker_ids.shape
#print worker_ids 
#print worker_data.shape
#print worker_data

data = data[np.in1d(data[:,5],worker_data[:,0])]
print '\nCompleted Experiment Data'
print data.shape

data = data[data[:,1] == 0]
print '\nNo Practice Data'
print data.shape

data = data[~np.isnan(np.float64(data[:,6]))]
print '\nNo Null Data'
print data.shape

full_data = data
bill_data =  data[~np.isnan(np.float64(data[:,17]))]
no_bill_data = data[np.isnan(np.float64(data[:,17]))]
print '\nBill Data'
print bill_data.shape
print '\n No Bill Data'
print no_bill_data.shape

print '\n-------------------------------------------------'

cols = ['id', 'q1', 'q2', 'q3', 'q4', 'q5', 'time']
df2 = pd.read_csv(read_file_2, header=None, names=cols)
data2 = df2.values
print '\nRaw Data'
print data2.shape

tmp = []
for i in range(data2.shape[0]):
	if isinstance(data2[i,0], str):
		tmp.append(data2[i,:])
data2 = np.array(tmp)
#print data2
print '\nWorker Data'
print data2.shape


data2 = data2[np.in1d(data2[:,0], worker_ids)]
print '\nCompleted Experiment Data'
print data2.shape

##############################################################################################
# Visualize Financial Literacy Responses
##############################################################################################

ans_key = np.array([1,3,2,1,2])
correct = data2[:,1:6] == ans_key
scores = np.sum(correct, axis=1).reshape(-1,1)
data2 = np.append(data2, scores, axis=1)


"""
plt.figure()
plt.title('Financial Literacy Responses')
plt.xlabel('Question Number')
plt.ylabel('%Correct Response')
plt.bar(range(5), np.sum(correct, axis=0)/20.)
plt.show()
"""


###########################################################################################
# Define models
def func_1(R_val, R_D, B_val, B_D, P_val, P_D, k, w):
	return float(R_val)/(1+k*R_D*7) - float(w)*P_val*B_val*(R_D-B_D)/(1+k*R_D*7) - float(w)*B_val/(1+k*R_D*7)

def func_3(R_val, R_D, B_val, B_D, P_val, P_D, k, w):
	return float(R_val)/(1+k*R_D*7) - float(w)*B_val/(1+k*B_D*7)

def func_2(R_val, R_D, B_val, B_D, P_val, P_D, k, w):
	return float(R_val)/(1+k*R_D*7) - float(w)*P_val*B_val*(R_D-B_D)/(1+k*R_D*7) - float(w)*B_val/(1+k*B_D*7)

def softmax(V_1, V_2, b):
	return 1 / (1 + np.power(np.float64(np.e),(- b * (V_1 - V_2))))

def no_bill_model(choice, SS_val, S_D, LL_val, L_D, B_val, B_D, P_val, k, w):
	V_LL = func_1(LL_val, L_D, 0, 0, 0, 0, k, 1)
	V_SS = func_1(SS_val, S_D, 0, 0, 0, 0, k, 1)
	if choice == 0:
		return softmax(V_SS,V_LL, 1)
	elif choice == 1:
		return softmax(V_LL,V_SS, 1)

def bill_model(choice, SS_val, S_D, LL_val, L_D, B_val, B_D, P_val, k, w):
	V_LL = func_1(LL_val, L_D, B_val, B_D, .1, 0, k, w)
	V_SS = func_3(SS_val, S_D, B_val, B_D, 0, 0, k, w)
	if choice == 0:
		return softmax(V_SS,V_LL, 1)
	elif choice == 1:
		return softmax(V_LL,V_SS, 1)

def bill_model_2(choice, SS_val, S_D, LL_val, L_D, B_val, B_D, P_val, k, w):
	V_LL = func_2(LL_val, L_D, B_val, B_D, .1, 0, k, w)
	V_SS = func_3(SS_val, S_D, B_val, B_D, 0, 0, k, w)
	if choice == 0:
		return softmax(V_SS,V_LL, 1)
	elif choice == 1:
		return softmax(V_LL,V_SS, 1)
	

def loglikelihood(free_params, predict_model, data):
	k = free_params[0]
	w = free_params[1]
	
	#k = free_params
	w = 1

	ans = []
	for i in range(data.shape[0]):
		row = data[i,:]
		choice = row[6]
		SS_val = row[7]
		SS_D = row[8]
		LL_val = row[9] 
		L_D = row[10]
		B_val = row[17]
		B_D = row[18]
		P_val = .1
		tmp = predict_model(choice, SS_val, SS_D, LL_val, L_D, B_val, B_D, P_val, k, w)
		ans.append(tmp)
	return - np.sum(np.log(ans))

free_params_init = np.array([.0196,1])



print '\n---------------------------------------------------' 
print '\nGroup Results'

print '\nBill Model B discounted on L_D for LL choice'
res = minimize(loglikelihood, free_params_init, args=(bill_model, bill_data), method = 'Nelder-Mead')
print res

print '\nNo Bill Data'
res2 = minimize(loglikelihood, free_params_init, args=(no_bill_model, no_bill_data), method = 'Nelder-Mead')
print res2

print '\nBill Model B discounted on B_D for LL choice'
res3 = minimize(loglikelihood, free_params_init, args=(bill_model_2, bill_data), method = 'Nelder-Mead')
print res3







##############################################################################################
# Visualize Data as heatmaps of percent LL choice
##############################################################################################

#BILL DATA!!!
data = bill_data
B_vals = np.unique(data[:,17]) 
LL_delays = np.unique(data[:,10])
B_delays = np.unique(data[:,18])


# Get counts for choices at each bin
#	B_val | LL_delay | B_Delay | #_LL | #_Qs 
LL_percents = np.ones((B_vals.shape[0]*LL_delays.shape[0]*B_delays.shape[0], 5))
itr = 0
for val in B_vals:
	for L_D in LL_delays:
		for B_D in B_delays:
			tmp = data[ (data[:,17]==val) & (data[:,10]==L_D) & (data[:,18]==B_D) ]
			num_total = np.float64(tmp.shape[0])
			num_ll = np.float64(tmp[tmp[:,6]==1].shape[0]) # LL chosen
			LL_percents[itr,:] = [val, L_D, B_D, num_ll, num_total] 
			itr += 1

print ''

"""
# Make Heatmaps
fig, ax = plt.subplots(1, 2, figsize=(30, 6))
plt.suptitle('Heatmaps of LL-Choice Percentage', fontsize=20)
plt.subplots_adjust(top=0.85)
for i in range(B_vals.shape[0]):
	tmp = LL_percents[LL_percents[:,0] == B_vals[i]]
	hmap = np.ones((LL_delays.shape[0], B_delays.shape[0]))
	for j in range(LL_delays.shape[0]):
		tmp2 = tmp[tmp[:,1] == LL_delays[j]]
		hmap[j,:] = tmp2[:,3] / tmp2[:,4]
	cax = ax[i].pcolor(hmap, vmin=0, vmax=1)
	plt.colorbar( mappable=cax, ax=ax[i], orientation='horizontal')
	cax.cmap.set_under('black')
	ax[i].set_title('B_val='+str(B_vals[i]))
	ax[i].set_xlabel('Bill Delays')
	ax[i].set_ylabel('LL Delays')
	ax[i].set_xticks(np.arange(B_delays.shape[0])+0.5, minor=False)
	ax[i].set_yticks(np.arange(LL_delays.shape[0])+0.5, minor=False)
	ax[i].set_xticklabels(B_delays, minor=False)
	ax[i].set_yticklabels(LL_delays, minor=False)
plt.show()
"""


#############################################################################################

#NON BILL DATA!!!
data = no_bill_data
SS_vals = np.unique(data[:,7]) 
LL_vals = np.unique(data[:,9]) 
LL_delays_2 = np.unique(data[:,10]) 

LL_percents_2 = np.ones((SS_vals.shape[0]*LL_vals.shape[0]*LL_delays_2.shape[0], 5))
itr = 0
for SS in SS_vals:
	for LL in LL_vals:
		for L_D in LL_delays_2:
			tmp = data[ (data[:,7]==SS) & (data[:,10]==L_D) & (data[:,9]==LL) ]
			num_total = np.float64(tmp.shape[0])
			num_ll = np.float64(tmp[tmp[:,6]==1].shape[0]) # LL chosen
			LL_percents_2[itr,:] = [SS, L_D, LL, num_ll, num_total] 
			itr += 1

"""
fig, ax = plt.subplots(1, 2, figsize=(30, 6))
plt.suptitle('Heatmaps of LL-Choice Probability', fontsize=20)
plt.subplots_adjust(top=0.85)
for i in range(SS_vals.shape[0]):
	tmp = LL_percents_2[LL_percents_2[:,0] == SS_vals[i]]
	hmap = np.ones((LL_vals.shape[0], LL_delays_2.shape[0]))
	for j in range(LL_vals.shape[0]):
		tmp2 = tmp[tmp[:,2] == LL_vals[j]]
		hmap[j,:] = tmp2[:,3] / tmp2[:,4]
		#print hmap
	cax = ax[i].pcolor(hmap, vmin=0, vmax=1)
	plt.colorbar( mappable=cax, ax=ax[i], orientation='horizontal')
	cax.cmap.set_under('black')
	ax[i].set_title('SS_val='+str(SS_vals[i]))
	ax[i].set_xlabel('LL Delays')
	ax[i].set_ylabel('LL Vals')
	ax[i].set_xticks(np.arange(LL_delays_2.shape[0])+0.5, minor=False)
	ax[i].set_yticks(np.arange(LL_vals.shape[0])+0.5, minor=False)
	ax[i].set_xticklabels(LL_delays_2, minor=False)
	ax[i].set_yticklabels(LL_vals, minor=False)
plt.show()
"""

##############################################################################################
# Within Subjects Modeling & T-test 
##############################################################################################

print '\n-----------------------------------------------------------'
print '\n@PERFORMING REGRESSIONS\n'

# k (no bill) | loglikelihood | sucess | k (bill) | w | loglikelihood | success
paired_data = np.ones((worker_ids.shape[0],7))

data = full_data


# !!!Troubleshoot unsuccessful optimization!!!
#worker = worker_ids[10]
"""
for worker in worker_ids:
	tmp = data[data[:,5] == worker]
	tmp_bill_data = tmp[~np.isnan(np.float64(tmp[:,17]))]
	tmp_no_bill_data = tmp[np.isnan(np.float64(tmp[:,17]))]
	#no_bill_res = minimize(loglikelihood, free_params_init, args=(no_bill_model, tmp_no_bill_data), method='Nelder-Mead')
	no_bill_res = minimize(loglikelihood, free_params_init, args=(no_bill_model, tmp_no_bill_data),method = 'TNC', bounds=[(0.00001, None), (0.00001, None)], options={'disp': False, 'minfev': 0, 'scale': None, 'rescale': -1, 'offset': None, 'gtol': -1, 'eps': 1e-08, 'eta': -1, 'maxiter': 100, 'maxCGit': 100, 'mesg_num': None, 'ftol': -1, 'xtol': -1, 'stepmx': 0, 'accuracy': 0})
	print no_bill_res.success 
	print no_bill_res.fun
	print no_bill_res.x

	no_bill_res = minimize(loglikelihood, free_params_init, args=(no_bill_model, tmp_no_bill_data), method='Nelder-Mead')
	print no_bill_res.success 
	print no_bill_res.fun
	print no_bill_res.x
	print ''
	print '-------------------------------------'
# NOTE: all TNC and Nelder-Mead optimizations give the same results except for unbounded negative results become ~0.
# TNC finding for worker 10 fails, but gives same result as Nelder-Mead, so should be ok
"""



for itr in range(worker_ids.shape[0]):
	worker = worker_ids[itr]
	tmp = data[data[:,5] == worker]
	tmp_bill_data = tmp[~np.isnan(np.float64(tmp[:,17]))]
	tmp_no_bill_data = tmp[np.isnan(np.float64(tmp[:,17]))]
	bill_res = minimize(loglikelihood, free_params_init, args=(bill_model_2, tmp_bill_data), method = 'TNC', bounds=[(0., None), (0.00001, None)], options={'disp': False, 'minfev': 0, 'scale': None, 'rescale': -1, 'offset': None, 'gtol': -1, 'eps': 1e-08, 'eta': -1, 'maxiter': 100, 'maxCGit': 100, 'mesg_num': None, 'ftol': -1, 'xtol': -1, 'stepmx': 0, 'accuracy': 0})
	no_bill_res = minimize(loglikelihood, free_params_init, args=(no_bill_model, tmp_no_bill_data), method = 'TNC', bounds=[(0., None), (0.00001, None)], options={'disp': False, 'minfev': 0, 'scale': None, 'rescale': -1, 'offset': None, 'gtol': -1, 'eps': 1e-08, 'eta': -1, 'maxiter': 100, 'maxCGit': 100, 'mesg_num': None, 'ftol': -1, 'xtol': -1, 'stepmx': 0, 'accuracy': 0})
	paired_data[itr,:] = np.array([no_bill_res.x[0], no_bill_res.fun, no_bill_res.success, bill_res.x[0], bill_res.x[1], bill_res.fun, bill_res.success])


print '***************************'
print 'Successful minimization'
print paired_data[:,2] 
print paired_data[:,6] 
print '***************************'

print '\nSubject Paired Data Results'
print paired_data.shape
print paired_data

print '\n@RUNNING PAIRED T-TEST'
N = paired_data.shape[0]
d = paired_data[:,0] - paired_data[:,3]
print '\nMean of Diff.'
d_bar = sum(d) / d.shape[0]
print d_bar

print '\nStd Dev.'
std_dev = np.sqrt(np.sum(np.power((d - d_bar),2))/ (N-1))
print std_dev 

print '\n Std Err.'
std_err = std_dev / np.sqrt(N)
print std_err

print '\nT-stat'
t = d_bar / std_err
print t

"""
print '\nEffect Size'
effect_size = (np.mean(paired_data[:,0]) - np.mean(paired_data[:,3])) / std_dev
print effect_size

print '\nPower'
"""

ans = stats.ttest_1samp(d, 0)
print '\nT-TEST RES:'
print ans

print paired_data[:,0]
print paired_data[:,3]

plt.figure()
plt.title('Histogram of k distributions')
plt.xlabel('k-value')
plt.ylabel('frequency')
plt.hist(paired_data[:,0], facecolor='blue', label='no-bill')
plt.hist(paired_data[:,3], facecolor='red', label='bill')
plt.legend()
plt.show()

#mod = Lin_Reg()
#mod.fit(,y)

#print data2
#print worker_ids
#print data2[:,0]

id_paired_data = np.append(worker_ids.reshape(-1,1),paired_data, axis=1)
scores = []
for itr in range(paired_data.shape[0]):
	ID = id_paired_data[itr,0] 
	scores.append(data2[data2[:,0] == ID][0,7])
scores = np.array(scores)
#print scores.shape

paired_data = np.append(paired_data, scores.reshape(-1,1), axis=1)
#print paired_data


plt.figure()
plt.title('Financial Literacy Effects')
plt.xlabel('k')
plt.ylabel('Financial Literacy Score')
plt.scatter(paired_data[:,0], paired_data[:,-1], c='red', label='no-bill')
plt.scatter(paired_data[:,3], paired_data[:,-1], c='blue', label='bill')
#plt.scatter(paired_data[:,4], paired_data[:,-1], c='green', label='w')
plt.legend()
plt.show()




#close write file
if to_file == 1:
	sys.stdout=old_stdout
	fd.close()

