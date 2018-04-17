import json

def main():
	export_data = list()

	with open('congressman_ts.json') as jsonfile:    
		data = json.load(jsonfile)

	for _id in data.keys():
		export_data.append({
			"id": 			_id, 
			"name": 		data[_id][0],
			"state": 		data[_id][1],
			"party":		data[_id][2],
			"legislatures":	data[_id][3],
			"expenses":		data[_id][4]
		})

	with open('congressman_ts.js','w') as jsonfile:
		json.dump(export_data, jsonfile)

if __name__ == '__main__':
	main()