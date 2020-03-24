/**
 *  Last update: Oct 11 2019
 *  By: Gert van Remmerden
 *
 *  timeSlot is a template for generic devices with one boolean output determining 
 *  if current system time is in between fromTime and tillTime  
 * 
 *  A set of validation rules is added to prevent (to a certain point) invalid input.
 *
 *   For a device based on ths template to work it is required for the script to be activated (ingeschakeld)!
 */


function initialize(){
    logMessage(Date() + " - initialize()")
    // TODO: mottoTime hardcoded like this is not ideal (especially since almost every function in here needs one). 
    // This depends on the multi-node reality (where do devices live and what can be reached) and might have to be changed. 
    var mottoTime = "trigger/motto/time/ZN_Tijd_demo4"
    
    if (validate()) {
        runOnException( mottoTime, "dateTime", "inTimeSlot", false);
        runOnException("this", "fromTime", "validate", false);
        runOnException("this", "tillTime", "validate", false);     
    } else {
        logMessage("problems with '" + getObjectNameFromRegistryName("this"));
    }
}

function inTimeSlot(){
    logMessage(Date() + " - inTimeSlot()")
    
    if ( getProperty("this", "validationResult")!== "OK" ) {
      return 
    } else {
      logMessage(Date() + " - respondToTimeChange()");
    }
     
    var mottoTime = "trigger/motto/time/ZN_Tijd_demo4"
    var fromTime = getProperty("this", "fromTime");
    var tillTime = getProperty("this", "tillTime");
    var dateTime = getProperty(mottoTime, "dateTime");

    try {
        var fullDate = new Date(dateTime);

        var fromDate = new Date(dateTime);
        var timeElementsFrom = fromTime.split(":");
        fromDate.setHours(parseInt(timeElementsFrom[0],10));
        fromDate.setMinutes(parseInt(timeElementsFrom[1],10));
        fromDate.setSeconds(0);

        var tillDate = new Date(dateTime);
        var timeElementsTill = tillTime.split(":");
        tillDate.setHours(parseInt(timeElementsTill[0],10));
        tillDate.setMinutes(parseInt(timeElementsTill[1],10));
        tillDate.setSeconds(0);
        
        logMessage("fromtime: " + fromDate)
        logMessage("datetime: " + dateTime)
        logMessage("tilltime: " + tillDate)
        
        var output = ( fromDate <= fullDate && fullDate <= tillDate )
        logMessage("output: " + output)
        setProperty("this" , "output", output)
    } catch(err) {
        logMessage("Error in TimeSlot" + err);
        setProperty("this" , "output", false)
    }
    
}

function validate(){
    logMessage(Date() + " - validate()")
    var fromTime = getProperty("this", "fromTime");
    var tillTime = getProperty("this", "tillTime");
    
    var result = [];
    var mottoTime = "trigger/motto/time/ZN_Tijd_demo4" 
    
    try {
        var dateTime = getProperty(mottoTime, "dateTime");
    } catch(err) {
       var validationResult = mottoTime + " can not be found";
       logMessage(validationResult);
       result.push(validationResult); 
    }
    
    var fromTimeOK = true;
    var tillTimeOK = true;
    
    if (!validTime(fromTime)) {
        var validationResult = "'van' time '" + fromTime + "'" + " is not a valid";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    if (!validTime(tillTime)) {
        var validationResult = "'tot' time '" + tillTime + "'" + " is not a valid";
        logMessage(validationResult);
        result.push(validationResult);
    }   
    
    if (fromTimeOK && tillTimeOK && ( fromTime === tillTime )) {
        var validationResult = "'van' and 'tot' time cannot be the same";
        tillTimeOK = false;
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    
    if (fromTimeOK && tillTimeOK  && ( fromTime !== tillTime )) {
        var testTimeFrom = new Date(); 
        var timeElementsFrom = fromTime.split(":");
        testTimeFrom.setHours(parseInt(timeElementsFrom[0],10));
        testTimeFrom.setMinutes(parseInt(timeElementsFrom[1],10));
        testTimeFrom.setSeconds(0);
        
        var testTimeTill = new Date(); 
        var timeElementsTill = tillTime.split(":");
        testTimeTill.setHours(parseInt(timeElementsTill[0],10));
        testTimeTill.setMinutes(parseInt(timeElementsTill[1],10));
        testTimeTill.setSeconds(0);
        
        if ( testTimeFrom >= testTimeTill) {
            var validationResult = "'tot' time needs tot be 'later' than 'van' time";
            tillTimeOK = false;
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    if (result.length === 0) { 
        setProperty("this", "validationResult", "OK"); 
        inTimeSlot()
        return true
    } else {
        setProperty("this", "validationResult", result.join(", ")); 
        return false
    }
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

// removes spaces at the beginning and end of a string 
function trimString(str) {
    if (str) {
        return str.replace(/^\s\s*/,'').replace(/\s\s*$/,''); 
    }
    return str;
}