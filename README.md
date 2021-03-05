**timestream_processing**

A package for parsing result of timestream query and also for generating energy report.

**timestream_processing APIs**

1. _generateEnergyReport(deviceIds,
   responseForPastData,
   main_response,
   deviceDictionary,
   groupBy)_

   Computes energy consumed by each device per hour,day,month or year(based on the 'groupBy' parameter).

   **Parameters**

   - deviceIds: array of device ids.
   - responseForPastData: timestream data of device before start time as object with deviceIds as keys.
   - main_response: timestream data of device between start time and end time as array of objects.
   - deviceDictionary: an object with key as device id and values as device id and device name.
   - groupBy: the parameter which decides grouping of data for energy consumed calculation. Takes the following values:

     1. "Hr": hour-wise grouping.
     2. "Dy": day-wise grouping.
     3. "MM": month-wise grouping.
     4. "Yr": year-wise grouping.

2. _parseQueryResult(response)_

   Converts a timestream query response object to key value pairs.

   **Parameters**

   - response: timestream query response(object).

   **Example:**

   ```
   const { parseQueryResult } = require("timestream_processing");

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

3. _parseQueryResultWithProcessing(response)_

   Converts a timestream query response object to an array of objects based on column type. Each object of the array represents a row of timestream table.It has keys as column names and values as their corresponding values.

   **Parameters**

   - response: timestream query response(object).

   **Example:**

   ```
   const { parseQueryResultWithProcessing } = require("timestream_processing");

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

   [{id=8910dh1937a73bf82,name=Raj Malhotra,age=25,Gender=M,time=2021-02-22 23:06:03.312000000},{id=738hf3y837932h37r,name=Mehul Bhanushali,age=28,Gender=M,time=2021-02-22 23:07:03.312000000}]

4. _getParsedValue(value,dataType)_

   Converts timestream query response object value(each object from array of objects output from parseQueryResult) to its corresponding data type based on the 'dataType' parameter of response.

   **Parameters**

   - value: value of parameter as string.
   - dataType: data type of parameter as string.

   **Supported Type Conversions(from string)**

   1. _Boolean_(dataType = "BOOL") : true or false
   2. _Float_(dataType = "FLOAT") : floating point number
   3. _Date_(dataType = "DATE"): date in the form YYYY-MM-DD (year-month-date).The supported range is from 1970-01-01 to 2262-04-11.
   4. _TimeOfDay_(dataType = "TOD") : unsigned integer number in milliseconds, with zero equal to midnight.
   5. _Time_(dataType = "TIME") : time of day in UTC.The time datatype is represented in the form HH:MM:SS(hours:minutes:seconds).
   6. _Int_(dataType = "INT"): 32-bit integer.
   7. _Unsigned Int_(dataType = "UINT") : 32-bit unsigned integer.
   8. _Unsigned Short Int_(dataType = "USINT") : 8-bit short(small) integer.
   9. _Unsigned Large Integer_(dataType = "UDINT_R") : 64-bit unsigned large integer.

   **Example**

   ```
   const { getParsedValue } = require("timestream_processing");
   let obj = {
       'measure_value::double': '249.45'
       dataType: 'FLOAT'
   };
   let result = getParsedValue(obj['measure_value::double'],obj.dataType);
   console.log("result = ",result);
   ```

   **Output**

   result = 249.45

5. _groupByKey(response, deviceDictionary, groupBy)_

   Groups array of objects by a grouping parameter and converts key to the form "devicename-parametername".

   **Parameters**

   - response: timestream response as array of objects.
   - deviceDictionary: an object with key as device id and values as device id and device name.
   - groupBy: grouping parameter(any key from response).

   **Example**

   ```
   const { groupByKey } = require("timestream_processing");

   let deviceDictionary = {
   '921791a9r90q8e173': { _id: '921791a9r90q8e173', name: 'Device 1' },
   '1234d8793a837h217': { _id: '1234d8793a837h217', name: 'Device 2' }
   }

   let response = [{
       deviceId: '921791a9r90q8e173',
       time: '2021-02-24 16:31:29',
       dataType: 'FLOAT',
       measure_value::double: '251.14',
       measure_name: 'Voltage 1'
   },
   {
       deviceId: '1234d8793a837h217',
       time: '2021-02-24 16:31:29',
       dataType: 'FLOAT',
       measure_value::double: '219.14',
       measure_name: 'Voltage 2'
   },

   {
       deviceId: '1234d8793a837h217'
       time: '2021-02-24 16:31:39',
       dataType: 'FLOAT',
       measure_value::double: '239.14',
       measure_name: 'Voltage 2'
   }]

   let result = groupByKey(response,deviceDictionary,"time");
   console.log("result = ",result);
   ```

   **Output**

   result = [{
   time: '2021-02-24 16:31:29',
   'Device 1-Voltage 1': 251.14,
   'Device 2-Voltage 2': 219.14
   },{
   time: '2021-02-24 16:31:39',
   'Device 2-Voltage 2': 239.14
   }]
