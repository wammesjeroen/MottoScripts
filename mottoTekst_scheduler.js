/**
 *  Last update: Oct 29 2019
 *  By: Gert van Remmerden
 *
 *  mottoTekst_scheduler is a template for generic devices determening specific 
 *  mottotekst plans to be activated based on
 *  - year
 *  - week
 *  - day of the week
 *  - timeslot
 *  - holiday or special day
 * 
 *  A set of validation rules is added to prevent (to a certain point) invalid input.
 *
 *   For a device based on ths template to work it is required for the script to be activated (ingeschakeld)!
 */

function initialize(){
    logMessage(Date() + " - initialize()")  
    setProperty("this", "mottoTime", "trigger/motto/time/ZN_Tijd_demo4");
    var mottoTime = getProperty("this", "mottoTime")
    
    // First validate configuration before do the runOnExeption
    //  - mottoTime.dateTime is not watched, this will be done by the timeSlot devices
    //  - timeSLot devices will be added to runOnExeptions if we know which ones we need 
    if (validate()) {
        runOnException(mottoTime, "year", "schedule", false);
        runOnException(mottoTime, "week", "schedule", false);
        runOnException(mottoTime, "weekday", "schedule", false);
        runOnException("this", "year", "schedule", false);
        runOnException("this", "week", "schedule", false);
        runOnException("this", "monday", "schedule", false);
        runOnException("this", "tuesday", "schedule", false);
        runOnException("this", "wednesday", "schedule", false);
        runOnException("this", "thursday", "schedule", false);
        runOnException("this", "friday", "schedule", false);
        runOnException("this", "saturday", "schedule", false);
        runOnException("this", "sunday", "schedule", false);
        runOnException("this", "holidays", "schedule", false);
        runOnException("this", "plan", "schedule", false);
        
        schedule();
    } else {
        logMessage("problems with '" + getObjectNameFromRegistryName("this"));
    }
}

function schedule(){
    logMessage(Date() + " - schedule()")
    var mottoTime = getProperty("this", "mottoTime")
    
    if (!validate()) {
        logMessage("problems with '" + getObjectNameFromRegistryName("this"));
        return;
    }
    
    try {
        var year = trimString(getProperty("this", "year"));
        var week = getCleanList(getProperty("this", "week"));
        var monday = getCleanList(getProperty("this", "monday"));
        var tuesday = getCleanList(getProperty("this", "tuesday"));
        var wednesday = getCleanList(getProperty("this", "wednesday"));
        var thursday = getCleanList(getProperty("this", "thursday"));
        var friday = getCleanList(getProperty("this", "friday"));
        var saturday = getCleanList(getProperty("this", "saturday"));
        var sunday = getCleanList(getProperty("this", "sunday"));
        var holidays = getCleanList(getProperty("this", "holidays"));
        var plan = trimString(getProperty("this", "plan"));
        var activePlan = trimString(getProperty("this", "activePlan"));
        
        // to make sure only timeslots of interest are looked at we first stop looking at all of them
        // the ones we are interested in will be added later
        var allTimeSlots = monday.concat(tuesday).concat(wednesday).concat(thursday).concat(friday).concat(saturday).concat(sunday).concat(holidays).unique();
        for (var i = 0; i < allTimeSlots.length; i++){
            stopRunOnException(getFullName(allTimeSlots[i],"trigger/motto/timeSlot"), "output")
        }
        
        // The scheduler is supposed to be active until proven it should not be active
        var shouldBeActive = true

        // If today is a special day this scheduler should not be active
        var isSpecialDay = getProperty(mottoTime , "isSpecialDay"); 
        if (shouldBeActive && !isSpecialDay) {
            logMessage("het is vandaag geen speciale dag");
        } else {
            shouldBeActive = false;
            logMessage("vandaag is een speciale dag");
        }
        
        // If current year is not the year this scheduler is about, it should not be active
        var currentYear = getProperty(mottoTime , "year"); 
        if (shouldBeActive && (year === year.toString())) {
            logMessage("het juiste jaar (" + currentYear + ")");
        } else {
            shouldBeActive = false;
            logMessage("niet het juiste jaar (" + currentYear + ")");
        }
        
        // If current week is not one of the weeks this scheduler is about, it should not be active
        var currentWeek = getProperty(mottoTime , "week"); 
        if ( shouldBeActive && (week.indexOf(currentWeek.toString())) >= 0 ) {
            logMessage("de juiste week (" + currentWeek + ")");
        } else {
            shouldBeActive = false;
            logMessage("niet de juiste week (" + currentWeek + ")");
        }

        // If current day is a holiday,
        // but current time is not in one of the timeslots for tholidays, this scheduler should not be active
        var isHoliday = getProperty(mottoTime , "isHoliday"); 
        if ( shouldBeActive && isHoliday) {
            var inActiveTimeSlot = false
            for (var i = 0; i < holidays.length; i++){
                var activeTimeSlot = getProperty(getFullName(holidays[i],"trigger/motto/timeSlot"), "output");
                if ( activeTimeSlot ) {
                   inActiveTimeSlot = true;
                   logMessage("Active thanks to: " + holidays[i])  
                }
                // This way only timeSlots of interest are looked at
                runOnException(getFullName(holidays[i],"trigger/motto/timeSlot"), "output", "schedule", false); 
            }
            shouldBeActive = inActiveTimeSlot;

            if (!shouldBeActive)
                logMessage("het is vandaag een feestdag, maar nu is niet het juiste tijdslot.");
        }
        
        // If current time is not in one of the timeslots for the current day of the week, this scheduler should not be active
        if ( shouldBeActive && !isHoliday ) { // If it is a holiday we don't care about what day it is
            var inActiveTimeSlot = false
            var currentWeekDay = getProperty(mottoTime , "weekday"); 
            var activeTimeSlots = []
            
            switch(currentWeekDay) {
                case 1: //today is a Monday
                    activeTimeSlots = monday;
                    break;
                case 2:
                    activeTimeSlots = tuesday;
                    break;
                case 3:
                    activeTimeSlots = wednesday;
                    break;
                case 4:
                    activeTimeSlots = thursday;
                    break;
                case 5:
                    activeTimeSlots = friday;
                    break;
                case 6:
                    activeTimeSlots = saturday;
                    break;
                case 7:
                    activeTimeSlots = sunday;
                    break;
                default:
                    logMessage("day of the week is incorrect (" + currentWeekDay + ")");
            }
            for (var i = 0; i < activeTimeSlots.length; i++){
                var activeTimeSlot = getProperty(getFullName(activeTimeSlots[i],"trigger/motto/timeSlot"), "output");
                if ( activeTimeSlot ) {
                   inActiveTimeSlot = true;
                   logMessage("Active thanks to: " + activeTimeSlots[i]) 
                }
                runOnException(getFullName(activeTimeSlots[i],"trigger/motto/timeSlot"), "output", "schedule", false); 
            }
            shouldBeActive = inActiveTimeSlot;
        }
        
        if (shouldBeActive) {;
            if (activePlan !== "") {
               logMessage(Date() + " - active plan: " + activePlan)
               activePlanName = activePlan.split(" ")[0];
               logMessage("active plan name: " + activePlanName)
               if (plan !== activePlanName) {
                   setProperty("this", "activeSince", Date());
                   logMessage("----> different plan for this scheduler");
                   terminatePlan(activePlan)
                   logMessage("----> terminated plan: " + activePlan);
                   var executedPlan = executePlan(plan);
                   setProperty("this", "activePlan", executedPlan); 
                   logMessage("----> executed plan: " + executedPlan);
               }
            } else {
                   logMessage(Date() + " - no active plan")
                   logMessage("----> this scheduler goes active");
                   var executedPlan = executePlan(plan);
                   setProperty("this", "activePlan", executedPlan)
                   setProperty("this", "activeSince", Date());
                   logMessage("----> executed plan: " + executedPlan);
            }
        } else {
            activePlanName = activePlan.split(" ")[0];
            if (activePlan !== "") {
                 logMessage(Date() + " - This scheduler is no longer active");
                 logMessage("----> to be terminated plan: " + activePlan);
                 logMessage("----> " + terminatePlan(activePlan))
                 setProperty("this", "activePlan", ""); 
                 setProperty("this", "lastActive", getProperty("this", "activeSince"));
                 setProperty("this", "activeSince", "");
            } 
        }
        
        
    } catch(err) {
        logMessage(Date() + " - Problem scheduling: " + err);
    }
}

// Extension on array to make sure all elements are unique 
Array.prototype.unique = function() {
  return this.filter(function (value, index, self) { 
    return self.indexOf(value) === index;
  });
}

// Validates the configuration for this device
// If there are no problems with the configuration, the validationResults should be "OK"
function validate(){    
    var mottoTime = getProperty("this", "mottoTime")
    var year = trimString(getProperty("this", "year"));
    var week = getCleanList(getProperty("this", "week"));
    var monday = getCleanList(getProperty("this", "monday"));
    var tuesday = getCleanList(getProperty("this", "tuesday"));
    var wednesday = getCleanList(getProperty("this", "wednesday"));
    var thursday = getCleanList(getProperty("this", "thursday"));
    var friday = getCleanList(getProperty("this", "friday"));
    var saturday = getCleanList(getProperty("this", "saturday"));
    var sunday = getCleanList(getProperty("this", "sunday"));
    var dayAfter = getCleanList(getProperty("this", "dayAfter"));
    var holidays = getCleanList(getProperty("this", "holidays"));
    var plan = trimString(getProperty("this", "plan"));
     
    
    var result = [];
    
    if (mottoTime === "") {
        var validationResult = "mottoTime is required";
        logMessage(validationResult);
        result.push(validationResult);
    } else if (!exists(mottoTime)) {
        var validationResult = "mottoTime '" + mottoTime + "' not found";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    if (year === "") {
        var validationResult = "year is required";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    if (year < 2019 || year > 2050) { //Beware: this is arbitrary
        var validationResult = "year should be >= 2019 and <= 2050";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    if (week.length < 1) {
        var validationResult = "at least 1 week is required";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    for (var i = 0; i < week.length; i++){
        if (week[i] < 1 || week[i] > 53) {
            var validationResult = "week '" + week[i] + "' is not a valid value";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < monday.length; i++){
        if (!exists(monday[i],"trigger/motto/timeSlot")) {
            var validationResult = "monday timeslot  '" + monday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }

    for (var i = 0; i < tuesday.length; i++){
        if (!exists(tuesday[i],"trigger/motto/timeSlot")) {
            var validationResult = "tuesday timeslot  '" + tuesday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < wednesday.length; i++){
        if (!exists(wednesday[i],"trigger/motto/timeSlot")) {
            var validationResult = "wednesday timeslot  '" + wednesday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < thursday.length; i++){
        if (!exists(thursday[i],"trigger/motto/timeSlot")) {
            var validationResult = "thursday timeslot  '" + thursday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < friday.length; i++){
        if (!exists(friday[i],"trigger/motto/timeSlot")) {
            var validationResult = "friday timeslot  '" + friday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < saturday.length; i++){
        if (!exists(saturday[i],"trigger/motto/timeSlot")) {
            var validationResult = "saturday timeslot  '" + saturday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    for (var i = 0; i < sunday.length; i++){
        if (!exists(sunday[i],"trigger/motto/timeSlot")) {
            var validationResult = "sunday timeslot  '" + sunday[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }

    for (var i = 0; i < holidays.length; i++){
        if (!exists(holidays[i],"trigger/motto/timeSlot")) {
            var validationResult = "holiday timeslot  '" + holidays[i] + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    if (plan === "") {
        var validationResult = "Scenario is required";
        logMessage(validationResult);
        result.push(validationResult);
    }
    
    if (plan !== "") {
        if (!exists(plan, "plans")) {
            var validationResult = "Scenario '" + plan + "' not found";
            logMessage(validationResult);
            result.push(validationResult);
        }
    }
    
    if (result.length === 0) { 
        setProperty("this", "validationResult", "OK"); 
        return true
    } else {
        setProperty("this", "validationResult", result.join(", ")); 
        return false
    }
}


// returns true if device exists.
function exists(name, namespace) {
    var fullName = getFullName(name,namespace);
    try {
        var test = getObjectNameFromRegistryName(fullName)
        return true;
    } catch (err) {
        return false
    }
}

// removes spaces and empty items from stringArray, at least returning an empty list
function getCleanList(stringArray) {
    if (!(stringArray)) {
        return [];
    }
    
    var strs = stringArray.split(',');
    var result = [];
    var numberOfItems = strs.length;
    for (var i=0;i < numberOfItems;i++) {
        var trimmedStr = trimString(strs[i])
        if ((trimmedStr) && (result.indexOf(trimmedStr) < 0)) { 
            result.push(trimmedStr);
        }
    }
    return result;
}

// removes spaces at the beginning and end of a string 
function trimString(str) {
    if (str) {
        return str.replace(/^\s\s*/,'').replace(/\s\s*$/,''); 
    }
    return str;
}

// returns the correct full registry name
function getFullName(name, nameSpace) {
    if (!(name)) return undefined
    if (!(nameSpace)) return name
    
    var registryName = name
    var nameElements = name.split("/")
    if (nameElements.length === 1 ) {
        registryName = nameSpace + "/" + name
        return registryName
    } else if (nameElements.length > 1) {
        name = nameElements.pop()
        var lNameSpace = nameElements.join("/")
        if (lNameSpace !== nameSpace) {
            return undefined
        } else {
            return registryName
        }
    }
    return undefined
}