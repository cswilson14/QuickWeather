var googleApiKey = "AIzaSyCs3gX-JGCBeUF-nIoHSPyY26iiFt0lEec";
var weatherApiKey = "2f2735f67fe99a15882fc1f8efef851c";

var locationNameLookupURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";
var coordinatesLookupURL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
var weatherURL = "https://api.darksky.net/forecast/";

var fahrenheit = true;

var global_lat;
var global_long;

var twoDayUpdated = false;
var sevenDayUpdated = false;

var two_day = 0;
var seven_day = 1;

var mode = two_day;

/* Converts a given weather condition to the HTML content
 * representing the associated weather icon.  This function
 * is compatible with Dark Sky's API "icon" value.
 *
 * Mode: Two-day and Seven-day
 */
function getIcon(icon_text) {
  var thunderStorm = '<div class="icon thunder-storm"><div class="cloud"></div><div class="lightning"><div class="bolt"></div><div class="bolt"></div></div></div>';
  var cloudy = '<div class="icon cloudy"><div class="cloud"></div><div class="cloud"></div></div>';
  var snow = '<div class="icon flurries"><div class="cloud"></div><div class="snow"><div class="flake"></div><div class="flake"></div></div></div>';
  var clear_day = '<div class="icon sunny"><div class="sun"><div class="rays"></div></div></div>';
  var clear_night = '<div class="icon clear-moon"><div class="moon"><div class="star"></div><div class="star"></div></div></div>';
  var rain = '<div class="icon rainy"><div class="cloud"></div><div class="rain"></div></div>';
  var partly_cloudy_day = '<div class="icon partly-cloudy"><div class="cloud"></div><div class="sun"><div class="rays"></div></div></div>';
  var partly_cloudy_night = '<div class="icon cloudy-moon"><div class="cloud"></div><div class="moon"><div class="star"></div><div class="star"></div></div></div>';
  switch(icon_text) {
    case "clear-day":
      return clear_day;
    case "clear-night":
      return clear_night;
    case "partly-cloudy-day":
      return partly_cloudy_day;
    case "partly-cloudy-night":
      return partly_cloudy_night;
    case "cloudy":
    case "wind":
    case "fog":
      return cloudy;
    case "rain":
      return rain;
    case "sleet":
    case "snow":
      return snow;
  }
  return "no icon found";
}

/* Converts a number (0-6) to its corresponding day
 * of the week String representation.
 * 0 = Sunday, 1 = Monday, etc...
 *
 * Mode: Two-day and Seven-day
 */
function getDayString(day) {
  switch(day) {
    case 0:
      return "Sunday";
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
  }
  return "Unable to find day...";
}

/* Converts a given time value to a String representation.
 * "time" argument can be 0-23 for military time, or a
 * UNIX timestamp.
 *
 * Mode: Two-day and Seven-day
 */
function getTimeString(time) {
  if(time === 0) { return "12:00 AM"; }
  else if(time < 12) { return time + ":00 AM"; }
  else if(time == 12) { return time + ":00 PM"; }
  else if(time < 24) { return (time - 12) + ":00 PM"; }
  
  var d = new Date(time);
  var hour = d.getHours();
  var minutes = d.getMinutes();
  
  if(minutes === 0) { minutes = "00"; }
  else if(minutes < 10) { minutes = "0" + minutes; }
  
  if(hour === 0) { return "12:" + minutes + " AM"; }
  else if(hour < 12) { return hour + ":" + minutes + " AM"; }
  else if(hour == 12) { return hour + ":" + minutes + " PM"; }
  else if(hour < 24) { return (hour - 12) + ":" + minutes + " PM"; }
  else {
    console.error("error in getTimeString: Invalid hour " + hour);
    return "Error";
  }
}

/* Returns the URL for the Google Maps API which contains the 
 * corresponding location name to the given latitude and longitude
 * coordinates.
 *
 * Mode: Two-day and Seven-day
 */
function getLocationNameLookupURL(lat, long) {
  var url = locationNameLookupURL;
  url += lat + "," + long;
  url += "&key=" + googleApiKey;
  return url;
}

/* Returns the URL for the Google Maps API which contains
 * the latitude and longitude coordinates for a given
 * address or location.
 *
 * Mode: Two-day and Seven-day
 */
function getCoordinatesLookupURL(address) {
  var url = coordinatesLookupURL;
  url += address;
  url += "&key=" + googleApiKey;
  return url;
}

/* Returns the URL for the weather API which contains the data
 * a span of 24 hours.  Takes latitude and longitude, as well
 * as a UNIX timestamp as arguments.  Hourly data starts at
 * the exact time noted on the timestamp.
 *
 * Mode: Two-day only.
 */
function getHourlyWeatherURL(lat, long, timestamp) {
  var exclusions = ["flags", "minutely", "alerts", "currently"];
  var url = weatherURL;
  url += weatherApiKey + "/";
  url += lat + "," + long;
  url += "," + timestamp;
  url += "?exclude=" + exclusions.join() + "&callback=?";
  console.log("Calling API: " + url);
  return url;
}

/* Returns the URL for the weather API which contains the data
 * for the whole seven day forecast.  Takes latitude and longitude
 * coordinates as arguments
 *
 * Mode: Seven-day only.
 */
function getSevenDayWeatherURL(lat, long) {
  var exclusions = ["currently", "flags", "minutely", "hourly", "alerts"];
  var url = weatherURL;
  url += weatherApiKey + "/";
  url += lat + "," + long;
  url += "?exclude=" + exclusions.join() + "&callback=?";
  console.log("Calling API: " + url);
  return url;
}

/* Uses HTML5 Geolocation to locate the user's latitude and longitude coordinates,
 * then gets the the weather for those coordinates.
 *
 * If geolocation fails, sets the "Current Location" text to a failure message
 * and keeps content hidden.
 *
 * Mode: Two-day and Seven-day
 */
function getCurrentLocation() {
    $("#current_location").html('<i class="fa fa-refresh fa-spin fa-fw"></i> Detecting...');
    $("#content_two_day").stop().fadeOut();
    $("#content_seven_day").stop().fadeOut();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function success(position) {
          lat = position.coords.latitude;
          long = position.coords.longitude;
          getLocationName(lat,long);
          if(mode == two_day) {
            sevenDayUpdated = false;
            getTwoDayWeather(lat,long);
          }
          else {
            twoDayUpdated = false;
            getSevenDayWeather(lat,long);
          } 
          global_lat = lat;
          global_long = long;
        }, 
        function errorCallback(error) {
          $("#current_location").html("Failed to detect location.");
          global_lat = -1;
          global_long = -1;
        },
        {
          maximumAge:Infinity,
          timeout:10000
        }
      );
    } 
    else {
      $("#current_location").html("Geolocation is not supported by this browser.");
      global_lat = -1;
      global_long = -1;
    }
}

/* A wrapper function which gets the 24 hour weather for today
 * and tomorrow and updates all relevent page content.
 *
 * Mode: Two-day only
 */
function getTwoDayWeather(lat, long) {
  getHourlyWeather(lat,long,"td");
  getHourlyWeather(lat,long,"tm");
}

/* Uses the Dark Sky API to get 7-day weather data
 * for specified latitude and longitude coordinates.
 * Day can be either "td" or "tm" for today or tomorrow
 * respectively.
 *
 * Mode: Two-day only
 */
function getSevenDayWeather(lat, long) {
  $.getJSON(getSevenDayWeatherURL(lat,long), function(data) {
    $("#summary7").html(data.daily.summary);
    for(var i=1;i<=data.daily.data.length;i++) {
      var day = data.daily.data[i-1];
      var d = new Date(day.time * 1000);
      var dayString = getDayString(d.getDay());
      $("#day_title_" + i).html(dayString);
      $("#weather_icon_" + i).html(getIcon(day.icon));
      $("#conditions_" + i).html(day.summary);
      $("#time_low_" + i).html(getTimeString(day.temperatureMinTime * 1000));
      $("#time_high_" + i).html(getTimeString(day.temperatureMaxTime * 1000));
      $("#sunset_time_" + i).html(getTimeString(day.sunsetTime * 1000));
      $("#chance_rain_" + i).html(Math.round(day.precipProbability * 100));
      $("#wind_speed_" + i).html(day.windSpeed);
      if(!fahrenheit) {
        $("#temperature_low_" + i).html(toCelsius(day.temperatureMin));
        $("#temperature_high_" + i).html(toCelsius(day.temperatureMax));
      }
      else {
        $("#temperature_low_" + i).html(Math.round(day.temperatureMin));
        $("#temperature_high_" + i).html(Math.round(day.temperatureMax));
      }
    }
    $("#content_seven_day").stop().css("display", "flex").hide().fadeIn();
    sevenDayUpdated = true;
  });
  
}

/* Updates the "Curent Location" text to the name of the latitude and longitude
 * passed as arguments
 *
 * Mode: Two-day and Seven-day
 */
function getLocationName(lat, long) {
  $.getJSON(getLocationNameLookupURL(lat,long), function(data) {
    var locationName = data.results[0].formatted_address;
    if(data.status == "ZERO_RESULTS") {
      $("#current_location").html("Location not found.");
    }
    else {
      $("#current_location").html(locationName);
    }
  });
}

/* Uses the Dark Sky API to get 24-hour weather data
 * for a single day and for specified latitude and 
 * longitude coordinates.  Day can be either "td" or
 * "tm" for today, and tomorrow respectively.
 *
 * Mode: Two-day only
 */
function getHourlyWeather(lat, long, day) {
  var d = new Date();
  var currentHour;
  var ms;
  if(day == "td") {
    currentHour = d.getHours();
    d.setHours(0,0,0,0); // Set time to 12:00 AM
  }
  else if(day == "tm") {
    d.setTime(d.getTime() + 86400000);
  }
  else {
    console.error("Invalid day: " + day);
    return false;
  }
  ms = Math.floor(d.getTime() / 1000); // Timestamp for midnight this morning
  $.getJSON(getHourlyWeatherURL(lat,long,ms), function(data) {
    var minTemperature = Math.round(data.daily.data[0].temperatureMin);
    var maxTemperature = Math.round(data.daily.data[0].temperatureMax);
    var morningTemp = Math.round(data.hourly.data[8].temperature);
    var afternoonTemp = Math.round(data.hourly.data[14].temperature);
    var eveningTemp = Math.round(data.hourly.data[20].temperature);
    if (!fahrenheit) {
      minTemperature = toCelsius(minTemperature);
      maxTemperature = toCelsius(maxTemperature);
      morningTemp = toCelsius(morningTemp);
      afternoonTemp = toCelsius(afternoonTemp);
      eveningTemp = toCelsius(eveningTemp);
    }
    var minTempTime = getTimeString(data.daily.data[0].temperatureMinTime * 1000);
    var maxTempTime = getTimeString(data.daily.data[0].temperatureMaxTime * 1000);
    var morningIcon = data.hourly.data[8].icon;
    var afternoonIcon = data.hourly.data[14].icon;
    var eveningIcon = data.hourly.data[20].icon;
    var sunsetTime = getTimeString(data.daily.data[0].sunsetTime * 1000);
    
    if(day == "tm") {
      var icon = data.daily.data[0].icon;
      var summary = data.daily.data[0].summary;
      $("#" + day + "_weather_icon").html(getIcon(icon));
      $("#" + day + "_conditions").html(summary);
    }
    else if(day == "td") {
      var now = $.grep(data.hourly.data, function(e) { 
        return getTimeString(e.time * 1000) == getTimeString(currentHour); 
      });
      $("#" + day + "_weather_icon").html(getIcon(now[0].icon));
      $("#" + day + "_conditions").html(now[0].summary);
      if(fahrenheit) {
        $("#" + day + "_temperature").html(Math.round(now[0].temperature));
      }
      else {
        $("#" + day + "_temperature").html(toCelsius(Math.round(now[0].temperature)));
      }
    }
    
    $("#" + day + "_day").html(getDayString(d.getDay()));
    $("#" + day + "_temperature_low").html(minTemperature);
    $("#" + day + "_temperature_high").html(maxTemperature);
    $("#" + day + "_time_low").html(minTempTime);
    $("#" + day + "_time_high").html(maxTempTime);
    $("#" + day + "_sunset_time").html("Sunset: " + sunsetTime);
    $("#" + day + "_icon_morning").html(getIcon(morningIcon));
    $("#" + day + "_temperature_morning").html(morningTemp);
    $("#" + day + "_icon_afternoon").html(getIcon(afternoonIcon));
    $("#" + day + "_temperature_afternoon").html(afternoonTemp);
    $("#" + day + "_icon_evening").html(getIcon(eveningIcon));
    $("#" + day + "_temperature_evening").html(eveningTemp);
   
    $("#" + day + "_hourly_table").empty();
    for(var i=0;i<data.hourly.data.length;i++) {
      var time = getTimeString(i);
      var temperature = Math.round(data.hourly.data[i].temperature);
      if(!fahrenheit) {
        temperature = toCelsius(temperature);
      }
      var precip = Math.round(data.hourly.data[i].precipProbability * 100);
      var conditions = data.hourly.data[i].summary;
      
      var tableRow = "";
      if(currentHour == i && (day == "td")) {
        tableRow = '<tr class="shaded">';
      }
      else {
        tableRow = '<tr>';
      }
      tableRow += '<td>' + time + '</td>';
      tableRow += '<td class="temperature">';
      tableRow += '<span id="' + day + '_temperature_' + i + '">' + temperature + '</span> ° ';
      if(fahrenheit) {
        tableRow += '<span class="unit">F</span></td>';
      }
      else {
        tableRow += '<span class="unit">C</span></td>';
      }
      tableRow += '<td><i class="fa fa-tint" aria-hidden="true"></i> ' + precip + '%</td>';
      tableRow += '<td>' + conditions + '</td>';
      tableRow += '</tr>';
      
      $("#" + day + "_hourly_table").append(tableRow);
    }
    $("#content_two_day").stop().css("display", "flex").hide().fadeIn();
    $(".temperature").unbind().click(convertUnits);
    if(day=="tm") { twoDayUpdated = true; }
  });
}

/* Searches the address/location that the user typed
 * in the search box, and then calls the necessary
 * functions to get the weather data and update the
 * page content.
 *
 * This is the only function that needs to be called
 * upon use of the address search box.
 *
 * Mode: Two-day only
 */
function searchLocation() {
  $("#content_two_day").fadeOut();
  var address = $("#address").val();
  $.getJSON(getCoordinatesLookupURL(address), function(data) {
    if(data.status == "ZERO_RESULTS") {
      $("#current_location").html("Location not found.");
      global_lat = -1;
      global_long = -1;
      return false;
    }
    var lat = data.results[0].geometry.location.lat;
    var long = data.results[0].geometry.location.lng;
    var locationName = data.results[0].formatted_address;
    $("#current_location").html(locationName);
    if(mode == two_day) {
      sevenDayUpdated = false;
      getTwoDayWeather(lat,long);
    }
    else {
      twoDayUpdated = false;
      getSevenDayWeather(lat,long);
    } 
    console.log("new lat: " + lat);
    console.log("new long: " + long);
    global_lat = lat;
    global_long = long;
  });
}

/* A hack to reload the page in https mode.  This is
 * necessary because HTML5 Geolocation does not work
 * without https, as well as the fact that we use https
 * resources for our APIs.
 *
 * Mode: Two-day and Seven-day
 */
function redirectToHttps() {
  var loc = window.location.href+'';
  if (loc.indexOf('http://')===0){
      window.location.href = loc.replace('http://','https://');
  }
}

/* Toggles all on-screen temperature values between
 * celsius and fahrenheit and toggles the unix text
 * between C and F
 *
 * Uses the 'fahrenheit' boolean value to determine
 * whether we are currently in F or C mode.
 *
 * Mode: Two-day and Seven-day
 */
function convertUnits() {
  if(fahrenheit) {
      $("[id*=temperature]").html(function(index, f) {
        return toCelsius(f);
      });
      $(".unit").html("C");
      fahrenheit = false;
    }
    else {
      $("[id*=temperature]").html(function(index, c) {
        return toFahrenheit(c);
      });
      $(".unit").html("F");
      fahrenheit = true;
    }
}

/* Converts a fahrenheit temperature to celsius.
 * Returns the calculated celsius value.
 *
 */
function toCelsius(f) {
  return Math.round(((f - 32) * (5/9) * 10) / 10);
}

/* Converts a celsius temperature to fahrenheit.
 * Returns the calculated fahrenheit value.
 *
 */
function toFahrenheit(c) {
  return Math.round(c * 9/5 + 32);
}

/* Main function to switch to seven-day mode.
 * Calls all the necessary helper functions
 * to update global variables and change
 * content display.
 */
function enableSevenDay() {
  if(mode == seven_day) { return false; }
  $("#nav_2day").parent().removeClass("active");
  $("#nav_7day").parent().addClass("active");
  mode = seven_day;
  $("#content_two_day").stop().fadeOut(function() {
    if(!sevenDayUpdated && ((global_lat != -1) && (global_long != -1))) {
      getSevenDayWeather(global_lat, global_long);
    }
    else if(sevenDayUpdated) {
      $("#content_seven_day").stop().css("display", "flex").hide().fadeIn();
    }
  });
}

/* Main function to switch to two-day mode.
 * Calls all the necessary helper functions
 * to update global variables and change
 * content display.
 */
function enableTwoDay() {
  if(mode == two_day) { return false; }
  $("#nav_2day").parent().addClass("active");
  $("#nav_7day").parent().removeClass("active");
  mode = two_day;
  $("#content_seven_day").stop().fadeOut(function() {
    if(!twoDayUpdated && ((global_lat != -1) && (global_long != -1))) {
      getTwoDayWeather(global_lat, global_long);
    }
    else if(twoDayUpdated) {
      $("#content_two_day").stop().css("display", "flex").hide().fadeIn();
    }
  });
}


$(document).ready(function() {
  redirectToHttps();
  getCurrentLocation();
  $("#get_weather_button").click(searchLocation);
  $("#detect_location_button").click(getCurrentLocation);
  $("#nav_2day").click(enableTwoDay);
  $("#nav_7day").click(enableSevenDay);
  $("#address").keypress(function(e) {
    if (e.which == 13) {
      searchLocation();
      e.preventDefault();
    }
  });
});