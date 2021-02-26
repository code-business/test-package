**timestream-processing**

A package for parsing result of timestream query and also for generating energy report.

**timestream-processing APIS**

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

   Converts timestream query response(string array as obtained from parseQueryResultWithProcessing) to an array of json objects with columns as keys and each object representing a row of table. It takes the following parameters:

   - response: output from parseQueryResultWithProcessing() function(string array).

   **Example:**

   ```
   const { keyValueTransformation } = require("timestream-processing");

   let response = ['{id=8910dh1937a73bf82,name=Raj Malhotra,age=25,Gender=M,time=2021-02-22 23:06:03.312000000}','{id=738hf3y837932h37r,name=Mehul Bhanushali,age=28,Gender=M,time=2021-02-22 23:07:03.312000000}'];
   let result = keyValueTransformation(response);
   console.log(result);
   ```

   **Output:**

   [{id:'8910dh1937a73bf82', name: 'Raj Malhotra', age: '25', Gender: 'M',time: 2021-02-22 23:06:03.312000000},{id: '738hf3y837932h37r', name: 'Mehul Bhanushali', age: '28', Gender: 'M', time: '2021-02-22 23:07:03.312000000'}]

3. _parseQueryResult(response)_

   Converts a timestream query response object to key value pairs. This function operates directly on the timestream read query response object whereas keyValueTransformation() function operates on string array.It takes the following parameters:

   - response: timestream query response(object)

   **Example:**

   ```
   const { parseQueryResult } = require("timestream-processing");

   let response =
   {
       QueryId: 'AEBQEAM2Q2GTYF2ZDVAGKALO7UXVDHQ4VU4XGGZ4233NITK7LWOXZ4GUBGRIVUK',
       Rows:[
        {Data:
        [
            { ScalarValue: '8910dh1937a73bf82' },
            { ScalarValue: 'Raj Malhotra' },
            { ScalarValue: '25' },
            { ScalarValue: 'M' },
            {ScalarValue: '2021-02-22 23:06:03.312000000'}
       ]}
       {Data:
       [
            { ScalarValue: '738hf3y837932h37r' },
            { ScalarValue: 'Mehul Bhanushali' },
            { ScalarValue: '28' },
            { ScalarValue: 'M' }
            {ScalarValue: '2021-02-22 23:07:03.312000000'}
       ]}
       ],
        ColumnInfo:
        [
            { Name: 'id', Type: { ScalarType: 'VARCHAR' } },
            { Name: 'name', Type: { ScalarType: 'VARCHAR' } },
            { Name: 'age', Type: { ScalarType: 'VARCHAR' } },
            { Name: 'Gender', Type: { ScalarType: 'VARCHAR' } },
            { Name: 'time', Type: { ScalarType: 'TIMESTAMP' } }
        ],
         QueryStatus:
         {
            ProgressPercentage: 100,
            CumulativeBytesScanned: 8464866,
            CumulativeBytesMetered: 10000000
        }
    };

    let result = parseQueryResult(response);
    console.log(result);
   ```

   **Output:**

   [{id:'8910dh1937a73bf82', name: 'Raj Malhotra', age: '25', Gender: 'M',time: 2021-02-22 23:06:03.312000000},{id: '738hf3y837932h37r', name: 'Mehul Bhanushali', age: '28', Gender: 'M', time: '2021-02-22 23:07:03.312000000'}]

4. _parseQueryResultWithProcessing(response)_

   Converts a timestream query response object to a string array. Each string of the array represents a row of timestream table.It takes the following parameters:

   - response: timestream query response(object)

   **Example:**

   ```
   const { parseQueryResultWithProcessing } = require("timestream-processing");

   let response =
   {
      QueryId: 'AEBQEAM2Q2GTYF2ZDVAGKALO7UXVDHQ4VU4XGGZ4233NITK7LWOXZ4GUBGRIVUK',
      Rows:[
       {Data:
       [
           { ScalarValue: '8910dh1937a73bf82' },
           { ScalarValue: 'Raj Malhotra' },
           { ScalarValue: '25' },
           { ScalarValue: 'M' },
           {ScalarValue: '2021-02-22 23:06:03.312000000'}
      ]}
      {Data:
      [
           { ScalarValue: '738hf3y837932h37r' },
           { ScalarValue: 'Mehul Bhanushali' },
           { ScalarValue: '28' },
           { ScalarValue: 'M' }
           {ScalarValue: '2021-02-22 23:07:03.312000000'}
      ]}
      ],
       ColumnInfo:
       [
           { Name: 'id', Type: { ScalarType: 'VARCHAR' } },
           { Name: 'name', Type: { ScalarType: 'VARCHAR' } },
           { Name: 'age', Type: { ScalarType: 'VARCHAR' } },
           { Name: 'Gender', Type: { ScalarType: 'VARCHAR' } },
           { Name: 'time', Type: { ScalarType: 'TIMESTAMP' } }
       ],
        QueryStatus:
        {
           ProgressPercentage: 100,
           CumulativeBytesScanned: 8464866,
           CumulativeBytesMetered: 10000000
       }
   };

   let result = parseQueryResultWithProcessing(response);
   console.log(result);
   ```

   **Output:**

   ['{id=8910dh1937a73bf82,name=Raj Malhotra,age=25,Gender=M,time=2021-02-22 23:06:03.312000000}','{id=738hf3y837932h37r,name=Mehul Bhanushali,age=28,Gender=M,time=2021-02-22 23:07:03.312000000}']

5. _getParsedValue_(value,dataType):

   Converts timestream query response object value(each object from array of objects output from parseQueryResult) to its corresponding data type based on the 'dataType' parameter of response.It takes the following parameters:

   - value: value of parameter
   - dataType: data type of parameter

   **Example**

   ```
   const { getParsedValue } = require("timestream-processing");
   let obj = {
       'measure_value::double': '249.45'
       dataType: 'FLOAT'
   };
   let result = getParsedValue(obj['measure_value::double'],obj.dataType);
   console.log("result = ",result);
   ```

   **Output**

   result = 249.45
