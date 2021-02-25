**timestream-processing**

A package for parsing result of timestream query and also for generating energy report.

**APIS**

1. _generateEnergyReport(deviceIds,
   responseForPastData,
   main_response,
   deviceDictionary,
   groupBy)_

   Computes energy consumed by each device per hour,day,month or year(based on the 'groupBy' parameter).Takes the following parameters.

   - responseForPastData: timestream data of device before start time as key-value pairs.
   - main_response: timestream data of device between start time and end time as key-value pairs.
   - deviceDictionary: an object with key as device id and values as device id and device name.
   - groupBy: the parameter which decides grouping of data for energy consumed calculation. Takes the following values:
     1. "Hr": hour-wise grouping.
     2. "Dy": day-wise grouping.
     3. "MM": month-wise grouping.
     4. "Yr": year-wise grouping.
