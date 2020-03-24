/**
 *  Last update: Oct 15 2019
 *  By: Gert van Remmerden
 *
 *  mottoTijd is a template for generic devices setting a number of properties used by
 *  both timeSlot and mottoTekst_scheduler devices.
 *
 *  It keeps track of the system time to determine:
 *   - date (dd/mm/yyyy, e.g. 21/06/2019 for June 21st 2019)
 *   - the week number (e.g. 41)
 *   - day of the week (monday = 0 ....)
 *   - year (e.g. 2019)
 *   - if date is a holiday (based on property Holidays, a list of dates)
 *   - if date is a special day (based on property SpecialDays, a list of dates)
 *
 *   For testing/demo purposes it is possible to overrule the system time by setting
 *   - demo (true if you want to overrule)
 *   - demoDate (required date if demo is true (e.g. 15/12/2019))
 *   - demoTime (required time if demo is true (e.g. 15:45))
 *
 *   A set of validation rules is added to prevent (to a certain point) invalid input.
 *
 *   For mottoTekst_scheduler to work an active mottoTijd device is required with script on!
 */

function initialize() {
    logMessage(Date() + " - initialize()") 
    
    //watch serverDate for changes in time
    runOnException(
      "system/servers/PrimaryServer_VCZN",
      "serverDate",
      "respondToTimeChange",
      false
    );
    
    //watch input "demo", "demo time", "demo date", "special days" and "holidays" and validate on change
    runOnException("this", "demo", "validate", false);
    runOnException("this", "demoDate", "validate", false);
    runOnException("this", "demoTime", "validate", false);
    runOnException("this", "SpecialDays", "validate", false);
    runOnException("this", "Holidays", "validate", false);
    
    //watch "dateTime" for changes to react on date changes (not based on time, but date)
    runOnException("this", "date", "respondToDateChange", false);
  
    if (validate()) {
      respondToTimeChange();
      respondToDateChange();
    } else {
        logMessage(
        "something wrong with '" + getObjectNameFromRegistryName("this") + "'!"
      );
    }
  }
  
  function respondToTimeChange() {
    if ( getProperty("this", "validationResult")!== "OK" ) {
       return 
    }
  
    var demo = getProperty("this", "demo");
    var demoDate = trimString(getProperty("this", "demoDate"));
    var demoTime = trimString(getProperty("this", "demoTime"));
  
    var now = new Date()
    now.setSeconds(0,0)
    var fullDate = now.toString();

    if (demo) {
      var tempDateArray = fullDate.split(" ");
      tempDateArray[4] = demoTime + ":00";
      fullDate = tempDateArray.join(" ");
  
      var splitDemoDate = demoDate.split("/");
      if (splitDemoDate.length === 3) {
        try {
          d = new Date(fullDate);
          dag = parseInt(splitDemoDate[0], 10);
          maand = parseInt(splitDemoDate[1], 10) - 1;
          y = parseInt(splitDemoDate[2], 10);
          d.setDate(dag);
          d.setMonth(maand);
          d.setFullYear(y);
          d.setSeconds(0,0)
          fullDate = d.toString();
        } catch (err) {
          logMessage("Datum fout: " + err);
        }
      } else {
        logMessage("Datum fout: " + demoDate + " en " + demoTime);
      }
    }
    
    if (fullDate !== getProperty("this", "dateTime")) {
        setProperty("this", "dateTime", fullDate);
        logMessage(Date() + " - respondToTimeChange(): dateTime set to: " + getProperty("this", "dateTime"))
    }
    var dt = getFormattedDate(new Date(fullDate));
    if (dt !== getProperty("this", "date")) {   
        setProperty("this", "date", dt);
        logMessage(Date() + " - respondToTimeChange(): date set to: " + getProperty("this", "date"))
    }
  }
  
  function respondToDateChange() {
    if ( getProperty("this", "validationResult")!== "OK" ) {
       return 
    } else {
        logMessage(Date() + " - respondToDateChange()");
    }
    
    var weekDayNumbers = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
      Sun: 7
    };
  
    var fullDate = getProperty("this","dateTime")
  
    var dateArray = fullDate.split(" ");
    var day = dateArray[0];
    var year = dateArray[3];
    var weekNumber = getWeekNumber(fullDate);   
    var dateTime = dateArray.join(" ");

    try {
      setProperty("this", "weekday", weekDayNumbers[day]);
      setProperty("this", "year", year);
      setProperty("this", "week", weekNumber);
      setProperty("this", "dateTime", dateTime);
    } catch (err) {
      logMessage(err);
    }
    
    determineSpecialDays()
  }
  
  function determineSpecialDays() {
    if ( getProperty("this", "validationResult")!== "OK" ) {
       return 
    } else {
        logMessage(Date() + " - determineSpecialDays())");
    }
    //Holidays
    var holidays = getCleanList(getProperty("this", "Holidays"));
    var date = getProperty("this", "date");
    var isHoliday = false;
    for (var i = 0; i < holidays.length; i++) {
      isHoliday = isHoliday || holidays[i] === date;
    }
    setProperty("this", "isHoliday", isHoliday);
  
    //Special days
    var specialDays = getCleanList(getProperty("this", "SpecialDays"));
    var date = getProperty("this", "date");
    var isSpecialDay = false;
    for (var i = 0; i < specialDays.length; i++) {
      isSpecialDay = isSpecialDay || specialDays[i] === date;
    }
    setProperty("this", "isSpecialDay", isSpecialDay);
  }
  
  function getFormattedDate(date) {
    var month = date.getMonth() + 1;
    var fmonth = month > 9 ? month.toString() : "0" + month;
    var day = date.getDate();
    var fday = day > 9 ? day.toString() : "0" + day;
    return fday + "/" + fmonth + "/" + date.getFullYear();
  }
  
  function validate() {
    logMessage(Date() + ": validate()");
    var demo = getProperty("this", "demo");
    var demoDate = trimString(getProperty("this", "demoDate"));
    var demoTime = trimString(getProperty("this", "demoTime"));
    var holidays = getCleanList(getProperty("this", "Holidays"));
    var specialDays = getCleanList(getProperty("this", "SpecialDays"));
    var result = [];
  
    // only validate demo properties when demo is checked
    if (demo) {
      if (demoDate === "") {
        var validationResult = "demo datum is required";
        logMessage(validationResult);
        result.push(validationResult);
      } else if (!validDate(demoDate)) {
          var validationResult = "demo date '" + demoDate + "'" + " is not a valid";
          logMessage(validationResult);
          result.push(validationResult);
      } else {
          logMessage("demoDate: " + demoDate)
      }
      
      if (demoTime === "") {
        var validationResult = "demo tijd is required";
        logMessage(validationResult);
        result.push(validationResult);
      } else if (!validTime(demoTime)) {
          var validationResult = "demo time '" + demoTime + "'" + " is not a valid";
          logMessage(validationResult);
          result.push(validationResult);
      }
    }
  
    var formattedHolidays = holidays;
    for (var i = 0; i < holidays.length; i++) {
      logMessage("date: " + holidays[i])
      if (!validDate(holidays[i])) {
        var validationResult = "feestdag  '" + holidays[i] + "' incorrect date";
        result.push(validationResult);
        logMessage(validationResult);
      }
    }
  
    for (var i = 0; i < specialDays.length; i++) {
      logMessage("date: " + specialDays[i])
      if (!validDate(specialDays[i])) {
        var validationResult = "speciale dag  '" + specialDays[i] + "' incorrect date";
        result.push(validationResult);
        logMessage(validationResult);
      }
    }
  
    if (result.length === 0) {
      setProperty("this", "validationResult", "OK");
      respondToTimeChange();
      return true;
    } else {
      setProperty("this", "validationResult", result.join(", "));
      return false;
    }
  }
  
  function getWeekNumber(dt) 
  {
     var tdt = new Date(dt);
     var dayn = (tdt.getDay() + 6) % 7;
     tdt.setDate(tdt.getDate() - dayn + 3);
     var firstThursday = tdt.valueOf();
     tdt.setMonth(0, 1);
     if (tdt.getDay() !== 4) 
       {
      tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
        }
     return 1 + Math.ceil((firstThursday - tdt) / 604800000);
  }
  
  // removes spaces and empty items from stringArray, at least returning an empty list
  function getCleanList(stringArray) {
    if (!stringArray) {
      return [];
    }
  
    var strs = stringArray.split(",");
    var result = [];
    var numberOfItems = strs.length;
    for (var i = 0; i < numberOfItems; i++) {
      var trimmedStr = trimString(strs[i]);
      if (trimmedStr && result.indexOf(trimmedStr) < 0) {
        result.push(trimmedStr);
      }
    }
    return result;
  }
  
  // removes spaces at the beginning and end of a string
  function trimString(str) {
    if (str) {
      return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }
    return str;
  }
  
  function getFormattedDate(date) {
    var month = date.getMonth() + 1;
    var fmonth = month > 9 ? month.toString() : "0" + month;
    var day = date.getDate();
    var fday = day > 9 ? day.toString() : "0" + day;
    return fday + "/" + fmonth + "/" + date.getFullYear();
  }
  
  function validTime(time) {
      var patt = new RegExp(/^([0-2][0-9]|2[0-3]):[0-5][0-9]$/)
      var valid = patt.test(time);
      if (valid) {
          var timeElements = time.split(":");
          if ((parseInt(timeElements[0],10) < 0) || 
              (parseInt(timeElements[0],10) > 24)||
              (parseInt(timeElements[1],10) < 0) || 
              (parseInt(timeElements[1],10) > 59) ||
               ( (parseInt(timeElements[0],10) === 24) && (parseInt(timeElements[1],10) > 0))) {
              valid = false
          }
      }
      return valid
  }
  
  function validDate(date) {
      var patt = new RegExp(/^([0-2][0-9]|(3)[0-1])(\/)(((0)[0-9])|((1)[0-2]))(\/)\d{4}$/)
      var valid = patt.test(date);
      logMessage("check op pattern (" + date + "): " + valid)
      var dateElements = date.split("/");
      if (valid) {
          if ((parseInt(dateElements[0],10) < 0) || 
              (parseInt(dateElements[0],10) > 31)||
              (parseInt(dateElements[1],10) < 0) || 
              (parseInt(dateElements[1],10) > 12) ||
              (parseInt(dateElements[2],10) < 2019) || 
              (parseInt(dateElements[2],10) > 2050) ) {
              logMessage("check op nummers: " + valid)
              return false
          }
      }
      
      var d = new Date(dateElements[1] + "/" + dateElements[0] + "/" + dateElements[2]);
      
      if (valid) {
        valid = d instanceof Date && !isNaN(d)
        logMessage("check op isDate: " + valid)
      }
      if (valid) {   // something to do with how javascript parses a date string
          var month = d.getMonth() + 1
          var day = d.getDate()
          if ( (month !== parseInt(dateElements[1], 10) ) || (day !== parseInt(dateElements[0], 10) ) ) {
              valid = false
          }
          logMessage("check op maand: " + valid)
      }
      return valid
  }