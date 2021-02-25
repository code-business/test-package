**timestream-processing**

A package for parsing result of timestream query and also for generating energy report.

**APIS**

1. _generateEnergyReport(deviceIds,
   responseForPastData,
   main_response,
   deviceDictionary,
   groupBy)_

   Computes energy consumed by each device per hour,day,month or year(based on the 'groupBy' parameter). It takes the following parameters:

   - deviceIds: array of device ids
   - responseForPastData: timestream data of device before start time as key-value pairs.
   - main_response: timestream data of device between start time and end time as key-value pairs.
   - deviceDictionary: an object with key as device id and values as device id and device name.
   - groupBy: the parameter which decides grouping of data for energy consumed calculation. Takes the following values:
     1. "Hr": hour-wise grouping.
     2. "Dy": day-wise grouping.
     3. "MM": month-wise grouping.
     4. "Yr": year-wise grouping.

2. _keyValueTransformation(response)_

   Converts timestream query response(string array) to an array of json objects with columns as keys and each object representing a row. It takes the following parameters:

   - response: timestream query response(string array).

   Example:

   ```
   const { keyValueTransformation } = require("timestream-processing");

   let response = ['{id=8910dh1937a73bf82,name=Raj Malhotra,age=25,Gender=M}','{id=738hf3y837932h37r,name=Mehul Bhanushali,age=28,Gender=M}'];
   let result = keyValueTransformation(response);
   console.log(result);
   ```

   **Output**

   [{id:'8910dh1937a73bf82', name: 'Raj Malhotra', age: '25', Gender: 'M'},{id: '738hf3y837932h37r', name: 'Mehul Bhanushali', age: '28', Gender: 'M'}]

3.
